import os
import tempfile
import urllib.request
from celery import Celery
from supabase import create_client, Client
from app.pipeline.frame_extractor import extract_keyframes
from app.models.vision_checker import evaluate_craft_frames

celery_app = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

supabase: Client = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://mock.supabase.co"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "mock_key")
)

@celery_app.task(bind=True, max_retries=3)
def process_verification_reel(self, reel_id: str):
    try:
        # 1. Fetch reel details
        reel = supabase.table("verification_reels").select("*").eq("id", reel_id).single().execute().data
        if not reel:
            return {"error": "Reel not found"}

        # 2. Fetch vendor profile to retrieve registered brand logo
        vendor = None
        logo_url = None
        if reel.get("vendor_id"):
            vendor_res = supabase.table("profiles").select("avatar_url, full_name").eq("id", reel["vendor_id"]).single().execute()
            vendor = vendor_res.data if vendor_res else None
            logo_url = vendor.get("avatar_url") if vendor else None

        with tempfile.TemporaryDirectory() as tmp_dir:
            video_path = os.path.join(tmp_dir, "input_reel.mp4")
            frames_dir = os.path.join(tmp_dir, "frames")

            # 3. Download video from S3 / CDN URL
            urllib.request.urlretrieve(reel["video_url"], video_path)

            # 4. Extract Keyframes
            frames = extract_keyframes(video_path, frames_dir)

            # 5. Gemini Multimodal Vision Check with Registered Brand Logo Matching
            analysis = evaluate_craft_frames(frames, logo_url=logo_url)
            confidence = float(analysis.get("confidence_score", 0.0))

            # 6. Tiered verification threshold logic:
            # - Score < 85%: REJECTED
            # - 85% <= Score < 90%: PENDING_ADMIN_REVIEW
            # - 90% <= Score <= 100%: VERIFIED
            if confidence >= 0.90:
                status = "VERIFIED"
                tier = "HIGH_CONFIDENCE"
                notes = "Auto-verified with high confidence (≥90%)."
            elif confidence >= 0.85:
                status = "PENDING_ADMIN_REVIEW"
                tier = "MEDIUM_CONFIDENCE"
                notes = "Medium confidence score (85%-90%). Queued for manual admin triage."
            else:
                status = "REJECTED"
                tier = "LOW_CONFIDENCE"
                notes = f"AI verification failed (score: {confidence:.2f}, below 85% threshold)."

            # 7. Update database record with tiered fields
            supabase.table("verification_reels").update({
                "status": status,
                "confidence_score": confidence,
                "ai_confidence_score": confidence,
                "review_notes": notes,
                "extracted_metadata": {
                    **analysis,
                    "tier": tier
                }
            }).eq("id", reel_id).execute()

            # 8. If auto-verified (≥90%), mark maker profile as verified
            if status == "VERIFIED":
                supabase.table("profiles").update({
                    "vendor_verified": True,
                    "kyc_status": "PASSED"
                }).eq("id", reel["vendor_id"]).execute()

            return {"status": status, "confidence": confidence, "tier": tier}

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            supabase.table("verification_reels").update({
                "status": "PENDING_ADMIN_REVIEW",
                "review_notes": f"Processing exception: {str(exc)}"
            }).eq("id", reel_id).execute()
        raise self.retry(exc=exc, countdown=10)
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

            # 3. Download video from S3 URL
            urllib.request.urlretrieve(reel["video_url"], video_path)

            # 4. Extract Keyframes
            frames = extract_keyframes(video_path, frames_dir)

            # 5. Gemini Multimodal Vision Check with Registered Brand Logo Matching
            analysis = evaluate_craft_frames(frames, logo_url=logo_url)
            confidence = float(analysis.get("confidence_score", 0.0))

            # 6. Routing logic (>= 0.85 -> AUTO_APPROVED, else NEEDS_REVIEW)
            status = "AUTO_APPROVED" if confidence >= 0.85 else "NEEDS_REVIEW"

            # 7. Update database record
            supabase.table("verification_reels").update({
                "status": status,
                "confidence_score": confidence,
                "extracted_metadata": analysis
            }).eq("id", reel_id).execute()

            # 8. If auto-approved, mark maker profile as verified
            if status == "AUTO_APPROVED":
                supabase.table("profiles").update({
                    "vendor_verified": True
                }).eq("id", reel["vendor_id"]).execute()

            return {"status": status, "confidence": confidence}

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            supabase.table("verification_reels").update({"status": "NEEDS_REVIEW"}).eq("id", reel_id).execute()
        raise self.retry(exc=exc, countdown=10)
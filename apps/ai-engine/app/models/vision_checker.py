import os
import json
import urllib.request
import tempfile
from google import genai
from google.genai import types

def evaluate_craft_frames(frame_paths: list[str], logo_url: str = None) -> dict:
    """Evaluates video keyframes for craft authenticity, brand logo/watermark matching, and serial marks"""
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    uploaded_files = []
    
    # 1. Upload video keyframes
    for path in frame_paths:
        uploaded_files.append(client.files.upload(file=path))
    
    # 2. Upload registered brand logo if available for matching
    logo_file = None
    if logo_url and logo_url.startswith("http"):
        try:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_logo:
                urllib.request.urlretrieve(logo_url, tmp_logo.name)
                logo_file = client.files.upload(file=tmp_logo.name)
                uploaded_files.append(logo_file)
        except Exception as e:
            print(f"Could not download registered brand logo: {e}")

    prompt = """
    Analyze these workshop and studio keyframes for artisan authenticity.
    Evaluate:
    1. Maker branding & watermark matching: Compare any logo, watermark (e.g. Artist handle, signature, studio logo, watermark overlay) visible in the video frames with reference branding.
    2. Authentic artisanal crafting activity: Recognize manual handcrafting, carving, wood/coconut/clay shaping, polishing, painting, joining, or sculpting.
    3. Sequential limited-edition batch marking or artisan signature (e.g. #04/50, signature engraving).

    Output JSON ONLY in this exact format:
    {
      "confidence_score": 0.94,
      "logo_detected": true,
      "logo_matched": true,
      "batch_marking": "#04/50",
      "liveness_verified": true,
      "summary": "Handcrafted artisanal craftsmanship detected. Maker branding/watermark and manual shaping verified."
    }
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[*uploaded_files, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    return json.loads(response.text)
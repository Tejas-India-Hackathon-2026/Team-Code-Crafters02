from __future__ import annotations

import os
import json
import re
import urllib.request
import tempfile
from typing import List, Dict, Optional, Any

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None  # type: ignore
    types = None  # type: ignore


def evaluate_craft_frames(
    frame_paths: List[str],
    logo_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates video keyframes for craft authenticity, brand logo/watermark matching,
    and serial marks with multi-model fallback and automated tempfile cleanup.
    """
    api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
    if not api_key or "mock" in api_key.lower() or genai is None:
        return {
            "confidence_score": 0.40,
            "logo_detected": False,
            "logo_matched": False,
            "batch_marking": "#00/50",
            "liveness_verified": False,
            "summary": "AI craft verification service unavailable or unconfigured.",
        }

    client = genai.Client(api_key=api_key)
    uploaded_files: List[Any] = []
    tmp_logo_path: Optional[str] = None

    try:
        # 1. Upload video keyframes
        for path in frame_paths:
            if os.path.exists(path):
                uploaded_files.append(client.files.upload(file=path))

        # 2. Upload registered brand logo if available for matching
        if logo_url and logo_url.startswith("http"):
            try:
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_logo:
                    tmp_logo_path = tmp_logo.name
                    urllib.request.urlretrieve(logo_url, tmp_logo_path)
                    logo_file = client.files.upload(file=tmp_logo_path)
                    uploaded_files.append(logo_file)
            except Exception as e:
                print(f"Could not download registered brand logo: {e}")

        prompt = """
        You are the strict AI Authenticity Inspector for Karigar Kart Artisan Marketplace.
        Analyze these workshop and studio video keyframes for genuine physical handcrafting.

        Strict Rules:
        1. If the keyframes show random content, gaming, memes, vehicles, scenery, animals, CGI, screen recordings, or mass factory automation -> assign confidence_score between 0.15 and 0.50 and state in summary why it was rejected.
        2. If the keyframes clearly show a human artisan actively handcrafting raw materials (wood, clay, fiber, metal, cloth) using physical hand tools -> assign confidence_score between 0.90 and 0.98.
        3. Check for any visible artisan logo, maker signature, or workshop watermark.

        Output JSON ONLY in this exact format:
        {
          "is_genuine_craft": true,
          "confidence_score": 0.94,
          "logo_detected": true,
          "logo_matched": true,
          "batch_marking": "#04/50",
          "liveness_verified": true,
          "summary": "Handcrafted artisanal craftsmanship detected. Maker branding/watermark and manual shaping verified."
        }
        """

        # 3. Multi-Model execution with fallback
        candidate_models: List[str] = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.5-flash"]
        last_error: Optional[Exception] = None

        for model_name in candidate_models:
            try:
                config_args: Dict[str, Any] = {
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                }
                config_obj = types.GenerateContentConfig(**config_args) if types else None

                response = client.models.generate_content(
                    model=model_name,
                    contents=[*uploaded_files, prompt],
                    config=config_obj,
                )

                if response and response.text:
                    clean_text = response.text.strip()
                    # Strip potential markdown code blocks
                    clean_text = re.sub(r"^```(?:json)?\n?", "", clean_text, flags=re.MULTILINE)
                    clean_text = re.sub(r"\n?```$", "", clean_text, flags=re.MULTILINE)
                    parsed_json = json.loads(clean_text)
                    if parsed_json.get("is_genuine_craft") is False and parsed_json.get("confidence_score", 0) >= 0.85:
                        parsed_json["confidence_score"] = 0.45
                    return parsed_json
            except Exception as model_err:
                last_error = model_err
                continue

        # If models failed, return graceful structured rejection
        print(f"Vision checker fallback triggered: {last_error}")
        return {
            "confidence_score": 0.40,
            "logo_detected": False,
            "logo_matched": False,
            "batch_marking": "#00/50",
            "liveness_verified": False,
            "summary": "Could not confirm authentic manual craftsmanship in the provided video frames.",
        }

    finally:
        # 4. Clean up local temporary file
        if tmp_logo_path and os.path.exists(tmp_logo_path):
            try:
                os.remove(tmp_logo_path)
            except OSError:
                pass
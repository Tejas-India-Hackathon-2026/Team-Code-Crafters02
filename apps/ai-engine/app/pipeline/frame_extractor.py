from __future__ import annotations

import os
import subprocess
from typing import List


def extract_keyframes(video_path: str, output_dir: str) -> List[str]:
    """
    Extracts 3-5 representative keyframes from video using FFmpeg with robust
    error handling, chronological ordering, and input validation.
    """
    if not video_path or not os.path.exists(video_path):
        print(f"Frame extractor: Video file not found at '{video_path}'")
        return []

    os.makedirs(output_dir, exist_ok=True)
    output_pattern = os.path.join(output_dir, "frame_%02d.jpg")

    # Extract 1 frame every 5-10 seconds (up to 5 keyframes)
    command = [
        "ffmpeg",
        "-y",
        "-i",
        video_path,
        "-vf",
        "fps=1/5",
        "-vframes",
        "5",
        output_pattern,
    ]

    try:
        subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            timeout=30,
        )
    except FileNotFoundError:
        print("Warning: FFmpeg binary not found on system PATH.")
    except subprocess.CalledProcessError as cpe:
        print(f"Warning: FFmpeg execution returned non-zero exit code: {cpe}")
    except Exception as exc:
        print(f"Warning: Unexpected error during frame extraction: {exc}")

    extracted_frames = [
        os.path.join(output_dir, f)
        for f in os.listdir(output_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    # Sort frames in chronological order (frame_01.jpg, frame_02.jpg, ...)
    extracted_frames.sort()
    return extracted_frames
from __future__ import annotations

import subprocess
import os
from typing import List

def extract_keyframes(video_path: str, output_dir: str) -> List[str]:
    """Extracts 3-5 representative keyframes from video using FFmpeg"""
    os.makedirs(output_dir, exist_ok=True)
    output_pattern = os.path.join(output_dir, "frame_%02d.jpg")
    
    # Extract 1 frame every 10 seconds (max 5 frames)
    command = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", "fps=1/10",
        "-vframes", "5",
        output_pattern
    ]
    
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    
    extracted_frames = [
        os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.endswith(".jpg")
    ]
    return extracted_frames
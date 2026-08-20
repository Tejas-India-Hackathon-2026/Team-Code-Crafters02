from __future__ import annotations

import os
import sys
from typing import Dict, Any

# Ensure project root (apps/ai-engine) is in sys.path regardless of execution method
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.workers.tasks import process_verification_reel

app = FastAPI(
    title="Karigar Kart - AI Verification Engine",
    description="Multimodal vision inspection microservice for craft authenticity and maker branding verification.",
    version="1.0.0",
)

# Enable CORS for local gateway and web app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VerifyRequest(BaseModel):
    reelId: str = Field(
        ...,
        min_length=1,
        description="Unique UUID or ID of the verification reel to process",
    )


class VerifyResponse(BaseModel):
    status: str
    jobId: str
    message: str


@app.get("/health", tags=["Health"])
def health_check() -> Dict[str, Any]:
    """Health check endpoint to verify microservice liveness and broker configuration."""
    return {
        "status": "healthy",
        "service": "ai-engine",
        "broker_configured": bool(os.getenv("CELERY_BROKER_URL")),
    }


@app.post(
    "/verify",
    response_model=VerifyResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Verification"],
)
def trigger_verification(payload: VerifyRequest) -> Dict[str, Any]:
    """Dispatches asynchronous multimodal video inspection task to the Celery worker queue."""
    try:
        task = process_verification_reel.delay(payload.reelId)
        return {
            "status": "QUEUED",
            "jobId": str(task.id),
            "message": "Verification task accepted and dispatched to Celery pipeline.",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to queue verification task: {str(exc)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
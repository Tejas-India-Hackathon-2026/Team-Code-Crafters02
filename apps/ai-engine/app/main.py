from fastapi import FastAPI
from pydantic import BaseModel
from app.workers.tasks import process_verification_reel

app = FastAPI(title="Artisan AI Verification Engine")

class VerifyRequest(BaseModel):
    reelId: str

@app.post("/verify")
def trigger_verification(payload: VerifyRequest):
    task = process_verification_reel.delay(payload.reelId)
    return {"status": "QUEUED", "jobId": str(task.id)}
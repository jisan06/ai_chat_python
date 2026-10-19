
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.ai_service import AIService

app = FastAPI(title="AI Chat App")

ai_service = AIService()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.get("/")
def home():
    return {"message": "AI Chat App Backend is running!"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    try:
        reply = await ai_service.chat(request.message)
        return ChatResponse(reply=reply)

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI provider request failed",
        )

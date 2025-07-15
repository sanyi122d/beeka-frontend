from fastapi import APIRouter
from app.openai_client import ask_study_buddy

router = APIRouter()

@router.post("/chat")
async def chat(data: dict):
    user_message = data.get("message")
    if not user_message:
        return {"error": "No message provided"}
    reply = ask_study_buddy(user_message, prompt_type="chat")
    return {"reply": reply}

@router.post("/generate-note")
async def generate_note(data: dict):
    content = data.get("content")
    if not content:
        return {"error": "No content provided"}
    note = ask_study_buddy(content, prompt_type="generate-note")
    return {"note": note}

@router.post("/generate-quiz")
async def generate_quiz(data: dict):
    content = data.get("content")
    if not content:
        return {"error": "No content provided"}
    quiz = ask_study_buddy(content, prompt_type="generate-quiz")
    return {"quiz": quiz}

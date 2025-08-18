# backend/app/main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Any, Dict
from .generator import generate_quiz
from openai import OpenAI
import traceback

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

app = FastAPI(
    title="CapstoneV1 Generator API",
    version="0.1.0",
    description="Testing the capstoneV1. Generates customizable math quizzes."
)

# CORS for your frontend dev server(s)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIChatRequest(BaseModel):
    prompt: str
    model: Optional[str] = "GPT-5"
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 1500

class AIChatResponse(BaseModel):
    content: str
    echo: Optional[str] = None
    model_used: Optional[str] = None

@app.post("/ai_chat", response_model=AIChatResponse)
def ai_chat(req: AIChatRequest):
    print(f"[backend] received prompt len={len(req.prompt)} first100={req.prompt[:100]!r}")
    api_key = os.getenv("POE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="POE_API_KEY not set on server")
    try:
        client = OpenAI(api_key=api_key, base_url="https://api.poe.com/v1")
        resp = client.chat.completions.create(
            model=req.model or "GPT-5",
            messages=[{"role": "user", "content": req.prompt}],
            temperature=req.temperature,
            max_tokens=max(1, req.max_tokens or 1500),
        )
        # Log raw summary
        try:
          print("[backend] api response id:", getattr(resp, "id", None), "choices:", len(resp.choices))
        except Exception:
          print("[backend] api response:", resp)

        content = ""
        if getattr(resp, "choices", None):
            # Be defensive
            msg = resp.choices[0].message if resp.choices[0] else None
            content = (getattr(msg, "content", None) or "").strip()

        if not content:
            print("[backend] empty content from API. Raw:", resp)

        return {"content": content, "echo": req.prompt[:200], "model_used": getattr(resp, "model", None)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI call failed: {type(e).__name__}: {e}")

class GenerateQuizRequest(BaseModel):
    topics: List[str] = Field(..., min_items=1, example=["Algebra", "Geometry"])
    quizType: Literal["mcq", "short"] = "mcq"
    numQuestions: int = Field(10, ge=1, le=50)
    gradeLevel: int = Field(8, ge=1, le=12)
    outputLanguage: str = "English"
    seed: Optional[int] = None

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.post("/generate_quiz")
def generate_quiz_endpoint(payload: GenerateQuizRequest) -> Dict[str, Any]:
    try:
        result = generate_quiz(payload.dict())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Run with:
# uvicorn app.main:app --reload
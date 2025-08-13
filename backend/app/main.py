# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Any, Dict
from .generator import generate_quiz

app = FastAPI(
    title="CapstoneV1 Generator API",
    version="0.1.0",
    description="Testing the capstoneV1. Generates customizable math quizzes."
)

# CORS for your frontend dev server(s)
origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
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
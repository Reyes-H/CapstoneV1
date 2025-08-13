# CapstoneV1 (FastAPI + React)

## Prerequisites
- Python 3.10+
- Node.js 18+

## How to start
Create a virtual environment and install dependencies:
```
pip install -r requirements.txt
```
Then activate the virtual environment.

## Backend
```
cd backend
uvicorn app.main:app --reload
```
### Testing:  
Open http://127.0.0.1:8000/health → {"status":"ok"}  
Open http://127.0.0.1:8000/docs → interactive Swagger UI
### Details:  
FastAPI (Python): defines the web API.  
/health: simple GET that returns {"status": "ok"}.
/generate_quiz: POST endpoint that accepts your quiz settings and returns JSON with metadata and questions.  
Uvicorn: the ASGI server that runs your FastAPI app (uvicorn app.main:app --reload).  
Pydantic models: validate and parse request bodies (GenerateQuizRequest).  
generator.py: your custom quiz logic.  

## Frontend
```
cd frontend
npm install
npm run dev
```
### Testing:    
Open http://localhost:5174/  
### Details:
Runs a development server (Vite) at http://localhost:5174.  
Renders the UI where you select topics, quiz type, number of questions, grade, and language.  
On “Generate,” it sends a POST request to the backend API with those options.  
Shows the returned questions, choices, and solutions.  
Pings the backend at /health to check connectivity (that’s the “Backend: Connected/Not reachable” badge).  
Reads the backend URL from .env.local (VITE_API_BASE) so you can switch environments without changing code.

## be <-> fe
How frontend and backend talk:  
Over HTTP with JSON:  
Frontend → Backend: POST /generate_quiz with a JSON payload like:  
{ topics: ["Algebra"], quizType: "mcq", numQuestions: 5, gradeLevel: 7, outputLanguage: "English", seed: 123 }  
Backend → Frontend: JSON response:  
metadata: topics, quizType, numQuestions, gradeLevel, outputLanguage, seed, generatedAt  
questions: array with id, topic, difficulty, stem, choices (if mcq), answer, workedSolution  

## CORS
Browsers enforce the Same-Origin Policy: a page at http://localhost:5174 can’t make requests to http://127.0.0.1:8000 unless the server explicitly allows it. CORS (Cross-Origin Resource Sharing) is how the server signals permission. In FastAPI, you add CORSMiddleware with allow_origins set to your frontend’s origin(s), for example: ["http://localhost:5174", "http://127.0.0.1:5174"]. When the browser makes a cross-origin request, it may send a preflight OPTIONS request. If the server responds with the right CORS headers (e.g., Access-Control-Allow-Origin), the real request proceeds.

## Structure
```
CapstoneV1/
├─ backend/
│  ├─ app/
│  │  ├─ __init__.py         # makes "app" a Python package
│  │  ├─ main.py             # FastAPI app, routes, CORS config
│  │  └─ generator.py        # quiz generation logic
│  ├─ requirements.txt       # Python dependencies (fastapi, uvicorn, etc.)
│  └─ .venv/                 # your Python virtual environment (local)
└─ frontend/
   ├─ src/
   │  ├─ App.jsx             # main React component (UI + API calls)
   │  ├─ main.jsx            # React entry point (mounts App)
   │  ├─ api.js              # small wrapper for fetch calls to the backend
   │  └─ index.css           # styles
   ├─ index.html             # base HTML for the Vite dev server
   ├─ .env.local             # VITE_API_BASE=http://127.0.0.1:8000 (or localhost)
   ├─ package.json           # frontend dependencies and scripts
   └─ vite.config.js         # optional dev proxy config (helps avoid CORS)
```
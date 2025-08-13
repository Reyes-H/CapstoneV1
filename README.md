# CapstoneV1 (FastAPI + React)

## Prerequisites
- Python 3.10+
- Node.js 18+

## Backend
```bash
cd backend
python -m venv .venv   # Windows: py -m venv .venv
# Activate:
# PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
# http://127.0.0.1:8000/health
```



# In cmd
conda activate capstonev1

# Backend
uvicorn app.main:app --reload  
Open http://127.0.0.1:8000/health → {"status":"ok"}  
Open http://127.0.0.1:8000/docs → interactive Swagger UI
What the backend uses

FastAPI (Python): defines the web API.
/health: simple GET that returns {"status": "ok"}.
/generate_quiz: POST endpoint that accepts your quiz settings and returns JSON with metadata and questions.
Uvicorn: the ASGI server that runs your FastAPI app (uvicorn app.main:app --reload).
Pydantic models: validate and parse request bodies (GenerateQuizRequest).
generator.py: your custom quiz logic.
Picks difficulty from the grade.
Generates Algebra/Geometry questions (expandable).
Creates MCQ choices if needed.
Adds a seed for reproducibility.
Optional “translation” stub to prefix text with a language tag.

# Frontend
npm run dev  
Open http://localhost:5174/  
What the frontend does

Runs a development server (Vite) at http://localhost:5174.
Renders the UI where you select topics, quiz type, number of questions, grade, and language.
On “Generate,” it sends a POST request to the backend API with those options.
Shows the returned questions, choices, and solutions.
Pings the backend at /health to check connectivity (that’s the “Backend: Connected/Not reachable” badge).
Reads the backend URL from .env.local (VITE_API_BASE) so you can switch environments without changing code.

# be <-> fe
How frontend and backend talk

Over HTTP with JSON:
Frontend → Backend: POST /generate_quiz with a JSON payload like:
{ topics: ["Algebra"], quizType: "mcq", numQuestions: 5, gradeLevel: 7, outputLanguage: "English", seed: 123 }
Backend → Frontend: JSON response:
metadata: topics, quizType, numQuestions, gradeLevel, outputLanguage, seed, generatedAt
questions: array with id, topic, difficulty, stem, choices (if mcq), answer, workedSolution

# CORS
What is CORS (and why it matters here)

Browsers enforce the Same-Origin Policy: a page at http://localhost:5174 can’t make requests to http://127.0.0.1:8000 unless the server explicitly allows it.
CORS (Cross-Origin Resource Sharing) is how the server signals permission.
In FastAPI, you add CORSMiddleware with allow_origins set to your frontend’s origin(s), for example:
["http://localhost:5174", "http://127.0.0.1:5174"]
When the browser makes a cross-origin request, it may send a preflight OPTIONS request. If the server responds with the right CORS headers (e.g., Access-Control-Allow-Origin), the real request proceeds.
Key points:
CORS is enforced by browsers; curl/Postman aren’t affected.
localhost and 127.0.0.1 are different origins. Be consistent or allow both.
If CORS is misconfigured, the frontend will show network/CORS errors even if you can hit the API in the browser or via curl.
You can avoid CORS in development by using a Vite proxy (frontend server forwards /api calls to the backend) or by serving the built frontend from FastAPI in production (single origin).


# Structure
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
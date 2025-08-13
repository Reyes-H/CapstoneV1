# backend/app/generator.py
import random, time, math
from typing import Any, Dict, List, Optional

def set_seed(seed: Optional[int]):
    if seed is not None:
        random.seed(seed)

def grade_to_difficulty(grade: int) -> str:
    if grade <= 4: return "Easy"
    if grade <= 8: return "Medium"
    return "Hard"

def translate_text(text: str, target_language: str) -> str:
    if target_language.lower() in ["english", "en"]:
        return text
    return f"[{target_language}] " + text  # stub for a real translator

def translate_question(q: Dict[str, Any], target_language: str) -> Dict[str, Any]:
    if target_language.lower() in ["english", "en"]:
        return q
    translated = dict(q)
    translated["stem"] = translate_text(q["stem"], target_language)
    if "choices" in q and q["choices"] is not None:
        translated["choices"] = [translate_text(c, target_language) for c in q["choices"]]
    translated["workedSolution"] = translate_text(q["workedSolution"], target_language)
    return translated

def gen_algebra_linear(difficulty: str, quiz_type: str) -> Dict[str, Any]:
    a = random.choice([1,2,3,4,5,6,7,8,9])
    b = random.randint(-12, 12)
    sol = random.randint(-10, 10)
    c = a * sol + b
    stem = f"Solve for x: {a}x + {b} = {c}"
    correct = str(sol)
    worked = f"{a}x + {b} = {c} ⇒ {a}x = {c - b} ⇒ x = {(c - b)}/{a} = {sol}"
    choices = None
    if quiz_type == "mcq":
        d1 = str((c + b) / a)
        d2 = str((b - c) / a)
        d3 = str((c - b) * a)
        options = {correct, d1, d2, d3}
        while len(options) < 4:
            options.add(str(sol + random.choice([-2, -1, 1, 2])))
        choices = list(options)[:4]
        random.shuffle(choices)
    return {
        "topic": "Algebra",
        "skills": ["linear-equations"],
        "difficulty": difficulty,
        "stem": stem,
        "choices": choices,
        "answer": correct,
        "workedSolution": worked,
    }

def gen_geometry_area_rectangle(difficulty: str, quiz_type: str) -> Dict[str, Any]:
    L = random.randint(2, 20)
    W = random.randint(2, 20)
    area = L * W
    units = random.choice(["cm", "m", "in"])
    stem = f"A rectangle has length {L}{units} and width {W}{units}. What is its area?"
    correct = f"{area} {units}^2"
    worked = f"Area = length × width = {L} × {W} = {area} {units}^2"
    choices = None
    if quiz_type == "mcq":
        d1 = f"{L+W} {units}"
        d2 = f"{2*(L+W)} {units}"
        d3 = f"{abs(L-W)} {units}^2"
        options = {correct, d1, d2, d3}
        while len(options) < 4:
            k = area + random.choice([-L, -W, +L, +W])
            options.add(f"{k} {units}^2")
        choices = list(options)[:4]
        random.shuffle(choices)
    return {
        "topic": "Geometry",
        "skills": ["area"],
        "difficulty": difficulty,
        "stem": stem,
        "choices": choices,
        "answer": correct,
        "workedSolution": worked,
    }

def generate_one(topic: str, difficulty: str, quiz_type: str) -> Dict[str, Any]:
    t = topic.strip().lower()
    if t == "algebra":
        return gen_algebra_linear(difficulty, quiz_type)
    if t == "geometry":
        return gen_geometry_area_rectangle(difficulty, quiz_type)
    # temporary fallback
    return gen_algebra_linear(difficulty, quiz_type)

def generate_quiz(payload: Dict[str, Any]) -> Dict[str, Any]:
    topics = payload.get("topics", [])
    quiz_type = payload.get("quizType", "mcq").lower()
    num_questions = int(payload.get("numQuestions", 10))
    grade = int(payload.get("gradeLevel", 8))
    lang = payload.get("outputLanguage", "English")
    seed = payload.get("seed", None)

    if not topics:
        raise ValueError("At least one topic is required.")
    topics = list(dict.fromkeys(topics))  # dedupe
    num_questions = max(1, min(50, num_questions))
    grade = max(1, min(12, grade))
    difficulty = grade_to_difficulty(grade)
    set_seed(seed)

    questions = []
    for i in range(num_questions):
        topic = topics[i % len(topics)]
        q = generate_one(topic, difficulty, quiz_type)
        q["id"] = f"Q{i+1}"
        if quiz_type == "mcq":
            opts = set(q.get("choices") or [])
            opts.add(q["answer"])
            q["choices"] = list(opts)
            while len(q["choices"]) < 4:
                q["choices"].append(str(random.randint(-10, 30)))
            q["choices"] = q["choices"][:4]
            random.shuffle(q["choices"])
        q = translate_question(q, lang)
        questions.append(q)

    return {
        "metadata": {
            "topics": topics,
            "quizType": quiz_type,
            "numQuestions": num_questions,
            "gradeLevel": grade,
            "outputLanguage": lang,
            "seed": seed,
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
        "questions": questions,
    }
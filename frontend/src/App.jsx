// frontend/src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { generateQuiz, health } from "./api";
import "./index.css";

const allTopics = ["Algebra", "Trigonometry", "Geometry", "Calculus"];
const languages = ["English", "Spanish", "French", "German", "Chinese"];

export default function App() {
  const [topics, setTopics] = useState(["Algebra"]);
  const [quizType, setQuizType] = useState("mcq");
  const [numQuestions, setNumQuestions] = useState(5);
  const [gradeLevel, setGradeLevel] = useState(7);
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [backendOK, setBackendOK] = useState(false);

  useEffect(() => {
    health().then(() => setBackendOK(true)).catch(() => setBackendOK(false));
  }, []);

  const disableGenerate = useMemo(
    () => loading || topics.length === 0 || !backendOK,
    [loading, topics, backendOK]
  );

  const toggleTopic = (t) => {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setQuiz(null);
    if (topics.length === 0) {
      setError("Please select at least one topic.");
      return;
    }
    setLoading(true);
    try {
      const data = await generateQuiz({
        topics,
        quizType,
        numQuestions: Number(numQuestions),
        gradeLevel: Number(gradeLevel),
        outputLanguage,
        seed: Date.now() % 100000, // simple variability
      });
      setQuiz(data);
    } catch (e) {
      setError(e.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Math Quiz Generator</h1>
        <div className={`status ${backendOK ? "ok" : "bad"}`}>
          Backend: {backendOK ? "Connected" : "Not reachable"}
        </div>
      </header>

      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label>Topics</label>
          <div className="chips">
            {allTopics.map((t) => (
              <label key={t} className={`chip ${topics.includes(t) ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={topics.includes(t)}
                  onChange={() => toggleTopic(t)}
                />
                {t}
              </label>
            ))}
          </div>
          <small>Select one or more.</small>
        </div>

        <div className="field">
          <label>Quiz Type</label>
          <div className="row">
            <label className="radio">
              <input
                type="radio"
                name="qt"
                value="mcq"
                checked={quizType === "mcq"}
                onChange={() => setQuizType("mcq")}
              />
              Multiple Choice
            </label>
            <label className="radio">
              <input
                type="radio"
                name="qt"
                value="short"
                checked={quizType === "short"}
                onChange={() => setQuizType("short")}
              />
              Short Word Problems
            </label>
          </div>
        </div>

        <div className="grid">
          <div className="field">
            <label>Number of Questions</label>
            <input
              type="number"
              min="1"
              max="50"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Grade Level</label>
            <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Output Language</label>
            <select
              value={outputLanguage}
              onChange={(e) => setOutputLanguage(e.target.value)}
            >
              {languages.map((lng) => (
                <option key={lng} value={lng}>
                  {lng}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="primary" disabled={disableGenerate}>
          {loading ? "Generating..." : "Generate"}
        </button>
        {error && <div className="error">{error}</div>}
      </form>

      {quiz && (
        <section className="card">
          <div className="meta">
            <strong>Summary</strong>
            <div>
              {quiz.metadata.numQuestions} questions • Grade {quiz.metadata.gradeLevel} • Type:{" "}
              {quiz.metadata.quizType.toUpperCase()}
            </div>
            <div>Topics: {quiz.metadata.topics.join(", ")}</div>
          </div>
          <ol className="list">
            {quiz.questions.map((q) => (
              <li key={q.id} className="item">
                <div className="subtle">
                  Topic: {q.topic} • Difficulty: {q.difficulty}
                </div>
                <div className="stem">{q.stem}</div>

                {q.choices && q.choices.length > 0 && (
                  <ul className="choices">
                    {q.choices.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                )}

                <details className="details">
                  <summary>Show solution</summary>
                  <div className="solution">
                    <div>
                      <strong>Answer:</strong> {q.answer}
                    </div>
                    <div>
                      <strong>Steps:</strong> {q.workedSolution}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="footer">
        <small>
          API base: {import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000"} •
          Last generated: {quiz?.metadata?.generatedAt || "-"}
        </small>
      </footer>
    </div>
  );
}
// frontend/src/App.jsx
import { useState } from "react";
import { aiChat } from "./api";

const DEFAULT_PROMPT = `
You are an experienced professor and examination creator skilled in developing high-quality math tests. Your task is to create a math test based on the parameters provided below.

Requirements:

Test Structure:

Sections: Include sections for various types of questions as specified in the parameters.
Relevance: Ensure all questions are relevant to the chosen topic and appropriate for the intended audience.
Questions:

Quantity: Provide exactly the number of questions requested.
Content: Do not mention or suggest the recommended length for questions.
Formatting: Use correct numbering for each question.
Answers:

Only include answers if specifically requested in the parameters (include_answers: yes).
If answers are requested, provide them in a distinct section following the test.
Formatting:

HTML Structure: Respond using HTML formatting.
Math Representation: Enclose all mathematical expressions within <math-field> tags!!
Only use latex that matplotlib can understand. ( Matplotlib implements a lightweight TeX expression parser and layout engine and Mathtext is the subset of Tex markup that this engine supports. The layout engine is a fairly direct adaptation of the layout algorithms in Donald Knuth's TeX) Therefore, dont include latex such as: /begin.
Readability: Utilize bullet points, numbering, italics, and appropriate spacing to ensure the test is easy to read and understand.

DO NOT INCLUDE PICTURES OR IMAGES IN THE OUTPUT.

Parameters:
`;

function buildPrompt({ topics, quizType, numQuestions, gradeLevel, language, extra }) {
  const snippets = [];

  if (topics?.length) snippets.push(`Topics: ${topics.join(", ")}`);
  if (quizType) snippets.push(`Question type: ${quizType === "mcq" ? "Multiple choice" : "Short answer"}`);
  if (numQuestions) snippets.push(`Number of questions: ${numQuestions}`);
  if (gradeLevel) snippets.push(`Grade level: ${gradeLevel}`);
  if (language) snippets.push(`Language: ${language}`);

  // Optional mapping to difficulty by grade (example)
  if (gradeLevel <= 4) snippets.push("Target difficulty: easy");
  else if (gradeLevel <= 8) snippets.push("Target difficulty: medium");
  else snippets.push("Target difficulty: medium to hard");

  if (extra?.trim()) snippets.push(`Additional instructions: ${extra.trim()}`);

  return `${DEFAULT_PROMPT}\n\nRequirements:\n${snippets.map(s => `- ${s}`).join("\n")}\n`;
}

export default function App() {
  const [topics, setTopics] = useState(["Algebra"]);
  const [quizType, setQuizType] = useState("mcq"); // "mcq" | "short_answer"
  const [numQuestions, setNumQuestions] = useState(5);
  const [gradeLevel, setGradeLevel] = useState(7);
  const [language, setLanguage] = useState("English");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    try {
      setLoading(true);
      setError("");
      setResult("");
      const prompt = buildPrompt({ topics, quizType, numQuestions, gradeLevel, language, extra });
      console.log("[frontend] built prompt:", prompt);
      const { content } = await aiChat(prompt, { model: "GPT-5", temperature: 0.2 });
      setResult(content);
      // Optional: try to parse JSON and set into state to render structured UI
      // const parsed = JSON.parse(content);
      // ... render parsed.questions ...
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>AI Math Quiz Generator</h1>

      {/* Example controls — replace with your existing ones */}
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          Topics (comma-separated):
          <input
            type="text"
            value={topics.join(", ")}
            onChange={(e) => setTopics(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          />
        </label>

        <label>
          Quiz type:
          <select value={quizType} onChange={(e) => setQuizType(e.target.value)}>
            <option value="mcq">Multiple Choice</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </label>

        <label>
          Number of questions:
          <input
            type="number"
            min={1}
            max={50}
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value || "1", 10))}
          />
        </label>

        <label>
          Grade level:
          <input
            type="number"
            min={1}
            max={12}
            value={gradeLevel}
            onChange={(e) => setGradeLevel(parseInt(e.target.value || "1", 10))}
          />
        </label>

        <label>
          Language:
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>Chinese</option>
          </select>
        </label>

        <label>
          Additional instructions (optional):
          <textarea
            rows={3}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="e.g., emphasize word problems, include fractions, avoid calculators"
          />
        </label>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate with AI"}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h2>Result (raw)</h2>
        {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
        <textarea
          readOnly
          value={result}
          rows={16}
          style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
          placeholder="AI response will appear here as JSON or text"
        />
      </div>
    </div>
  );
}
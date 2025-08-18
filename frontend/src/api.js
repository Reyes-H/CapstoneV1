// frontend/src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function aiChat(prompt, options = {}) {
  console.log("[frontend] sending prompt:", prompt.slice(0, 200), "len=", prompt.length);
  const body = {
    prompt,
    model: options.model || "GPT-5",
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 1500,
  };

  const res = await fetch(`${API_BASE}/ai_chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  console.log("[frontend] raw response:", raw);
  if (!res.ok) throw new Error(`AI chat error: ${res.status} ${raw}`);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Server returned non-JSON body");
  }
}

export async function generateQuiz(payload) {
  const res = await fetch(`${API_BASE}/generate_quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function health() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Backend not reachable");
  return res.json();
}
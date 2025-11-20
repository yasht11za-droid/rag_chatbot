// src/generator.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const PROVIDER = process.env.EMBED_PROVIDER || 'gemini';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
const GEN_MODEL = process.env.GEN_MODEL || 'gemini-pro';

// Build the system prompt that forces answers to be taken only from sources.
function buildPrompt(chunks, userQuery) {
  const ctx = (chunks || []).map((c, i) => {
    return `SOURCE ${i+1} [doc:${c.document_id} chunk:${c.chunk_index} distance:${c.distance}]
${c.text}`;
  }).join('\n\n---\n\n');

  return `You are a helpful assistant. YOU MUST ONLY USE THE TEXT IN THE PROVIDED SOURCES to answer.
If the answer cannot be found in the sources, reply exactly: "Mujhe is document mein iska jawab nahi mila."

SOURCES:
${ctx}

User question: ${userQuery}

Answer concisely in Hindi (or in the user's language). At the end write "SOURCES:" and list the used source indices and document ids.
`;
}

export async function generateAnswerFromChunks(chunks, userQuery) {
  const prompt = buildPrompt(chunks, userQuery);

  if (PROVIDER === 'gemini') {
    if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');

    // Example Gemini generation endpoint — update per current docs
    const url = 'https://generativeai.googleapis.com/v1beta2/models/' + encodeURIComponent(GEN_MODEL) + ':generateText';
    const body = { prompt, max_tokens: 800 };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GEMINI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini generate failed: ${res.status} ${t}`);
    }
    const j = await res.json();
    // adjust to actual response shape
    const answer = j?.candidates?.[0]?.content ?? j?.output ?? JSON.stringify(j);
    return answer;
  } else {
    // Mistral example
    if (!MISTRAL_KEY) throw new Error('MISTRAL_API_KEY not set');

    const url = 'https://api.mistral.ai/v1/generate'; // placeholder
    const body = { model: GEN_MODEL, input: prompt, max_tokens: 800 };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Mistral generate failed: ${res.status} ${t}`);
    }
    const j = await res.json();
    const answer = j?.outputs?.[0]?.text ?? JSON.stringify(j);
    return answer;
  }
}

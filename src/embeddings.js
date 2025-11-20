// src/embeddings.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const EMBED_PROVIDER = process.env.EMBED_PROVIDER || 'gemini';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;

// NOTE: These are example endpoints and response shapes. Replace with the exact
// endpoint and JSON path from your provider docs or official SDKs.

export async function getEmbedding(text) {
  if (!text || text.length === 0) return [];

  if (EMBED_PROVIDER === 'gemini') {
    if (!GEMINI_KEY) throw new Error('Set GEMINI_API_KEY in .env');

    // Example Gemini embeddings HTTP call (update path & body per current docs)
    const url = 'https://generativeai.googleapis.com/v1beta2/embeddings:generate'; // placeholder
    const body = {
      model: 'gemini-embed-001', // change to actual model name you will use
      input: text
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini embed failed: ${res.status} ${txt}`);
    }
    const j = await res.json();
    // Example: adjust to actual response shape (this is illustrative)
    // e.g., j.data[0].embedding OR j.embedding
    const embedding = j?.data?.[0]?.embedding ?? j?.embedding ?? null;
    if (!embedding) throw new Error('No embedding returned from Gemini');
    return embedding;
  } else {
    // Mistral
    if (!MISTRAL_KEY) throw new Error('Set MISTRAL_API_KEY in .env');

    const url = 'https://api.mistral.ai/v1/embeddings'; // placeholder
    const body = {
      model: 'mistral-embed', // change to actual model id
      input: text
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Mistral embed failed: ${res.status} ${txt}`);
    }
    const j = await res.json();
    const embedding = j?.data?.[0]?.embedding ?? j?.embedding ?? null;
    if (!embedding) throw new Error('No embedding returned from Mistral');
    return embedding;
  }
}

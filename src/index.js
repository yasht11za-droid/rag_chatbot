// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { searchRelevantChunks } from './search.js';
import { generateAnswerFromChunks } from './generator.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('RAG Chatbot server up'));

app.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query (string) is required in body' });
    }

    // 1) retrieve relevant chunks from Supabase (vector search)
    const chunks = await searchRelevantChunks(query, Number(process.env.TOP_K || 6));

    if (!chunks || chunks.length === 0) {
      // No relevant chunks found in KB
      return res.json({
        answer: "Mujhe is document mein iska jawab nahi mila.",
        sources: []
      });
    }

    // 2) generate answer using LLM, strictly based on chunks
    const answer = await generateAnswerFromChunks(chunks, query);

    // 3) return
    res.json({ answer, sources: chunks });
  } catch (err) {
    console.error('Error /chat', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

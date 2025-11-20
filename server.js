import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from './src/embeddings.js'; // Assuming this function is in ./src/embeddings.js

// Load environment variables from .env file
dotenv.config();

const app = express();
// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// --- Chat Endpoint ---
app.post('/chat', async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Query missing' });
    }

    try {
        // 1. Get embedding for user query
        const embedding = await getEmbedding(query);

        // 🚨 FIX: Validate the embedding result before calling .join()
        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
            console.error('getEmbedding failed: Returned invalid or empty result.', embedding);
            // Throw an error to be caught by the outer catch block
            throw new Error('Failed to generate a valid vector embedding for the query.');
        }

        // 2. Search in Supabase chunks table using vector similarity
        // The array is converted to a string format for the PostgreSQL L2 distance operator (<->)
const { data, error } = await supabase.rpc('match_chunks', {
  query_vector: embedding
});

if (error) throw error;

res.json({ results: data.map(d => d.text) });

        
    } catch (err) {
        console.error('Internal Server Error in /chat:', err.message);
        res.status(500).json({ error: 'Internal Server Error processing request.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
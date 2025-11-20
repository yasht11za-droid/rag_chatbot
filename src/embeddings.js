import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const EMBED_PROVIDER = process.env.EMBED_PROVIDER || 'mistral';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export async function getEmbedding(text) {
    if (EMBED_PROVIDER === 'mistral') {
        if (!MISTRAL_API_KEY) {
            throw new Error('MISTRAL_API_KEY is not set in environment variables.');
        }
        
        const response = await fetch('https://api.mistral.ai/v1/embeddings', { // Added /v1
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Mistral API expects an array for input
                input: [text], 
                model: 'mistral-embed' // Recommended model name
            })
        });

        // 🚨 CRITICAL FIX 1: Check for API errors first
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Mistral API error: Status ${response.status}. Response: ${errorText}`);
        }
        
        const data = await response.json();
        
        // 🚨 CRITICAL FIX 2: Correctly access the embedding array
        // It's typically at data.data[0].embedding for Mistral's API structure.
        if (data && Array.isArray(data.data) && data.data.length > 0 && Array.isArray(data.data[0].embedding)) {
            return data.data[0].embedding; // returns array of 1024 numbers
        } else {
            console.error('Mistral API response format unexpected:', data);
            throw new Error('Mistral API returned an unexpected or malformed embedding structure.');
        }

    } else {
        throw new Error(`Unknown embed provider: ${EMBED_PROVIDER}`);
    }
}
import readline from "readline";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getEmbedding } from "../src/embeddings.js"; // tumhara embeddings.js

dotenv.config();

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Readline interface for console input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to fetch top relevant chunks from Supabase
async function fetchTopDocs(query) {
  const embeddingVector = await getEmbedding(query); // 1024-dim Mistral
  const { data, error } = await supabase.rpc('match_documents', {
    match_count: 3,
    query_embedding: embeddingVector
  });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }
  return data;
}


// Main chat function
async function chat() {
  rl.question("Ask something: ", async (question) => {
    const topDocs = await fetchTopDocs(question);

    console.log("Top docs:", topDocs);

    // Combine top docs text to prompt for LLM (simplified)
    const context = topDocs.map((d) => d.content).join("\n\n");

    // Generate answer using Gemini embedding/model (replace with your actual LLM call)
    try {
      // Example using getEmbedding just to show flow; replace with actual text generation
      console.log("Context used for answer generation:\n", context);

      // TODO: call Gemini text generation API here with `context + question`
      console.log("Answer (mock): This is where Gemini would generate the answer.");

    } catch (err) {
      console.error("Error generating answer:", err);
    }

    rl.close();
  });
}

chat();

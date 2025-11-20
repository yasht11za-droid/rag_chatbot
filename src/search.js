// src/search.js
import { supabase } from './db.js';
import { getEmbedding } from './embeddings.js';

const TOP_K = Number(process.env.TOP_K || 6);

export async function searchRelevantChunks(queryText, topK = TOP_K) {
  if (!queryText) return [];

  // 1) get embedding for query
  const qEmb = await getEmbedding(queryText);

  // 2) call Supabase RPC function (rpc_search_chunks)
  // Note: supabase.rpc accepts argument names as object fields; pass vector as JS array
  const { data, error } = await supabase
    .rpc('rpc_search_chunks', { query: qEmb, limit_rows: topK });

  if (error) {
    console.error('Supabase RPC error', error);
    throw error;
  }

  // data: array of rows with fields id, document_id, chunk_index, text, distance ...
  return data || [];
}

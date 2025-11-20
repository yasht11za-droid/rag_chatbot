// scripts/ingest-docx-pdf.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import * as pdfParseModule from "pdf-parse";
import * as mammothModule from "mammoth";

import { supabase } from "../src/db.js";
import { getEmbedding } from "../src/embeddings.js";

// Node v24 fix for default exports
const pdfParse = pdfParseModule.default ?? pdfParseModule;
const mammoth = mammothModule.default ?? mammothModule;

// ------------------------------
// CONFIG
// ------------------------------
const CHUNK_SIZE = 500; // words per chunk

// ------------------------------
// UTILS
// ------------------------------
function chunkText(text, chunkSize = CHUNK_SIZE) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push(chunkWords.join(" "));
  }

  return chunks;
}

async function extractDocx(filePath) {
  console.log("Extracting DOCX:", filePath);
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractPdf(filePath) {
  console.log("Extracting PDF:", filePath);
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

// ------------------------------
// INGEST LOGIC
// ------------------------------
async function ingestFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  let text = "";

  // 1) Extract Text
  if (ext === ".docx") {
    text = await extractDocx(filePath);
  } else if (ext === ".pdf") {
    text = await extractPdf(filePath);
  } else {
    console.log("Unsupported file:", filename);
    return;
  }

  if (!text || !text.trim()) {
    console.log("No text extracted from file:", filename);
    return;
  }

  // 2) Insert into documents table
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      filename,
      metadata: { type: ext.replace(".", "") },
    })
    .select()
    .single();

  if (docError) {
    console.error("Document insert error:", docError);
    return;
  }

  console.log("Document inserted with ID:", doc.id);

  // 3) Chunk text
  const chunks = chunkText(text);
  console.log("Chunks generated:", chunks.length);

  // 4) Embedding + insert chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      console.log(`Embedding chunk ${i + 1}/${chunks.length}...`);
      const embedding = await getEmbedding(chunk);

      const { error: chunkErr } = await supabase.from("chunks").insert({
        document_id: doc.id,
        chunk_index: i,
        text: chunk,
        embedding,
      });

      if (chunkErr) {
        console.error("Chunk insert error:", chunkErr);
      }
    } catch (err) {
      console.error("Embedding error:", err);
    }
  }

  console.log("Ingestion complete for:", filename);
}

// ------------------------------
// MAIN EXECUTION
// ------------------------------
const filePath = process.argv[2];

if (!filePath) {
  console.log("Usage: node scripts/ingest-docx-pdf.js ./files/myfile.docx");
  process.exit(1);
}

ingestFile(filePath)
  .then(() => {
    console.log("ALL DONE ✅");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

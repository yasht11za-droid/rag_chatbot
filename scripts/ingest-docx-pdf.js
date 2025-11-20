import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { supabase } from '../src/supabaseClient.js';
import { getEmbedding } from '../src/embeddings.js';
import dotenv from 'dotenv';
dotenv.config();

const filePath = process.argv[2];
if (!filePath) {
    console.error("Please provide a DOCX or PDF file path");
    process.exit(1);
}

async function extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.docx') {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } else if (ext === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return data.text;
    } else {
        throw new Error('Unsupported file type');
    }
}

function chunkText(text, chunkSize = 500) {
    const sentences = text.split(/\.\s+/);
    const chunks = [];
    let current = '';
    for (let sentence of sentences) {
        if ((current + sentence).length > chunkSize) {
            chunks.push(current);
            current = sentence + '. ';
        } else {
            current += sentence + '. ';
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

async function ingestFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`Extracting: ${fileName}`);
    const text = await extractText(filePath);
    const chunks = chunkText(text);

    // Insert document record
    const { data: doc, error: docErr } = await supabase
        .from('documents')
        .insert([{ name: fileName, metadata: { source: fileName } }])
        .select()
        .single();

    if (docErr) {
        console.error('Document insert error:', docErr);
        return;
    }

    console.log(`Document inserted with ID: ${doc.id}`);
    console.log(`Chunks generated: ${chunks.length}`);

    for (let i = 0; i < chunks.length; i++) {
        try {
            const embedding = await getEmbedding(chunks[i]);
            const { error: chunkErr } = await supabase.from('chunks').insert([{
                document_id: doc.id,
                chunk_index: i,
                text: chunks[i],
                token_count: chunks[i].split(' ').length,
                embedding
            }]);
            if (chunkErr) console.error('Chunk insert error:', chunkErr);
            else console.log(`Chunk ${i+1} inserted`);
        } catch (err) {
            console.error(`Embedding error for chunk ${i+1}:`, err.message);
        }
    }
    console.log(`Ingestion complete for: ${fileName}`);
}

ingestFile(filePath);

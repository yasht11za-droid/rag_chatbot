// src/db.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Please set SUPABASE_URL and SUPABASE_KEY in .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  // you can set auth options here if needed
});

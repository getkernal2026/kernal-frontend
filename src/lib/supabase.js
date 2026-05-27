// ── Supabase client — frontend only, anon key ─────────────────────────────────
// NEVER import supabaseAdmin or service_role key here. Those live on the
// backend only (kernal-backend/src/config/supabase.js).
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[Kernel] Supabase env vars missing. ' +
    'Copy .env.local.example → .env.local and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnon || '');

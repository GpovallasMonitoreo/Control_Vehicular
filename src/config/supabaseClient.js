// src/config/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ⚠️ REEMPLAZA ESTO CON TUS CLAVES DE SUPABASE (Settings -> API)
const SUPABASE_URL = 'https://dfyhwkjjsviztwmsdhkk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_XNXBtRIm-h-Tn24Xzkyocg_QhkSnCDb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
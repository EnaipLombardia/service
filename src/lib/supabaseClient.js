import { createClient } from '@supabase/supabase-js'

// Debug: stampa TUTTE le variabili d'ambiente disponibili
console.log('🔍 DEBUG - Tutte le env:', import.meta.env)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 SUPABASE_URL:', supabaseUrl)
console.log('🔍 SUPABASE_KEY:', supabaseAnonKey ? '✅ Presente' : '❌ Manca')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ VARIABILI MANCANTI! Verifica netlify.toml e le env su Netlify')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

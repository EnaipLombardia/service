import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl) // Debug: dovresti vedere l'URL in console
console.log('Supabase Key:', supabaseAnonKey ? '✅ Presente' : '❌ Manca')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

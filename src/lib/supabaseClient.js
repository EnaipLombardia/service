import { createClient } from '@supabase/supabase-js'

// 🔥 CONFIGURAZIONE SUPABASE 🔥
// URL e chiave dal tuo progetto Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bpjdjigfworwvyrgwsqh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamRqaWdmd29ydnZ5cmd3c3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDIxMjEsImV4cCI6MjEwMDg3ODEyMX0.ZKaUnOhz6LZ6X2eVExgvedHek_NSaUWnUht5_KI1Dbk'

console.log('🔍 SUPABASE_URL:', supabaseUrl)
console.log('🔍 SUPABASE_KEY:', supabaseAnonKey ? '✅ Presente' : '❌ Manca')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

// 🔥 VALORI PRESI DA SUPABASE SETTINGS → API 🔥
const supabaseUrl = 'https://bpjdjigfworwvyrgwsqh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamRqaWdmd29yd3Z5cmd3c3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDIxMjEsImV4cCI6MjEwMDg3ODEyMX0.ZKaUnOhz6LZ6X2eVExgvedHek_NSaUWnUht5_KI1Dbk'

console.log('🔍 SUPABASE_URL:', supabaseUrl)
console.log('🔍 SUPABASE_KEY:', supabaseAnonKey ? '✅ Presente' : '❌ Manca')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

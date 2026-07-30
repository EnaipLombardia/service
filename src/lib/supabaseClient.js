import { createClient } from '@supabase/supabase-js'

// 🔥 HARCODING PER TEST 🔥
// DOPO CHE FUNZIONA, RIMUOVI QUESTE RIGHE E METTI LE VARIABILI D'AMBIENTE
const supabaseUrl = 'https://bpjdjigfworwvyrgwsqh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamRqaWdmd29ydnZ5cmd3c3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NzYwNzksImV4cCI6MjA2MTU1MjA3OX0.2Z5tYrqfFqT_9_J1nVg7RVlF-PZqLcK-LxnZRHuDp1k'

console.log('🔍 SUPABASE_URL (hardcodato):', supabaseUrl)
console.log('🔍 SUPABASE_KEY (hardcodato):', supabaseAnonKey ? '✅ Presente' : '❌ Manca')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

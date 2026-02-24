import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging
console.log('[Supabase] URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('[Supabase] Key:', supabaseAnonKey ? 'SET' : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Log when client is created
console.log('[Supabase] Client created successfully')

export { supabaseUrl, supabaseAnonKey }

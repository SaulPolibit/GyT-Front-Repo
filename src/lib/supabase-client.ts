import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null

// Create a no-op mock client for SSR/build time
const createMockClient = (): SupabaseClient => {
  const noopChannel = {
    on: () => noopChannel,
    subscribe: () => noopChannel,
    unsubscribe: () => {},
  }

  return {
    channel: () => noopChannel,
    removeChannel: () => {},
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  } as unknown as SupabaseClient
}

function getSupabaseClient(): SupabaseClient {
  // Return cached instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // During SSR/build, return a mock client
  if (typeof window === 'undefined') {
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug logging (only at runtime in browser)
  console.log('[Supabase] URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.log('[Supabase] Key:', supabaseAnonKey ? 'SET' : 'MISSING')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return createMockClient()
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  console.log('[Supabase] Client created successfully')

  return supabaseInstance
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// Export helper to get URL/Key (also lazy)
export const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL
export const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

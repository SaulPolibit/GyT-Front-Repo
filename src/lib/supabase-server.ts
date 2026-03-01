import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseServerInstance: SupabaseClient | null = null

export function getSupabaseServerClient(): SupabaseClient | null {
  if (supabaseServerInstance) {
    return supabaseServerInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseServerInstance
}

export async function updateUserSubscriptionStatus(
  email: string,
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'paused' | null,
  subscriptionId?: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    console.error('[Supabase Server] No client available')
    return false
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: status,
        stripe_subscription_id: subscriptionId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email)

    if (error) {
      console.error('[Supabase Server] Error updating subscription status:', error)
      return false
    }

    console.log(`[Supabase Server] Updated subscription status for ${email}: ${status}`)
    return true
  } catch (error) {
    console.error('[Supabase Server] Exception updating subscription status:', error)
    return false
  }
}

export async function getUserByEmail(email: string) {
  const supabase = getSupabaseServerClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('[Supabase Server] Error fetching user:', error)
    return null
  }

  return data
}

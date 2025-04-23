import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks for development
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xwjxxmplfuvdemqkskbu.supabase.co"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

// Create a singleton instance of the Supabase admin client
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminInstance
}

export const supabaseAdmin = getSupabaseAdmin()

"use client"

import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xwjxxmplfuvdemqkskbu.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        // Set reasonable timeouts
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // 10 second timeout
            signal: AbortSignal.timeout(10000),
          })
        },
      },
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()

import { createClient } from '@supabase/supabase-js'

// These will be automatically provided by Lovable's Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// For demo purposes, we'll use demo values if environment variables are not set
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('Supabase environment variables not configured. Using demo authentication.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
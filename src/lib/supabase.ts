import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please add them to your .env file.');
}

// Initialize Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  year_of_study: number | null;
  expertise: string | null;
  domain: string | null;
  room_number: string | null;
  contact_info: string | null;
  created_at: string;
  updated_at: string | null;
};

// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkojdfzzirhykaqsnuqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprb2pkZnp6aXJoeWthcXNudXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Njc4MzgsImV4cCI6MjA2MTQ0MzgzOH0.CrZinyj1Yp7oohLiM-UQx69C5dXZNd-c2lLEQxNlpPA';

const supabaseConfig = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    // Agregar retry logic
    global: {
      headers: {
        'x-client-info': 'supabase-js'
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true
      }
    }
  };
  
  export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);

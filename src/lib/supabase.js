// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mmcvjnvtfbciwafjqzlq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tY3ZqbnZ0ZmJjaXdhZmpxemxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Njk1NjcsImV4cCI6MjA2MjA0NTU2N30.oG2kPJmJCAvEt81OUnOmmoKf_7IF0QQy2qaNa2VEfNk';

const supabaseConfig = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
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

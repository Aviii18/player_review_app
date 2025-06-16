// server/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Your actual Supabase credentials
const supabaseUrl = 'https://czxugdrtfsamddkvznqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6eHVnZHJ0ZnNhbWRka3Z6bnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDQ0OTUsImV4cCI6MjA2NTIyMDQ5NX0.8hcfAjLKvTKetrj0iH0WHF-Acg3B-DzrQRC84PvCTiw';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database table names
export const TABLES = {
  PLAYERS: 'players',
  ASSESSMENTS: 'assessments',
  VIDEOS: 'videos',
  SESSIONS: 'sessions'
};


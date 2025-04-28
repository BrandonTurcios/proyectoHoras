import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://seobksdfdoljkrglzfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb2Jrc2RmZG9samtyZ2x6Zm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTk0NzEsImV4cCI6MjA2MTQzNTQ3MX0.JWu5cz51YL3zfuoaBOp6W0duWSuERQI7uw71wU_DQHY';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Tablas necesarias:
// - users: id, email, password, role (admin/student), name, hours_required (para estudiantes), current_hours
// - tasks: id, title, description, assigned_hours, due_date, assigned_to (user_id), status (pending/completed/reviewed), space_id
// - submissions: id, task_id, student_id, description, images_urls[], submitted_at, reviewed_at, hours_granted
// - spaces: id, name, description
// - student_availability: id, student_id, day_of_week, start_time, end_time
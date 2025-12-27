import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ajsbopbuejhhaxwtbbku.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc2JvcGJ1ZWpoaGF4d3RiYmt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAwNjQ0OCwiZXhwIjoyMDgxNTgyNDQ4fQ.gNu0qPjU680p2Lc6qVKdA0nwi4UHQrg8Yzg6zXUyLbY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log('Testing Supabase connection...');

  // Test connection by checking if tables exist
  const { data: existingTables, error: checkError } = await supabase
    .from('script_engine_projects')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('Table script_engine_projects already exists!');
    return;
  }

  if (checkError && !checkError.message.includes('does not exist')) {
    console.log('Connection works, table does not exist yet');
  }

  console.log('\nNote: The Supabase JS client cannot execute raw DDL statements.');
  console.log('Please run the migration manually in the Supabase dashboard:');
  console.log('\n1. Go to: https://supabase.com/dashboard/project/ajsbopbuejhhaxwtbbku/sql');
  console.log('2. Paste the contents of: supabase/migrations/001_script_engine_projects.sql');
  console.log('3. Click "Run"\n');

  // Read and display the SQL for easy copy
  const sql = readFileSync('./supabase/migrations/001_script_engine_projects.sql', 'utf8');
  console.log('=== SQL TO RUN ===\n');
  console.log(sql);
}

runMigration();

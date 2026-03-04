const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_SERVICE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  const { data: d1, error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
      ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'ready';
      ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS processing_error text;
    `
  });

  if (e1) {
    console.error("RPC exec_sql probably doesn't exist, we will try another way or assume the user will do it.");
    console.error(e1);
  } else {
    console.log("Migration successful");
  }
}

run();

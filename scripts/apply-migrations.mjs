#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load env vars
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eflhqeofkenyczflqwkz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(file, name) {
  console.log(`\n📦 Running migration: ${name}...`);

  const sql = readFileSync(join(projectRoot, 'supabase', 'migrations', file), 'utf-8');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      // We'll use the REST API to execute raw SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        console.error(`❌ Failed: ${response.statusText}`);
        console.error('Note: You may need to run this migration manually in the Supabase SQL Editor');
        console.error(`URL: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`);
        return false;
      }
    }

    console.log(`✅ Success: ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ Error running ${name}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 VoChat - Applying Supabase Migrations\n');
  console.log(`Project URL: ${SUPABASE_URL}`);

  const migrations = [
    ['20260115000001_init.sql', 'Initial Schema'],
    ['20260115000002_rls.sql', 'Row Level Security'],
    ['20260115000003_usage.sql', 'Usage Tracking Functions']
  ];

  console.log('\n⚠️  NOTE: This script may not work due to Supabase API limitations.');
  console.log('If it fails, please run the migrations manually via the SQL Editor:');
  console.log(`URL: https://supabase.com/dashboard/project/eflhqeofkenyczflqwkz/sql\n`);

  let success = true;

  for (const [file, name] of migrations) {
    const result = await runMigration(file, name);
    if (!result) {
      success = false;
      break;
    }
  }

  if (success) {
    console.log('\n✅ All migrations applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify tables in Supabase Dashboard');
    console.log('2. Create your first user via Auth');
    console.log('3. Run seed.sql to create default profiles');
  } else {
    console.log('\n⚠️  Some migrations failed. Please run them manually.');
    console.log('\nManual instructions in SETUP.md');
  }
}

main().catch(console.error);

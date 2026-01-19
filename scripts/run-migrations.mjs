#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Supabase connection details
const SUPABASE_PROJECT_REF = 'eflhqeofkenyczflqwkz';
const SUPABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_PASSWORD) {
  console.error('\n❌ Error: SUPABASE_DB_PASSWORD not found in environment');
  console.error('\nPlease set it:');
  console.error('export SUPABASE_DB_PASSWORD="your-database-password"');
  console.error('\nOr run migrations manually via SQL Editor:');
  console.error('https://supabase.com/dashboard/project/eflhqeofkenyczflqwkz/sql\n');
  process.exit(1);
}

// Connection string for Supabase (direct connection, not pooler)
const connectionString = `postgresql://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`;

async function runMigrations() {
  console.log('🚀 VoChat - Running Supabase Migrations\n');

  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
  });

  const migrations = [
    ['20260115000001_init.sql', 'Initial Schema'],
    ['20260115000002_rls.sql', 'Row Level Security'],
    ['20260115000003_usage.sql', 'Usage Tracking Functions'],
  ];

  try {
    for (const [file, name] of migrations) {
      console.log(`📦 Running migration: ${name}...`);

      const migrationSQL = readFileSync(
        join(projectRoot, 'supabase', 'migrations', file),
        'utf-8'
      );

      await sql.unsafe(migrationSQL);
      console.log(`✅ Success: ${name}\n`);
    }

    console.log('✅ All migrations applied successfully!\n');
    console.log('Next steps:');
    console.log('1. Start the web app: pnpm web');
    console.log('2. Create an account and login');
    console.log('3. Create your first app profile\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Migration failed:`, error.message);
    console.error('\nTry running migrations manually via SQL Editor:');
    console.error('https://supabase.com/dashboard/project/eflhqeofkenyczflqwkz/sql\n');
    await sql.end();
    process.exit(1);
  }
}

runMigrations();

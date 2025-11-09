#!/usr/bin/env node

/**
 * Setup Renewal Planning Database Tables
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 *
 * This script creates and seeds the required tables for renewal planning:
 * - roster_period_capacity (with 26 periods for 2025-2026)
 * - certification_renewal_plans
 * - renewal_plan_history
 *
 * Usage: node setup-renewal-planning-db.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🚀 Renewal Planning Database Setup');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📡 Supabase URL:', SUPABASE_URL);
console.log('🔑 Using Key:', SUPABASE_KEY ? `${SUPABASE_KEY.substring(0, 20)}...` : 'NOT FOUND');
console.log('');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_KEY are set.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupDatabase() {
  try {
    // Step 1: Seed roster periods
    console.log('📅 Step 1: Seeding roster_period_capacity table...');
    console.log('   Creating 26 roster periods for 2025-2026\n');

    const rosterPeriods = [
      { roster_period: 'RP01/2025', period_start_date: '2025-02-01', period_end_date: '2025-02-28' },
      { roster_period: 'RP02/2025', period_start_date: '2025-03-01', period_end_date: '2025-03-28' },
      { roster_period: 'RP03/2025', period_start_date: '2025-03-29', period_end_date: '2025-04-25' },
      { roster_period: 'RP04/2025', period_start_date: '2025-04-26', period_end_date: '2025-05-23' },
      { roster_period: 'RP05/2025', period_start_date: '2025-05-24', period_end_date: '2025-06-20' },
      { roster_period: 'RP06/2025', period_start_date: '2025-06-21', period_end_date: '2025-07-18' },
      { roster_period: 'RP07/2025', period_start_date: '2025-07-19', period_end_date: '2025-08-15' },
      { roster_period: 'RP08/2025', period_start_date: '2025-08-16', period_end_date: '2025-09-12' },
      { roster_period: 'RP09/2025', period_start_date: '2025-09-13', period_end_date: '2025-10-10' },
      { roster_period: 'RP10/2025', period_start_date: '2025-10-11', period_end_date: '2025-11-07' },
      { roster_period: 'RP11/2025', period_start_date: '2025-11-08', period_end_date: '2025-12-05' },
      { roster_period: 'RP12/2025', period_start_date: '2025-12-06', period_end_date: '2026-01-02' },
      { roster_period: 'RP13/2025', period_start_date: '2026-01-03', period_end_date: '2026-01-30' },
      { roster_period: 'RP01/2026', period_start_date: '2026-01-31', period_end_date: '2026-02-27' },
      { roster_period: 'RP02/2026', period_start_date: '2026-02-28', period_end_date: '2026-03-27' },
      { roster_period: 'RP03/2026', period_start_date: '2026-03-28', period_end_date: '2026-04-24' },
      { roster_period: 'RP04/2026', period_start_date: '2026-04-25', period_end_date: '2026-05-22' },
      { roster_period: 'RP05/2026', period_start_date: '2026-05-23', period_end_date: '2026-06-19' },
      { roster_period: 'RP06/2026', period_start_date: '2026-06-20', period_end_date: '2026-07-17' },
      { roster_period: 'RP07/2026', period_start_date: '2026-07-18', period_end_date: '2026-08-14' },
      { roster_period: 'RP08/2026', period_start_date: '2026-08-15', period_end_date: '2026-09-11' },
      { roster_period: 'RP09/2026', period_start_date: '2026-09-12', period_end_date: '2026-10-09' },
      { roster_period: 'RP10/2026', period_start_date: '2026-10-10', period_end_date: '2026-11-06' },
      { roster_period: 'RP11/2026', period_start_date: '2026-11-07', period_end_date: '2026-12-04' },
      { roster_period: 'RP12/2026', period_start_date: '2026-12-05', period_end_date: '2027-01-01' },
      { roster_period: 'RP13/2026', period_start_date: '2027-01-02', period_end_date: '2027-01-29' },
    ];

    let insertedCount = 0;
    let skippedCount = 0;

    for (const period of rosterPeriods) {
      const { error } = await supabase
        .from('roster_period_capacity')
        .upsert([period], { onConflict: 'roster_period', ignoreDuplicates: true });

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`\n   ❌ ERROR: Table 'roster_period_capacity' does not exist!\n`);
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📝 MANUAL SETUP REQUIRED');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('\nThe database tables need to be created manually.');
          console.log('\nSteps:');
          console.log('  1. Open Supabase SQL Editor:');
          console.log('     https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new\n');
          console.log('  2. Copy the SQL from: setup-renewal-planning.sql\n');
          console.log('  3. Paste and execute in SQL Editor\n');
          console.log('  4. Re-run this script\n');
          console.log('═══════════════════════════════════════════════════════════\n');
          process.exit(1);
        }
        console.log(`   ⚠️  ${period.roster_period}: ${error.message}`);
        skippedCount++;
      } else {
        insertedCount++;
        process.stdout.write('.');
      }
    }

    console.log(`\n\n   ✅ Successfully inserted ${insertedCount} roster periods`);
    if (skippedCount > 0) {
      console.log(`   ℹ️  Skipped ${skippedCount} periods (already exist)`);
    }
    console.log('');

    // Step 2: Verify setup
    console.log('🔍 Step 2: Verifying database setup...\n');

    const { data: capacityData, error: verifyError } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date, period_end_date')
      .order('period_start_date');

    if (verifyError) {
      console.error('   ❌ Verification failed:', verifyError.message);
      process.exit(1);
    }

    if (!capacityData || capacityData.length === 0) {
      console.log('   ⚠️  No roster periods found in database');
      process.exit(1);
    }

    console.log(`   ✅ Found ${capacityData.length} roster periods in database\n`);
    console.log('   First 5 periods:');
    capacityData.slice(0, 5).forEach(p => {
      console.log(`      ${p.roster_period}: ${p.period_start_date} to ${p.period_end_date}`);
    });

    console.log(`\n   Last period:`);
    const lastPeriod = capacityData[capacityData.length - 1];
    console.log(`      ${lastPeriod.roster_period}: ${lastPeriod.period_start_date} to ${lastPeriod.period_end_date}`);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Database Setup Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📝 Next Steps:\n');
    console.log('1. Verify your user has admin/manager role:');
    console.log('   SELECT id, email, role FROM an_users WHERE email = \'your@email.com\';\n');
    console.log('2. If role needs updating:');
    console.log('   UPDATE an_users SET role = \'admin\' WHERE email = \'your@email.com\';\n');
    console.log('3. Log in to the application\n');
    console.log('4. Navigate to: /dashboard/renewal-planning/generate\n');
    console.log('5. Click "Generate Renewal Plan"\n');
    console.log('6. View plans at: /dashboard/renewal-planning\n');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('❌ Setup Failed');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run the setup
setupDatabase();

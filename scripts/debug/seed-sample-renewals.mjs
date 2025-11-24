#!/usr/bin/env node

/**
 * Seed Sample Renewal Plans
 * Quick script to insert sample renewal data to verify UI
 * Author: Maurice Rondeau
 */

import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
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

console.log('\n🌱 Seeding Sample Renewal Plans');
console.log('═══════════════════════════════════════════════════════════\n');

async function seedData() {
  try {
    // Step 1: Get some pilots
    console.log('1️⃣  Fetching pilots...');
    const pilotsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/pilots?select=id,first_name,last_name&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const pilots = await pilotsResponse.json();
    console.log(`   ✅ Found ${pilots.length} pilots\n`);

    if (pilots.length === 0) {
      console.log('   ❌ No pilots found. Cannot seed data.');
      return;
    }

    // Step 2: Get check types
    console.log('2️⃣  Fetching check types...');
    const checkTypesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/check_types?select=id,check_code,category&category=in.(Flight Checks,Simulator Checks,Ground Courses Refresher)&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const checkTypes = await checkTypesResponse.json();
    console.log(`   ✅ Found ${checkTypes.length} check types\n`);

    if (checkTypes.length === 0) {
      console.log('   ❌ No check types found. Cannot seed data.');
      return;
    }

    // Step 3: Get roster periods for 2026
    console.log('3️⃣  Fetching 2026 roster periods...');
    const periodsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/roster_period_capacity?select=roster_period,period_start_date&period_start_date=gte.2026-01-01&period_start_date=lte.2026-12-31&order=period_start_date`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const periods = await periodsResponse.json();
    console.log(`   ✅ Found ${periods.length} roster periods for 2026\n`);

    if (periods.length === 0) {
      console.log('   ❌ No roster periods found. Run setup-renewal-planning.sql first.');
      return;
    }

    // Step 4: Create sample renewal plans
    console.log('4️⃣  Creating sample renewal plans...');

    const samplePlans = [];
    const used = new Set(); // Track used combinations

    // Create unique renewal plans (one per pilot-checktype pair)
    for (let pilotIdx = 0; pilotIdx < pilots.length; pilotIdx++) {
      for (let checkIdx = 0; checkIdx < checkTypes.length; checkIdx++) {
        const pilot = pilots[pilotIdx];
        const checkType = checkTypes[checkIdx];
        const key = `${pilot.id}-${checkType.id}`;

        // Skip if already used
        if (used.has(key)) continue;
        used.add(key);

        const i = samplePlans.length;
        const period = periods[i % periods.length];

      // Set planned date first (the renewal date)
      const plannedDate = new Date(period.period_start_date);

      // Set expiry date AFTER the planned renewal date (30-90 days after)
      const expiryDate = new Date(plannedDate);
      expiryDate.setDate(expiryDate.getDate() + 30 + (i % 60)); // 30-90 days after renewal

      // Set renewal window around the planned date
      const windowStart = new Date(plannedDate);
      windowStart.setDate(windowStart.getDate() - 30);
      const windowEnd = new Date(expiryDate); // Window ends at expiry

      samplePlans.push({
        pilot_id: pilot.id,
        check_type_id: checkType.id,
        original_expiry_date: expiryDate.toISOString().split('T')[0],
        planned_renewal_date: plannedDate.toISOString().split('T')[0],
        planned_roster_period: period.roster_period,
        renewal_window_start: windowStart.toISOString().split('T')[0],
        renewal_window_end: windowEnd.toISOString().split('T')[0],
        status: 'SCHEDULED',  // Valid values: PENDING, SCHEDULED, COMPLETED, CANCELLED
        priority: i % 3 === 0 ? 8 : 5  // 8 = high priority, 5 = normal priority
      });
      }
    }

    // Insert the plans
    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/certification_renewal_plans`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(samplePlans)
      }
    );

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      throw new Error(`Failed to insert plans: ${error}`);
    }

    const inserted = await insertResponse.json();
    console.log(`   ✅ Created ${inserted.length} sample renewal plans\n`);

    // Step 5: Verify the data
    console.log('5️⃣  Verifying data...');
    const verifyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=count`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );

    const totalCount = verifyResponse.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`   ✅ Total renewal plans in database: ${totalCount}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Sample Data Seeded Successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📝 What was created:\n');
    console.log(`   • ${inserted.length} renewal plans across ${periods.length} roster periods`);
    console.log(`   • Using ${pilots.length} pilots and ${checkTypes.length} check types`);
    console.log(`   • Plans distributed across 2026 roster periods\n`);
    console.log('🎉 Next Steps:\n');
    console.log('   1. Navigate to: /dashboard/renewal-planning?year=2026');
    console.log('   2. You should now see populated data (not 0%)');
    console.log('   3. Each roster period card should show renewal counts\n');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('❌ Seeding Failed');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

seedData();

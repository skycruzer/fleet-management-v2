/**
 * Test RDO/SDO Report Generation
 *
 * Tests the report preview API to diagnose why it's showing 0 records
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing RDO/SDO Report Generation\n');

// Test 1: Direct database query (no filters)
console.log('📍 Test 1: Direct database query for FLIGHT requests');
const supabase = createClient(supabaseUrl, supabaseKey);

const { data: allFlight, error: error1 } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'FLIGHT')
  .order('start_date', { ascending: false });

if (error1) {
  console.log('❌ Error:', error1.message);
} else {
  console.log(`✅ Found ${allFlight.length} FLIGHT requests (no filters)`);
  allFlight.forEach(req => {
    console.log(`   - ${req.name} | ${req.request_type} | ${req.start_date} to ${req.end_date} | ${req.workflow_status}`);
  });
}

// Test 2: With date range filter (simulating what report might use)
console.log('\n📍 Test 2: Query with date range filter (2025-01-01 to 2026-12-31)');
const { data: withDateRange, error: error2 } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'FLIGHT')
  .gte('start_date', '2025-01-01')
  .lte('end_date', '2026-12-31')
  .order('start_date', { ascending: false });

if (error2) {
  console.log('❌ Error:', error2.message);
} else {
  console.log(`✅ Found ${withDateRange.length} FLIGHT requests (with date range)`);
  withDateRange.forEach(req => {
    console.log(`   - ${req.name} | ${req.request_type} | ${req.start_date} to ${req.end_date} | ${req.workflow_status}`);
  });
}

// Test 3: Check if end_date is NULL (potential issue)
console.log('\n📍 Test 3: Check if any FLIGHT requests have NULL end_date');
const { data: nullEndDate, error: error3 } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'FLIGHT')
  .is('end_date', null);

if (error3) {
  console.log('❌ Error:', error3.message);
} else {
  if (nullEndDate.length > 0) {
    console.log(`⚠️  Found ${nullEndDate.length} FLIGHT requests with NULL end_date`);
    nullEndDate.forEach(req => {
      console.log(`   - ${req.name} | ${req.request_type} | ${req.start_date} | NULL | ${req.workflow_status}`);
    });
  } else {
    console.log('✅ All FLIGHT requests have end_date set');
  }
}

// Test 4: Simulate report query with empty filters (default state)
console.log('\n📍 Test 4: Simulate report query with empty filters (no date range, no status)');
let query = supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'FLIGHT')
  .order('start_date', { ascending: false });

// No filters applied (this is what happens when user clicks Preview with default form values)

const { data: reportData, error: error4 } = await query;

if (error4) {
  console.log('❌ Error:', error4.message);
} else {
  console.log(`✅ Report would show ${reportData.length} FLIGHT requests`);
  reportData.forEach(req => {
    console.log(`   - ${req.name} | ${req.request_type} | ${req.start_date} to ${req.end_date} | ${req.workflow_status}`);
  });
}

console.log('\n✨ Test Complete!');

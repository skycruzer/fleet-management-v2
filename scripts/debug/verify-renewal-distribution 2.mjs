#!/usr/bin/env node

import fs from 'fs';

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

console.log('\n📊 Renewal Plans Distribution Report');
console.log('═══════════════════════════════════════════════════════════\n');

async function verifyDistribution() {
  // Get all renewal plans
  const plansResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=*,check_types(category)&order=planned_roster_period`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  const plans = await plansResponse.json();

  // Group by roster period
  const byPeriod = {};
  plans.forEach(plan => {
    const period = plan.planned_roster_period;
    if (!byPeriod[period]) {
      byPeriod[period] = { total: 0, categories: {} };
    }
    byPeriod[period].total++;

    const category = plan.check_types?.category || 'Unknown';
    byPeriod[period].categories[category] = (byPeriod[period].categories[category] || 0) + 1;
  });

  console.log(`Total Plans: ${plans.length}\n`);
  console.log('Distribution by Roster Period:\n');

  const periods = Object.keys(byPeriod).sort();
  periods.forEach(period => {
    const data = byPeriod[period];
    console.log(`${period}: ${data.total} renewals`);
    Object.entries(data.categories).forEach(([cat, count]) => {
      console.log(`  • ${cat}: ${count}`);
    });
  });

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

verifyDistribution().catch(console.error);

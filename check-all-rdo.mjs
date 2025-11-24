import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Checking ALL RDO/SDO Requests...\n');

const { data, error } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'FLIGHT')
  .order('start_date', { ascending: false });

if (error) {
  console.error('Error:', error.message);
} else if (data.length === 0) {
  console.log('No RDO/SDO requests found');
} else {
  console.log(`Found ${data.length} RDO/SDO request(s):\n`);
  let index = 1;
  for (const req of data) {
    console.log(`${index}. ${req.name}`);
    console.log(`   Type: ${req.request_type}`);
    console.log(`   Dates: ${req.start_date} to ${req.end_date || req.start_date}`);
    console.log(`   Roster Period (DB): ${req.roster_period}`);
    console.log(`   Status: ${req.workflow_status}`);
    console.log('');
    index++;
  }
}

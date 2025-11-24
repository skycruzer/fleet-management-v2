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

console.log('Checking NAMA MARIOLE RDO Request...\n');

const { data, error } = await supabase
  .from('pilot_requests')
  .select('*')
  .ilike('name', '%NAMA%MARIOLE%')
  .eq('request_category', 'FLIGHT');

if (error) {
  console.error('Error:', error.message);
} else if (data.length === 0) {
  console.log('No RDO requests found for NAMA MARIOLE');
} else {
  data.forEach(req => {
    console.log('Database Record:');
    console.log('================');
    console.log('ID:', req.id);
    console.log('Name:', req.name);
    console.log('Type:', req.request_type);
    console.log('Start Date:', req.start_date);
    console.log('End Date:', req.end_date);
    console.log('Roster Period (stored in DB):', req.roster_period);
    console.log('Status:', req.workflow_status);
  });
}

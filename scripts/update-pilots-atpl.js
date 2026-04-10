/**
 * Update all pilots to have ATPL licence type
 * Author: Maurice Rondeau
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updatePilotsToATPL() {
  console.log('Fetching all pilots...')

  // Check current state
  const { data: pilots, error: fetchError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, licence_type')

  if (fetchError) {
    console.error('Fetch Error:', fetchError.message)
    process.exit(1)
  }

  console.log('Total pilots:', pilots.length)

  // Count current licence types
  const atplCount = pilots.filter((p) => p.licence_type === 'ATPL').length
  const otherCount = pilots.length - atplCount
  console.log('Current ATPL holders:', atplCount)
  console.log('Pilots to update:', otherCount)

  if (otherCount === 0) {
    console.log('All pilots already have ATPL licence. No update needed.')
    return
  }

  // Update all pilots to ATPL
  const pilotIds = pilots.map((p) => p.id)
  const { error: updateError } = await supabase
    .from('pilots')
    .update({ licence_type: 'ATPL' })
    .in('id', pilotIds)

  if (updateError) {
    console.error('Update Error:', updateError.message)
    process.exit(1)
  }

  // Verify update
  const { data: updated, error: verifyError } = await supabase
    .from('pilots')
    .select('licence_type')
    .eq('licence_type', 'ATPL')

  if (verifyError) {
    console.error('Verify Error:', verifyError.message)
    process.exit(1)
  }

  console.log('\n✅ Update complete!')
  console.log('Total ATPL holders now:', updated.length)
}

updatePilotsToATPL().catch(console.error)

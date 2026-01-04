import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPilotLinkage() {
  console.log('🔧 Fixing pilot linkage for mrondeau@airniugini.com.pg...\n')

  const pilotId = '1df41aae-b556-4563-b5b2-43d92c47b5fa'
  const pilotUserId = '4d706ce8-1bc1-4df7-bcef-38f9a4f5f52e'

  const { data, error } = await supabase
    .from('pilot_users')
    .update({ pilot_id: pilotId })
    .eq('id', pilotUserId)
    .select()

  if (error) {
    console.error('❌ Error updating pilot_users:', error)
    return
  }

  console.log('✅ Successfully linked pilot_users to pilots table!')
  console.log('📋 Updated record:')
  console.log(JSON.stringify(data, null, 2))
}

fixPilotLinkage().catch(console.error)

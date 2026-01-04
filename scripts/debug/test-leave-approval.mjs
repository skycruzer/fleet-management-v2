/**
 * Test Leave Approval Dashboard
 * Tests the new leave approval workflow with skycruzer credentials
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLeaveApprovalDashboard() {
  console.log('🚀 Testing Leave Approval Dashboard...\n')

  try {
    // 1. Sign in with skycruzer credentials
    console.log('1️⃣ Signing in as skycruzer...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'skycruzer@example.com',
      password: 'your-password-here', // Update with actual password
    })

    if (authError) {
      console.error('❌ Authentication failed:', authError.message)
      console.log('\n💡 Please update the password in this script with your actual password')
      return
    }

    console.log('✅ Signed in successfully')
    console.log(`   User ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}\n`)

    // 2. Check user role
    console.log('2️⃣ Checking user role...')
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role, first_name, last_name')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      console.error('❌ Failed to fetch user data:', userError.message)
      return
    }

    console.log('✅ User role verified')
    console.log(`   Name: ${userData.first_name} ${userData.last_name}`)
    console.log(`   Role: ${userData.role}\n`)

    if (!['Admin', 'Manager'].includes(userData.role)) {
      console.log('⚠️  Note: Only Admin and Manager users can approve leave requests')
      console.log('   Your role needs to be Admin or Manager to test the approval dashboard\n')
    }

    // 3. Fetch pending leave requests
    console.log('3️⃣ Fetching pending leave requests...')
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('leave_requests')
      .select(
        `
        id,
        status,
        request_type,
        roster_period,
        start_date,
        end_date,
        pilots:pilot_id (
          first_name,
          last_name,
          role,
          seniority_number
        )
      `
      )
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('❌ Failed to fetch leave requests:', requestsError.message)
      return
    }

    console.log(`✅ Found ${pendingRequests.length} pending leave requests\n`)

    if (pendingRequests.length > 0) {
      console.log('📋 Sample Pending Requests:\n')
      pendingRequests.slice(0, 5).forEach((req, idx) => {
        console.log(
          `   ${idx + 1}. ${req.pilots.first_name} ${req.pilots.last_name} (${req.pilots.role})`
        )
        console.log(`      Type: ${req.request_type}`)
        console.log(`      Period: ${req.roster_period}`)
        console.log(`      Dates: ${req.start_date} to ${req.end_date}`)
        console.log(`      Seniority: #${req.pilots.seniority_number}`)
        console.log('')
      })
    } else {
      console.log('   No pending requests to display\n')
    }

    // 4. Test crew availability calculation
    console.log('4️⃣ Testing crew availability calculation...')

    // Get current date
    const today = new Date().toISOString().split('T')[0]

    // Get all approved/pending leave for next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const endDate = thirtyDaysFromNow.toISOString().split('T')[0]

    const { data: upcomingLeave, error: leaveError } = await supabase
      .from('leave_requests')
      .select(
        `
        id,
        start_date,
        end_date,
        pilots:pilot_id (
          role
        )
      `
      )
      .in('status', ['PENDING', 'APPROVED'])
      .lte('start_date', endDate)
      .gte('end_date', today)

    if (leaveError) {
      console.error('❌ Failed to fetch upcoming leave:', leaveError.message)
      return
    }

    console.log(`✅ Found ${upcomingLeave.length} upcoming leave requests\n`)

    // Calculate current crew availability
    const { count: totalPilotsCount } = await supabase
      .from('pilots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')

    const { count: captainsCount } = await supabase
      .from('pilots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')
      .eq('role', 'Captain')

    const { count: fosCount } = await supabase
      .from('pilots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')
      .eq('role', 'First Officer')

    console.log('5️⃣ Current Fleet Status:')
    console.log(`   Total Active Pilots: ${totalPilotsCount}`)
    console.log(`   Active Captains: ${captainsCount}`)
    console.log(`   Active First Officers: ${fosCount}`)
    console.log(`   Minimum Required: 10 per rank\n`)

    // Calculate currently on leave
    const onLeaveToday = upcomingLeave.filter((req) => {
      const start = new Date(req.start_date)
      const end = new Date(req.end_date)
      const now = new Date()
      return start <= now && end >= now
    })

    const captainsOnLeave = onLeaveToday.filter((req) => req.pilots.role === 'Captain').length
    const fosOnLeave = onLeaveToday.filter((req) => req.pilots.role === 'First Officer').length

    const captainsAvailable = captainsCount - captainsOnLeave
    const fosAvailable = fosCount - fosOnLeave

    console.log('6️⃣ Current Availability (Today):')
    console.log(`   Captains Available: ${captainsAvailable}/${captainsCount}`)
    console.log(`   First Officers Available: ${fosAvailable}/${fosCount}`)

    const captainsStatus =
      captainsAvailable >= 10 ? '✅ Safe' : captainsAvailable >= 8 ? '⚠️  Warning' : '🚨 Critical'
    const fosStatus =
      fosAvailable >= 10 ? '✅ Safe' : fosAvailable >= 8 ? '⚠️  Warning' : '🚨 Critical'

    console.log(`   Captains Status: ${captainsStatus}`)
    console.log(`   First Officers Status: ${fosStatus}\n`)

    // 7. Access instructions
    console.log('7️⃣ Access the Leave Approval Dashboard:\n')
    console.log('   URL: http://localhost:3000/dashboard/leave/approve')
    console.log('   Navigation: Dashboard → Requests → Leave Approval\n')

    console.log('✅ All tests completed successfully!\n')
    console.log('📖 Next Steps:')
    console.log('   1. Open http://localhost:3000 in your browser')
    console.log('   2. Sign in with your credentials')
    console.log('   3. Navigate to Leave Approval from the sidebar')
    console.log('   4. Test the following features:')
    console.log('      - Filter by status, period, rank, and type')
    console.log('      - Sort by priority, seniority, or date')
    console.log('      - View conflict warnings and crew minimum alerts')
    console.log('      - Test bulk approve/deny operations')
    console.log('      - Check crew availability widget\n')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  }
}

testLeaveApprovalDashboard()

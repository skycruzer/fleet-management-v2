#!/usr/bin/env node
/**
 * Complete Admin Login Flow Test
 * Tests the full login flow including middleware and session management
 *
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk';

const EMAIL = 'skycruzer@icloud.com';
const PASSWORD = 'mron2393';
const APP_URL = 'http://localhost:3000';

console.log('🔐 Complete Admin Login Flow Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCompleteFlow() {
  try {
    // Step 1: Test login authentication
    console.log('📝 Step 1: Testing Supabase Authentication\n');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${'*'.repeat(PASSWORD.length)}\n`);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });

    if (authError) {
      console.error('   ❌ Authentication Failed:', authError.message);
      return;
    }

    console.log('   ✅ Authentication Successful');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}\n`);

    // Step 2: Check user role in database
    console.log('📝 Step 2: Checking User Role\n');

    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('id, email, role, full_name')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError) {
      console.log('   ⚠️  Could not fetch user role:', userError.message);
    } else if (!userData) {
      console.log('   ⚠️  User not found in an_users table');
      console.log('   This might be okay if you are using email-based auth only');
    } else {
      console.log('   ✅ User Role Found');
      console.log(`   Full Name: ${userData.full_name || 'N/A'}`);
      console.log(`   Role: ${userData.role || 'N/A'}\n`);
    }

    // Step 3: Test protected endpoints with session cookies
    console.log('📝 Step 3: Testing Session-Based API Access\n');

    // Create cookies from session
    const cookies = [
      `sb-wgdmgvonqysflwdiiols-auth-token=${JSON.stringify({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      })}`,
    ].join('; ');

    const endpoints = [
      { name: 'Dashboard Metrics', path: '/api/dashboard/metrics' },
      { name: 'Pilots', path: '/api/pilots' },
      { name: 'Certifications', path: '/api/certifications' },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${APP_URL}${endpoint.path}`, {
          headers: {
            'Cookie': cookies,
            'Authorization': `Bearer ${authData.session.access_token}`,
          },
        });

        if (response.ok) {
          const json = await response.json();
          const count = json.data?.length || (typeof json.data === 'object' ? 'object' : 'N/A');
          console.log(`   ✅ ${endpoint.name}: ${response.status} (${count} records)`);
        } else {
          const text = await response.text();
          console.log(`   ❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
          if (text) console.log(`      Response: ${text.substring(0, 100)}`);
        }
      } catch (apiError) {
        console.log(`   ⚠️  ${endpoint.name}: ${apiError.message}`);
      }
    }

    // Step 4: Test middleware protection
    console.log('\n📝 Step 4: Testing Middleware Protection\n');

    try {
      const dashboardResponse = await fetch(`${APP_URL}/dashboard`, {
        redirect: 'manual',
        headers: {
          'Cookie': cookies,
        },
      });

      if (dashboardResponse.status === 200) {
        console.log('   ✅ Dashboard accessible with valid session');
      } else if (dashboardResponse.status === 307 || dashboardResponse.status === 308) {
        const location = dashboardResponse.headers.get('location');
        console.log(`   ⚠️  Dashboard redirected to: ${location}`);
      } else {
        console.log(`   ❌ Dashboard returned: ${dashboardResponse.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Dashboard test failed: ${error.message}`);
    }

    // Step 5: Test without session (should redirect)
    try {
      const noAuthResponse = await fetch(`${APP_URL}/dashboard`, {
        redirect: 'manual',
      });

      if (noAuthResponse.status === 307 || noAuthResponse.status === 308) {
        const location = noAuthResponse.headers.get('location');
        if (location?.includes('/auth/login')) {
          console.log('   ✅ Unauthenticated request correctly redirected to login');
        } else {
          console.log(`   ⚠️  Redirected to unexpected location: ${location}`);
        }
      } else if (noAuthResponse.status === 200) {
        console.log('   ❌ Dashboard accessible without authentication (SECURITY ISSUE!)');
      } else {
        console.log(`   ⚠️  Unexpected status: ${noAuthResponse.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  No-auth test failed: ${error.message}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Complete Login Flow Test Finished\n');
    console.log('📌 Next Steps:');
    console.log('   1. Visit http://localhost:3000/auth/login in your browser');
    console.log('   2. Login with skycruzer@icloud.com / mron2393');
    console.log('   3. You should be redirected to /dashboard\n');

  } catch (error) {
    console.error('💥 Unexpected Error:', error.message);
    console.error(error);
  }
}

testCompleteFlow();

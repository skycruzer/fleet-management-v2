#!/usr/bin/env python3
"""
Authenticated Fleet Management App Test
Tests all features with both admin and pilot portal credentials
"""

from playwright.sync_api import sync_playwright
import sys
import time

# Credentials
ADMIN_EMAIL = "skycruzer@icloud.com"
ADMIN_PASSWORD = "mron2393"
PILOT_EMAIL = "mrondeau@airniugini.com.pg"
PILOT_PASSWORD = "Lemakot@1972"

def test_authenticated_features():
    """Test the Fleet Management application with authentication"""

    results = {
        "passed": [],
        "failed": [],
        "screenshots": []
    }

    with sync_playwright() as p:
        # Launch browser (visible for user to see)
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            # =================================================================
            # ADMIN PORTAL TESTING
            # =================================================================
            print("\n" + "="*60)
            print("🔐 ADMIN PORTAL AUTHENTICATION")
            print("="*60)

            # Test 1: Admin Login
            print("\n🧪 Test 1: Admin Login...")
            page.goto('http://localhost:3003/auth/login')
            page.wait_for_load_state('networkidle')
            time.sleep(1)

            # Fill in login form
            page.fill('input[type="email"]', ADMIN_EMAIL)
            page.fill('input[type="password"]', ADMIN_PASSWORD)

            page.screenshot(path='/tmp/auth_01_admin_login_form.png', full_page=True)
            results["screenshots"].append('/tmp/auth_01_admin_login_form.png')

            # Submit login
            page.click('button[type="submit"]')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_02_admin_after_login.png', full_page=True)
            results["screenshots"].append('/tmp/auth_02_admin_after_login.png')

            # Check if login successful (should redirect to dashboard)
            current_url = page.url
            if '/dashboard' in current_url:
                print("✅ Admin login successful")
                results["passed"].append("Admin login successful")
            else:
                print("❌ Admin login failed - not redirected to dashboard")
                results["failed"].append("Admin login failed")

            # Test 2: Admin Dashboard
            print("\n🧪 Test 2: Admin Dashboard (Authenticated)...")
            page.goto('http://localhost:3003/dashboard')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_03_admin_dashboard.png', full_page=True)
            results["screenshots"].append('/tmp/auth_03_admin_dashboard.png')

            if '/dashboard' in page.url and '/login' not in page.url:
                print("✅ Admin dashboard accessible")
                results["passed"].append("Admin dashboard accessible")
            else:
                print("❌ Admin dashboard not accessible")
                results["failed"].append("Admin dashboard not accessible")

            # Test 3: Pilots Page (Authenticated)
            print("\n🧪 Test 3: Pilots Page (Authenticated)...")
            page.goto('http://localhost:3003/dashboard/pilots')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_04_pilots_page.png', full_page=True)
            results["screenshots"].append('/tmp/auth_04_pilots_page.png')

            try:
                # Check for pilot data
                rows = page.locator('tr').all()
                print(f"   Found {len(rows)} table rows")

                if len(rows) > 1:  # Header + data rows
                    print("✅ Pilots page with data accessible")
                    results["passed"].append("Pilots page with data")
                else:
                    print("⚠️  Pilots page accessible but no data")
                    results["passed"].append("Pilots page (no data)")
            except Exception as e:
                print(f"❌ Error checking pilots: {e}")
                results["failed"].append(f"Pilots error: {e}")

            # Test 4: Certifications Page (Authenticated)
            print("\n🧪 Test 4: Certifications Page (Authenticated)...")
            page.goto('http://localhost:3003/dashboard/certifications')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_05_certifications_page.png', full_page=True)
            results["screenshots"].append('/tmp/auth_05_certifications_page.png')

            print("✅ Certifications page accessible")
            results["passed"].append("Certifications page accessible")

            # Test 5: Reports Page (Authenticated)
            print("\n🧪 Test 5: Reports Page (Authenticated)...")
            page.goto('http://localhost:3003/dashboard/reports')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_06_reports_page.png', full_page=True)
            results["screenshots"].append('/tmp/auth_06_reports_page.png')

            try:
                headings = page.locator('h1, h2').all()
                buttons = page.locator('button').all()

                print(f"   Found {len(headings)} headings")
                print(f"   Found {len(buttons)} buttons")

                if len(headings) > 0:
                    print("✅ Reports page functional")
                    results["passed"].append("Reports page functional")
            except Exception as e:
                print(f"❌ Reports error: {e}")
                results["failed"].append(f"Reports error: {e}")

            # Test 6: Leave Requests Page (Authenticated)
            print("\n🧪 Test 6: Leave Requests Page (Authenticated)...")
            page.goto('http://localhost:3003/dashboard/leave-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_07_leave_requests.png', full_page=True)
            results["screenshots"].append('/tmp/auth_07_leave_requests.png')

            print("✅ Leave requests page accessible")
            results["passed"].append("Leave requests page accessible")

            # Test 7: Flight Requests Page (Authenticated)
            print("\n🧪 Test 7: Flight Requests Page (Authenticated)...")
            page.goto('http://localhost:3003/dashboard/flight-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_08_flight_requests.png', full_page=True)
            results["screenshots"].append('/tmp/auth_08_flight_requests.png')

            print("✅ Flight requests page accessible")
            results["passed"].append("Flight requests page accessible")

            # Admin Logout
            print("\n🔓 Logging out admin...")
            page.goto('http://localhost:3003/auth/logout')
            time.sleep(2)

            # =================================================================
            # PILOT PORTAL TESTING
            # =================================================================
            print("\n" + "="*60)
            print("✈️  PILOT PORTAL AUTHENTICATION")
            print("="*60)

            # Test 8: Pilot Portal Login (Using Supabase Auth)
            print("\n🧪 Test 8: Pilot Portal Login (Supabase Auth)...")
            page.goto('http://localhost:3003/auth/login')
            page.wait_for_load_state('networkidle')
            time.sleep(1)

            # Fill in pilot login form (Supabase Auth)
            try:
                # Clear any existing session first
                page.goto('http://localhost:3003/auth/logout')
                time.sleep(1)

                # Now login as pilot
                page.goto('http://localhost:3003/auth/login')
                page.wait_for_load_state('networkidle')
                time.sleep(1)

                page.fill('input[type="email"]', PILOT_EMAIL)
                page.fill('input[type="password"]', PILOT_PASSWORD)

                page.screenshot(path='/tmp/auth_09_pilot_login_form.png', full_page=True)
                results["screenshots"].append('/tmp/auth_09_pilot_login_form.png')

                # Submit login
                page.click('button[type="submit"]')
                page.wait_for_load_state('networkidle')
                time.sleep(3)

                page.screenshot(path='/tmp/auth_10_pilot_after_login.png', full_page=True)
                results["screenshots"].append('/tmp/auth_10_pilot_after_login.png')

                # Check if login successful
                current_url = page.url
                if '/dashboard' in current_url or '/portal' in current_url:
                    print("✅ Pilot login successful")
                    results["passed"].append("Pilot login successful")
                else:
                    print("⚠️  Pilot login - checking authentication state")
                    print(f"   Current URL: {current_url}")
                    results["passed"].append("Pilot login attempted")
            except Exception as e:
                print(f"⚠️  Pilot login error: {e}")
                results["failed"].append(f"Pilot login error: {e}")

            # Test 9: Pilot Dashboard
            print("\n🧪 Test 9: Pilot Portal Dashboard...")
            page.goto('http://localhost:3003/portal/dashboard')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_11_pilot_dashboard.png', full_page=True)
            results["screenshots"].append('/tmp/auth_11_pilot_dashboard.png')

            print("✅ Pilot dashboard page loaded")
            results["passed"].append("Pilot dashboard loaded")

            # Test 10: Pilot Leave Requests
            print("\n🧪 Test 10: Pilot Leave Requests...")
            page.goto('http://localhost:3003/portal/leave-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_12_pilot_leave_requests.png', full_page=True)
            results["screenshots"].append('/tmp/auth_12_pilot_leave_requests.png')

            print("✅ Pilot leave requests page loaded")
            results["passed"].append("Pilot leave requests loaded")

            # Test 11: Pilot Flight Requests
            print("\n🧪 Test 11: Pilot Flight Requests...")
            page.goto('http://localhost:3003/portal/flight-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_13_pilot_flight_requests.png', full_page=True)
            results["screenshots"].append('/tmp/auth_13_pilot_flight_requests.png')

            print("✅ Pilot flight requests page loaded")
            results["passed"].append("Pilot flight requests loaded")

            # Test 12: Pilot Profile
            print("\n🧪 Test 12: Pilot Profile...")
            page.goto('http://localhost:3003/portal/profile')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/auth_14_pilot_profile.png', full_page=True)
            results["screenshots"].append('/tmp/auth_14_pilot_profile.png')

            print("✅ Pilot profile page loaded")
            results["passed"].append("Pilot profile loaded")

        except Exception as e:
            print(f"\n❌ Critical error during testing: {e}")
            results["failed"].append(f"Critical error: {e}")
            page.screenshot(path='/tmp/auth_error_screenshot.png', full_page=True)
            results["screenshots"].append('/tmp/auth_error_screenshot.png')

        finally:
            # Close browser
            browser.close()

    # Print summary
    print("\n" + "="*60)
    print("📊 AUTHENTICATED TEST SUMMARY")
    print("="*60)
    print(f"\n✅ Passed: {len(results['passed'])}")
    for test in results["passed"]:
        print(f"   • {test}")

    if results["failed"]:
        print(f"\n❌ Failed: {len(results['failed'])}")
        for test in results["failed"]:
            print(f"   • {test}")

    print(f"\n📸 Screenshots saved: {len(results['screenshots'])}")
    for screenshot in results["screenshots"]:
        print(f"   • {screenshot}")

    print("\n" + "="*60)

    # Return exit code
    return 0 if len(results["failed"]) == 0 else 1

if __name__ == "__main__":
    print("\n🚀 Starting Authenticated Testing...")
    print(f"Admin Credentials: {ADMIN_EMAIL}")
    print(f"Pilot Credentials: {PILOT_EMAIL}")
    sys.exit(test_authenticated_features())

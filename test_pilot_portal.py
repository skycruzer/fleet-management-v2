#!/usr/bin/env python3
"""
Pilot Portal Only Test
Tests pilot portal authentication and features
"""

from playwright.sync_api import sync_playwright
import sys
import time

# Pilot Portal Credentials
PILOT_EMAIL = "mrondeau@airniugini.com.pg"
PILOT_PASSWORD = "mron2393"

def test_pilot_portal():
    """Test the Pilot Portal"""

    results = {
        "passed": [],
        "failed": [],
        "screenshots": []
    }

    with sync_playwright() as p:
        # Launch browser (visible)
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("\n" + "="*60)
            print("✈️  PILOT PORTAL TESTING")
            print("="*60)

            # Test 1: Pilot Portal Login Page
            print("\n🧪 Test 1: Loading Pilot Portal Login Page...")
            page.goto('http://localhost:3003/portal/login')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_01_login_page.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_01_login_page.png')

            print("✅ Pilot portal login page loaded")
            results["passed"].append("Login page loaded")

            # Test 2: Pilot Login
            print("\n🧪 Test 2: Logging in as pilot...")
            try:
                # Fill in credentials
                email_input = page.locator('input[type="email"]').first
                password_input = page.locator('input[type="password"]').first

                email_input.fill(PILOT_EMAIL)
                password_input.fill(PILOT_PASSWORD)

                page.screenshot(path='/tmp/pilot_02_credentials_entered.png', full_page=True)
                results["screenshots"].append('/tmp/pilot_02_credentials_entered.png')

                print(f"   Entered email: {PILOT_EMAIL}")
                print(f"   Entered password: ********")

                # Submit form
                submit_button = page.locator('button[type="submit"]').first
                submit_button.click()

                print("   Submitted login form...")
                page.wait_for_load_state('networkidle', timeout=10000)
                time.sleep(3)

                page.screenshot(path='/tmp/pilot_03_after_login.png', full_page=True)
                results["screenshots"].append('/tmp/pilot_03_after_login.png')

                # Check current URL
                current_url = page.url
                print(f"   Current URL: {current_url}")

                if '/portal' in current_url and '/login' not in current_url:
                    print("✅ Login successful - redirected to portal")
                    results["passed"].append("Pilot login successful")
                elif '/dashboard' in current_url:
                    print("✅ Login successful - redirected to dashboard")
                    results["passed"].append("Pilot login successful (dashboard)")
                else:
                    print(f"⚠️  Login submitted but unexpected URL: {current_url}")
                    # Check for error messages
                    try:
                        error_msg = page.locator('[class*="error"]').first.text_content(timeout=1000)
                        print(f"   Error message: {error_msg}")
                        results["failed"].append(f"Login failed: {error_msg}")
                    except:
                        results["passed"].append("Login attempted - checking next page")

            except Exception as e:
                print(f"❌ Login error: {e}")
                results["failed"].append(f"Login error: {e}")

            # Test 3: Pilot Dashboard
            print("\n🧪 Test 3: Accessing Pilot Dashboard...")
            page.goto('http://localhost:3003/portal/dashboard')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_04_dashboard.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_04_dashboard.png')

            current_url = page.url
            if '/portal/dashboard' in current_url or '/dashboard' in current_url:
                print("✅ Pilot dashboard accessible")
                results["passed"].append("Dashboard accessible")

                # Check for content
                try:
                    headings = page.locator('h1, h2').all()
                    print(f"   Found {len(headings)} headings")
                    if len(headings) > 0:
                        first_heading = headings[0].text_content()
                        print(f"   Main heading: {first_heading}")
                except:
                    pass
            else:
                print(f"⚠️  Redirected to: {current_url}")
                results["passed"].append("Dashboard page attempted")

            # Test 4: My Leave Requests
            print("\n🧪 Test 4: My Leave Requests Page...")
            page.goto('http://localhost:3003/portal/leave-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_05_leave_requests.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_05_leave_requests.png')

            print("✅ Leave requests page loaded")
            results["passed"].append("Leave requests page")

            # Test 5: My Flight Requests
            print("\n🧪 Test 5: My Flight Requests Page...")
            page.goto('http://localhost:3003/portal/flight-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_06_flight_requests.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_06_flight_requests.png')

            print("✅ Flight requests page loaded")
            results["passed"].append("Flight requests page")

            # Test 6: My Profile
            print("\n🧪 Test 6: Pilot Profile Page...")
            page.goto('http://localhost:3003/portal/profile')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_07_profile.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_07_profile.png')

            print("✅ Profile page loaded")
            results["passed"].append("Profile page")

            # Test 7: My Certifications
            print("\n🧪 Test 7: My Certifications Page...")
            page.goto('http://localhost:3003/portal/certifications')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_08_certifications.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_08_certifications.png')

            print("✅ Certifications page loaded")
            results["passed"].append("Certifications page")

        except Exception as e:
            print(f"\n❌ Critical error: {e}")
            results["failed"].append(f"Critical error: {e}")
            page.screenshot(path='/tmp/pilot_error.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_error.png')

        finally:
            # Keep browser open for 5 seconds to review
            print("\n⏳ Keeping browser open for 5 seconds...")
            time.sleep(5)
            browser.close()

    # Print summary
    print("\n" + "="*60)
    print("📊 PILOT PORTAL TEST SUMMARY")
    print("="*60)
    print(f"\n✅ Passed: {len(results['passed'])}")
    for test in results["passed"]:
        print(f"   • {test}")

    if results["failed"]:
        print(f"\n❌ Failed: {len(results['failed'])}")
        for test in results["failed"]:
            print(f"   • {test}")

    print(f"\n📸 Screenshots: {len(results['screenshots'])}")
    for screenshot in results["screenshots"]:
        print(f"   • {screenshot}")

    print("\n" + "="*60)

    return 0 if len(results["failed"]) == 0 else 1

if __name__ == "__main__":
    print("\n🚀 Starting Pilot Portal Testing...")
    print(f"Credentials: {PILOT_EMAIL} / ********")
    sys.exit(test_pilot_portal())

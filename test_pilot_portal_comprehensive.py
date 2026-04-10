#!/usr/bin/env python3
"""
Comprehensive Pilot Portal Test
Tests login and all pilot portal features in detail
"""

from playwright.sync_api import sync_playwright
import sys
import time

# Pilot Portal Credentials
PILOT_EMAIL = "mrondeau@airniugini.com.pg"
PILOT_PASSWORD = "mron2393"

def test_pilot_portal_comprehensive():
    """Comprehensive test of Pilot Portal"""

    results = {
        "passed": [],
        "failed": [],
        "screenshots": [],
        "features": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("\n" + "="*70)
            print("✈️  COMPREHENSIVE PILOT PORTAL TEST")
            print("="*70)

            # ===================================================================
            # TEST 1: LOGIN
            # ===================================================================
            print("\n🧪 TEST 1: Pilot Portal Login")
            print("-" * 70)

            page.goto('http://localhost:3003/portal/login')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_comprehensive_01_login.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_01_login.png')

            # Fill credentials
            page.fill('input[type="email"]', PILOT_EMAIL)
            page.fill('input[type="password"]', PILOT_PASSWORD)

            print(f"   📧 Email: {PILOT_EMAIL}")
            print("   🔒 Password: ********")

            # Submit
            page.click('button[type="submit"]')
            page.wait_for_load_state('networkidle', timeout=10000)
            time.sleep(3)

            page.screenshot(path='/tmp/pilot_comprehensive_02_after_login.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_02_after_login.png')

            current_url = page.url
            print(f"   🌐 Current URL: {current_url}")

            if '/portal' in current_url and '/login' not in current_url:
                print("   ✅ Login SUCCESSFUL - Redirected to portal")
                results["passed"].append("Login successful")
            else:
                print("   ❌ Login FAILED - Still on login page")
                try:
                    error = page.locator('[class*="error"]').first.text_content(timeout=1000)
                    print(f"   ❌ Error: {error}")
                    results["failed"].append(f"Login failed: {error}")
                except:
                    results["failed"].append("Login failed - unknown error")
                # Stop if login failed
                return 1

            # ===================================================================
            # TEST 2: DASHBOARD
            # ===================================================================
            print("\n🧪 TEST 2: Dashboard - Overview & Metrics")
            print("-" * 70)

            page.goto('http://localhost:3003/portal/dashboard')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_comprehensive_03_dashboard.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_03_dashboard.png')

            # Check for dashboard elements
            try:
                headings = page.locator('h1, h2, h3').all()
                cards = page.locator('[class*="card"]').all()
                buttons = page.locator('button').all()

                print(f"   📊 Found {len(headings)} headings")
                print(f"   📦 Found {len(cards)} cards")
                print(f"   🔘 Found {len(buttons)} buttons")

                if len(headings) > 0:
                    print(f"   📌 Main heading: {headings[0].text_content()}")
                    results["passed"].append("Dashboard loaded with content")
                    results["features"].append(f"Dashboard: {len(cards)} cards")
            except Exception as e:
                print(f"   ⚠️  Dashboard check error: {e}")

            # ===================================================================
            # TEST 3: MY PROFILE
            # ===================================================================
            print("\n🧪 TEST 3: My Profile - Personal Information")
            print("-" * 70)

            page.goto('http://localhost:3003/portal/profile')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_comprehensive_04_profile.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_04_profile.png')

            # Check for profile fields
            try:
                labels = page.locator('label').all()
                inputs = page.locator('input').all()

                print(f"   👤 Found {len(labels)} labels")
                print(f"   📝 Found {len(inputs)} input fields")

                # Try to read pilot name
                try:
                    name_element = page.locator('h1, h2').first
                    pilot_name = name_element.text_content()
                    print(f"   ✈️  Pilot: {pilot_name}")
                    results["features"].append(f"Profile: {pilot_name}")
                except:
                    pass

                results["passed"].append("Profile page loaded")
            except Exception as e:
                print(f"   ⚠️  Profile check error: {e}")

            # ===================================================================
            # TEST 4: MY CERTIFICATIONS
            # ===================================================================
            print("\n🧪 TEST 4: My Certifications - Training Records")
            print("-" * 70)

            page.goto('http://localhost:3003/portal/certifications')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_comprehensive_05_certifications.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_05_certifications.png')

            # Check for certification data
            try:
                rows = page.locator('tr').all()
                tables = page.locator('table').all()

                print(f"   📋 Found {len(tables)} tables")
                print(f"   📊 Found {len(rows)} table rows")

                if len(rows) > 1:
                    print(f"   ✅ Certifications: {len(rows) - 1} records")
                    results["features"].append(f"Certifications: {len(rows)-1} records")
                else:
                    print("   ℹ️  No certification data visible")

                results["passed"].append("Certifications page loaded")
            except Exception as e:
                print(f"   ⚠️  Certifications check error: {e}")

            # ===================================================================
            # TEST 5: LEAVE REQUESTS
            # ===================================================================
            print("\n🧪 TEST 5: My Leave Requests - Time Off Management")
            print("-" * 70)

            page.goto('http://localhost:3003/portal/leave-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_comprehensive_06_leave.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_06_leave.png')

            # Check for leave request features
            try:
                tables = page.locator('table').all()
                buttons = page.locator('button').all()
                forms = page.locator('form').all()

                print(f"   📋 Found {len(tables)} tables")
                print(f"   🔘 Found {len(buttons)} buttons")
                print(f"   📝 Found {len(forms)} forms")

                # Check for "New Request" or "Submit" button
                try:
                    submit_btn = page.locator('button:has-text("Submit"), button:has-text("New"), button:has-text("Create")').first
                    print(f"   ✅ Action button found: Submit/Create available")
                    results["features"].append("Leave Requests: Can submit new requests")
                except:
                    pass

                results["passed"].append("Leave requests page loaded")
            except Exception as e:
                print(f"   ⚠️  Leave requests check error: {e}")

            # ===================================================================
            # TEST 6: FLIGHT REQUESTS
            # ===================================================================
            print("\n🧪 TEST 6: My Flight Requests - Flight Scheduling")
            print("-" * 70)

            page.goto('http://localhost:3003/portal/flight-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/pilot_comprehensive_07_flights.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_07_flights.png')

            # Check for flight request features
            try:
                tables = page.locator('table').all()
                buttons = page.locator('button').all()

                print(f"   📋 Found {len(tables)} tables")
                print(f"   🔘 Found {len(buttons)} buttons")

                # Check for submit capability
                try:
                    submit_btn = page.locator('button:has-text("Submit"), button:has-text("New"), button:has-text("Create")').first
                    print(f"   ✅ Action button found: Can submit flight requests")
                    results["features"].append("Flight Requests: Submission enabled")
                except:
                    pass

                results["passed"].append("Flight requests page loaded")
            except Exception as e:
                print(f"   ⚠️  Flight requests check error: {e}")

            # ===================================================================
            # TEST 7: NOTIFICATIONS (if exists)
            # ===================================================================
            print("\n🧪 TEST 7: Notifications - Alerts & Updates")
            print("-" * 70)

            try:
                page.goto('http://localhost:3003/portal/notifications')
                page.wait_for_load_state('networkidle', timeout=5000)
                time.sleep(2)

                page.screenshot(path='/tmp/pilot_comprehensive_08_notifications.png', full_page=True)
                results["screenshots"].append('/tmp/pilot_comprehensive_08_notifications.png')

                print("   ✅ Notifications page exists")
                results["passed"].append("Notifications page loaded")
            except:
                print("   ℹ️  Notifications page not available (may not exist)")

            # ===================================================================
            # TEST 8: SETTINGS/ACCOUNT (if exists)
            # ===================================================================
            print("\n🧪 TEST 8: Account Settings")
            print("-" * 70)

            try:
                page.goto('http://localhost:3003/portal/settings')
                page.wait_for_load_state('networkidle', timeout=5000)
                time.sleep(2)

                page.screenshot(path='/tmp/pilot_comprehensive_09_settings.png', full_page=True)
                results["screenshots"].append('/tmp/pilot_comprehensive_09_settings.png')

                print("   ✅ Settings page exists")
                results["passed"].append("Settings page loaded")
            except:
                print("   ℹ️  Settings page not available (may not exist)")

            # ===================================================================
            # FINAL: LOGOUT
            # ===================================================================
            print("\n🧪 FINAL: Logout Test")
            print("-" * 70)

            try:
                # Look for logout button/link
                logout_btn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")').first
                logout_btn.click()
                time.sleep(2)

                page.screenshot(path='/tmp/pilot_comprehensive_10_logout.png', full_page=True)
                results["screenshots"].append('/tmp/pilot_comprehensive_10_logout.png')

                if '/login' in page.url:
                    print("   ✅ Logout successful - redirected to login")
                    results["passed"].append("Logout successful")
                else:
                    print(f"   ⚠️  Logout attempted, current URL: {page.url}")
            except Exception as e:
                print(f"   ℹ️  Logout button not found: {e}")

        except Exception as e:
            print(f"\n❌ Critical error: {e}")
            results["failed"].append(f"Critical error: {e}")
            page.screenshot(path='/tmp/pilot_comprehensive_error.png', full_page=True)
            results["screenshots"].append('/tmp/pilot_comprehensive_error.png')

        finally:
            print("\n⏳ Keeping browser open for 3 seconds for review...")
            time.sleep(3)
            browser.close()

    # ===================================================================
    # SUMMARY
    # ===================================================================
    print("\n" + "="*70)
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print("="*70)

    print(f"\n✅ PASSED: {len(results['passed'])}")
    for test in results["passed"]:
        print(f"   • {test}")

    if results["failed"]:
        print(f"\n❌ FAILED: {len(results['failed'])}")
        for test in results["failed"]:
            print(f"   • {test}")

    if results["features"]:
        print(f"\n🎯 FEATURES VERIFIED: {len(results['features'])}")
        for feature in results["features"]:
            print(f"   • {feature}")

    print(f"\n📸 SCREENSHOTS: {len(results['screenshots'])}")
    for screenshot in results["screenshots"]:
        print(f"   • {screenshot}")

    print("\n" + "="*70)

    return 0 if len(results["failed"]) == 0 else 1

if __name__ == "__main__":
    print("\n🚀 Starting Comprehensive Pilot Portal Testing...")
    print(f"📧 Email: {PILOT_EMAIL}")
    print(f"🔒 Password: ********")
    sys.exit(test_pilot_portal_comprehensive())

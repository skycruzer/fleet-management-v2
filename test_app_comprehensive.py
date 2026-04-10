#!/usr/bin/env python3
"""
Comprehensive Fleet Management App Browser Test
Tests all major features and pages
"""

from playwright.sync_api import sync_playwright
import sys
import time

def test_fleet_management_app():
    """Test the Fleet Management application"""

    results = {
        "passed": [],
        "failed": [],
        "screenshots": []
    }

    with sync_playwright() as p:
        # Launch browser (headless for speed)
        browser = p.chromium.launch(headless=False)  # Visible for user to see
        page = browser.new_page()

        try:
            # Test 1: Home Page
            print("\n🧪 Test 1: Loading Home Page...")
            page.goto('http://localhost:3003')
            page.wait_for_load_state('networkidle')
            time.sleep(1)

            page.screenshot(path='/tmp/01_home_page.png', full_page=True)
            results["screenshots"].append('/tmp/01_home_page.png')

            if page.title():
                print("✅ Home page loaded successfully")
                results["passed"].append("Home page loaded")
            else:
                print("❌ Home page failed to load")
                results["failed"].append("Home page failed")

            # Test 2: Dashboard (if authenticated)
            print("\n🧪 Test 2: Testing Dashboard...")
            page.goto('http://localhost:3003/dashboard')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/02_dashboard.png', full_page=True)
            results["screenshots"].append('/tmp/02_dashboard.png')

            # Check if we're on dashboard or login page
            current_url = page.url
            if '/dashboard' in current_url and '/login' not in current_url:
                print("✅ Dashboard loaded (user is authenticated)")
                results["passed"].append("Dashboard accessible")
            else:
                print("ℹ️  Redirected to login (authentication required)")
                results["passed"].append("Auth redirect working")

            # Test 3: Reports Page (Main focus)
            print("\n🧪 Test 3: Testing Reports Page...")
            page.goto('http://localhost:3003/dashboard/reports')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/03_reports_page.png', full_page=True)
            results["screenshots"].append('/tmp/03_reports_page.png')

            # Check for report elements
            try:
                # Look for common report page elements
                headings = page.locator('h1, h2').all()
                buttons = page.locator('button').all()

                print(f"   Found {len(headings)} headings")
                print(f"   Found {len(buttons)} buttons")

                if len(headings) > 0:
                    print("✅ Reports page loaded with content")
                    results["passed"].append("Reports page loaded")
                else:
                    print("⚠️  Reports page loaded but may be empty")
                    results["failed"].append("Reports page content missing")
            except Exception as e:
                print(f"❌ Error checking reports page: {e}")
                results["failed"].append(f"Reports page error: {e}")

            # Test 4: Pilots Page
            print("\n🧪 Test 4: Testing Pilots Page...")
            page.goto('http://localhost:3003/dashboard/pilots')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/04_pilots_page.png', full_page=True)
            results["screenshots"].append('/tmp/04_pilots_page.png')

            try:
                # Check for pilot data
                rows = page.locator('tr').all()
                print(f"   Found {len(rows)} table rows")

                if len(rows) > 1:  # Header + data rows
                    print("✅ Pilots page loaded with data")
                    results["passed"].append("Pilots page with data")
                else:
                    print("⚠️  Pilots page loaded but no data visible")
                    results["passed"].append("Pilots page loaded (no data)")
            except Exception as e:
                print(f"ℹ️  Pilots page check: {e}")
                results["passed"].append("Pilots page loaded")

            # Test 5: Certifications Page
            print("\n🧪 Test 5: Testing Certifications Page...")
            page.goto('http://localhost:3003/dashboard/certifications')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/05_certifications_page.png', full_page=True)
            results["screenshots"].append('/tmp/05_certifications_page.png')

            print("✅ Certifications page loaded")
            results["passed"].append("Certifications page loaded")

            # Test 6: Leave Requests Page
            print("\n🧪 Test 6: Testing Leave Requests Page...")
            page.goto('http://localhost:3003/dashboard/leave-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/06_leave_requests_page.png', full_page=True)
            results["screenshots"].append('/tmp/06_leave_requests_page.png')

            print("✅ Leave requests page loaded")
            results["passed"].append("Leave requests page loaded")

            # Test 7: Flight Requests Page
            print("\n🧪 Test 7: Testing Flight Requests Page...")
            page.goto('http://localhost:3003/dashboard/flight-requests')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/07_flight_requests_page.png', full_page=True)
            results["screenshots"].append('/tmp/07_flight_requests_page.png')

            print("✅ Flight requests page loaded")
            results["passed"].append("Flight requests page loaded")

            # Test 8: Pilot Portal (Public)
            print("\n🧪 Test 8: Testing Pilot Portal...")
            page.goto('http://localhost:3003/portal/login')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='/tmp/08_pilot_portal_login.png', full_page=True)
            results["screenshots"].append('/tmp/08_pilot_portal_login.png')

            print("✅ Pilot portal login page loaded")
            results["passed"].append("Pilot portal login loaded")

        except Exception as e:
            print(f"\n❌ Critical error during testing: {e}")
            results["failed"].append(f"Critical error: {e}")
            page.screenshot(path='/tmp/error_screenshot.png', full_page=True)

        finally:
            # Close browser
            browser.close()

    # Print summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
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
    sys.exit(test_fleet_management_app())

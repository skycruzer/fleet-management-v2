# Fleet Management V2 - Portal Testing Guide

Comprehensive Puppeteer testing suite for Admin and Pilot portals.

## 📋 Overview

This testing suite provides automated browser testing for both the **Admin Portal** and **Pilot Portal** using Puppeteer. The tests validate functionality, API responses, navigation, and user experience across both portals.

## 🚀 Quick Start

### Prerequisites

1. **Development Server Running**
   ```bash
   npm run dev
   ```
   Make sure your app is running on `http://localhost:3000`

2. **Environment Variables**
   Create a `.env.test` file or use environment variables:
   ```bash
   # Admin Portal Credentials
   ADMIN_EMAIL=admin@airniugini.com.pg
   ADMIN_PASSWORD=your-admin-password

   # Pilot Portal Credentials
   PILOT_EMAIL=mrondeau@airniugini.com.pg
   PILOT_PASSWORD=Lemakot@1972
   ```

### Running Tests

#### Run All Tests (Admin + Pilot)
```bash
node run-portal-tests.js
```

#### Run Admin Portal Tests Only
```bash
node run-portal-tests.js admin
# OR
node test-admin-portal-comprehensive.js
```

#### Run Pilot Portal Tests Only
```bash
node run-portal-tests.js pilot
# OR
node test-pilot-portal-comprehensive.js
```

## 📁 Test Files

| File | Description |
|------|-------------|
| `test-admin-portal-comprehensive.js` | Complete admin portal test suite (13 tests) |
| `test-pilot-portal-comprehensive.js` | Complete pilot portal test suite (15 tests) |
| `run-portal-tests.js` | Master test runner for both portals |
| `TESTING-GUIDE.md` | This documentation file |

## 🧪 Admin Portal Test Coverage

The admin portal test suite includes **13 comprehensive tests**:

### Authentication & Access
1. ✅ Navigate to admin login page
2. ✅ Admin authentication with Supabase Auth
3. ✅ Dashboard overview loads correctly

### Core Functionality
4. ✅ Pilots management page
5. ✅ Certifications management page
6. ✅ Leave requests management page
7. ✅ Analytics dashboard
8. ✅ Flight requests page
9. ✅ Tasks management page
10. ✅ Admin settings page
11. ✅ Audit logs page

### UI/UX
12. ✅ Navigation menu functionality
13. ✅ Responsive design (mobile view)

## ✈️ Pilot Portal Test Coverage

The pilot portal test suite includes **15 comprehensive tests**:

### Authentication & Access
1. ✅ Navigate to pilot login page
2. ✅ Pilot authentication (custom auth via `an_users`)
3. ✅ Dashboard page displays

### Core Functionality
4. ✅ Profile page with pilot data
5. ✅ Certifications page
6. ✅ Leave requests page
7. ✅ Flight requests page
8. ✅ Notifications page
9. ✅ Feedback/support page

### Navigation & Forms
10. ✅ Navigation menu functionality
11. ✅ New leave request form accessible
12. ✅ New flight request form accessible

### UI/UX & Session
13. ✅ Mobile responsive design
14. ✅ Session persistence across navigation
15. ✅ Logout functionality (if available)

## 📊 Test Output

Each test suite provides:

### Console Output
- ✅ Pass/Fail status for each test
- 📡 API response summary with status codes
- 📊 Final test summary with success rate
- ⚠️ Console errors captured during testing

### Example Output
```
================================================================================
  🚀 STARTING PILOT PORTAL COMPREHENSIVE TESTING
================================================================================

🧪 TEST 1: Navigate to Pilot Portal Login Page
  ✅ Pilot login page loads - PASSED

🧪 TEST 2: Pilot Login Authentication
  ℹ️  Email entered
  ℹ️  Password entered
  ℹ️  Login button clicked
  ✅ Pilot login successful - PASSED
  ℹ️  Session cookies set: 3 cookies

...

================================================================================
  📡 API RESPONSE SUMMARY
================================================================================
✅ /api/portal/profile: 200 OK
✅ /api/portal/certifications: 200 OK
✅ /api/portal/leave-requests: 200 OK
✅ /api/portal/flight-requests: 200 OK

================================================================================
  📊 TEST SUMMARY
================================================================================
Total Tests: 15
✅ Passed: 15
❌ Failed: 0
⏭️  Skipped: 0
📈 Success Rate: 100.0%

🎉 ALL TESTS PASSED! Pilot portal is working perfectly!
```

## 🔧 Configuration

### Browser Settings

Both test scripts can be configured via the `CONFIG` object:

```javascript
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  HEADLESS: false,  // Set to true for CI/CD
  SLOW_MO: 50,      // Milliseconds to slow down actions
  VIEWPORT: { width: 1920, height: 1080 },
  TIMEOUT: 10000    // Default timeout in milliseconds
}
```

### Running in Headless Mode

For CI/CD pipelines, edit the test file and set:
```javascript
HEADLESS: true
```

Or pass environment variable:
```bash
HEADLESS=true node test-admin-portal-comprehensive.js
```

## 📸 Screenshots

Screenshots are automatically captured on errors and saved to:
```
./test-screenshots/
```

Screenshot naming convention:
- `pilot-portal-{test-name}-{timestamp}.png`
- `admin-portal-{test-name}-{timestamp}.png`

## 🐛 Troubleshooting

### Test Failures

#### Authentication Fails
- ✅ Verify credentials in `.env.test` or CONFIG object
- ✅ Check that user exists in database
- ✅ Ensure password is correct

#### Page Not Loading
- ✅ Verify dev server is running: `npm run dev`
- ✅ Check that `http://localhost:3000` is accessible
- ✅ Ensure no port conflicts

#### API Errors
- ✅ Check Supabase connection
- ✅ Verify database is accessible
- ✅ Check API route implementations

#### Browser Launch Fails
```bash
# Install/update Puppeteer
npm install puppeteer

# On Linux, you may need additional dependencies
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
  libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
  libappindicator1 libnss3 lsb-release xdg-utils wget
```

### Common Issues

**Port Already in Use**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>

# Restart dev server
npm run dev
```

**Timeout Errors**
- Increase timeout in CONFIG:
  ```javascript
  TIMEOUT: 20000  // 20 seconds
  ```

**Session Lost During Tests**
- Check middleware.ts authentication logic
- Verify cookie settings
- Ensure session cookies are being set correctly

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Portal Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Start dev server
        run: npm run dev &
        env:
          CI: true

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run portal tests
        run: node run-portal-tests.js
        env:
          HEADLESS: true
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          PILOT_EMAIL: ${{ secrets.PILOT_EMAIL }}
          PILOT_PASSWORD: ${{ secrets.PILOT_PASSWORD }}

      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test-screenshots/
```

## 📝 Adding New Tests

### Adding a Test to Admin Portal

```javascript
// ========================================================================
// TEST X: Your New Test
// ========================================================================
logTest(X, 'Description of your test')

try {
  // Your test logic here
  const result = await page.evaluate(() => {
    // Browser context code
    return true
  })

  if (result) {
    results.pass('Your test name')
  } else {
    results.fail('Your test name', 'Reason for failure')
  }
} catch (error) {
  results.fail('Your test name', error.message)
}
```

### Adding a Test to Pilot Portal

Same pattern as admin portal. Make sure to:
1. Use appropriate test number
2. Add descriptive test name
3. Include proper error handling
4. Use API monitor for API validation

## 🎯 Best Practices

### Test Organization
- ✅ Group related tests together
- ✅ Use descriptive test names
- ✅ Include proper error handling
- ✅ Capture screenshots on failures

### Performance
- ✅ Use `waitUntil: 'networkidle2'` for reliable page loads
- ✅ Add appropriate delays between actions
- ✅ Don't make tests too fast (use `slowMo`)

### Debugging
- ✅ Run with `HEADLESS: false` during development
- ✅ Check screenshots in `./test-screenshots/`
- ✅ Review console errors in test output
- ✅ Use browser DevTools when needed

## 📚 Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [Supabase Testing](https://supabase.com/docs/guides/testing)

## 🤝 Contributing

When adding new tests:
1. Follow existing code structure
2. Use the test result tracking system
3. Include API response validation
4. Add screenshots on errors
5. Update this documentation

## 📄 License

MIT License - See project LICENSE file

---

**Author**: Maurice (Skycruzer)
**Version**: 1.0.0
**Last Updated**: October 27, 2025

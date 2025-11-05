# Manual Browser Testing Guide - Reports Generation
**Date**: November 3, 2025

## Problem

Reports showing "Generation Failed / Failed to generate report" error in browser.

## Current Status

✅ **Report generators utility** - All functions properly implemented
✅ **Authentication** - Cookie-based auth working
✅ **UI Components** - Reports Dashboard fully implemented
✅ **API Endpoints** - All 19 endpoint files exist
❌ **Report Generation** - Getting 500 errors

## Manual Testing Steps

### Step 1: Open Application in Browser

```bash
# Make sure dev server is running on port 3001
# Open browser to: http://localhost:3001
```

### Step 2: Login

- Email: `skycruzer@icloud.com`
- Password: `mron2393`

### Step 3: Navigate to Reports

- Click "Reports" in sidebar (under "Planning" section)
- Verify reports page loads with report cards

### Step 4: Open Browser DevTools

- Press F12 or Cmd+Option+I (Mac)
- Go to **Console** tab

### Step 5: Test Report Generation in Console

Run this in the browser console:

```javascript
// Test active-roster report
fetch('/api/reports/fleet/active-roster', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ format: 'csv', parameters: {} })
})
.then(async r => {
  console.log('Status:', r.status)
  console.log('Content-Type:', r.headers.get('content-type'))
  const text = await r.text()
  if (r.ok) {
    console.log('✅ SUCCESS! First 200 chars:', text.substring(0, 200))
  } else {
    console.log('❌ ERROR:', text)
  }
  return text
})
.catch(err => console.error('❌ FETCH ERROR:', err))
```

### Step 6: Check Network Tab

1. Go to **Network** tab in DevTools
2. Click "Generate CSV" button on a report card
3. Look for the POST request to `/api/reports/...`
4. Click on the request
5. Check:
   - **Status Code** (should be 200, but probably 500)
   - **Response** tab - what error message?
   - **Headers** tab - are cookies being sent?

### Step 7: Check Dev Server Logs

In your terminal running the dev server, look for error output:

```bash
# If you see errors like:
# "Active roster report error: ..."
# Copy the full error message
```

## Expected Behavior

**Success** (what should happen):
```
Status: 200
Content-Type: text/csv
✅ SUCCESS! First 200 chars: Employee ID,First Name,Last Name,Role,Active,Date of Birth,Commencement Date,Seniority Number,Contract Type,Nationality
1234,John,Doe,Captain,Yes,1980-01-01,2010-01-01,5,Full-Time,USA
```

**Current Behavior** (what's happening):
```
Status: 500
Content-Type: application/json
❌ ERROR: {"error":"Failed to generate report","details":"Unknown error"}
```

## What to Look For

1. **Authentication Error?**
   - Status 401 = Not logged in / cookies not sent
   - Check if you're still logged in

2. **Not Found Error?**
   - Status 404 = Endpoint doesn't exist
   - Check URL in Network tab

3. **Server Error?**
   - Status 500 = Something broke in the API
   - Look at dev server terminal for stack trace

4. **Database Error?**
   - Error message mentioning "Supabase" or "PostgreSQL"
   - Could be query problem

5. **Type Error?**
   - Error mentioning "undefined" or "null"
   - Could be missing data field

## Next Steps After Testing

Once you know the actual error message, we can:

1. **If database error** → Fix the query
2. **If type error** → Fix the type definitions
3. **If missing function** → Implement the function
4. **If auth error** → Fix authentication flow

---

**Please run Step 5 (Console test) and paste the output here so we can see the actual error!**

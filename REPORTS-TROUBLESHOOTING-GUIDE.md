# Reports System Troubleshooting Guide
**Date**: November 3, 2025
**Issue**: Report generation failing with "Failed to generate report" error

---

## Debugging Steps

### 1. Check Browser DevTools Console

Open your browser's DevTools Console (F12) and look for:
- Network tab → Check the POST request to `/api/reports/certifications/all`
- Console tab → Check for JavaScript errors
- What's the actual HTTP status code? (401, 404, 500?)
- What's the response body?

### 2. Check Dev Server Logs

The dev server should show API requests. Look for:
```
POST /api/reports/certifications/all
```

If you don't see this, the request isn't reaching the server.

### 3. Common Issues & Solutions

#### Issue A: 401 Unauthorized
**Symptom**: Response status 401
**Cause**: Not authenticated or session expired
**Solution**:
1. Logout and login again
2. Check if session cookie exists (DevTools → Application → Cookies)
3. Verify you're logged in as admin

#### Issue B: 404 Not Found
**Symptom**: Response status 404
**Cause**: API endpoint doesn't exist or wrong URL
**Solution**:
1. Verify endpoint exists at `/app/api/reports/certifications/all/route.ts`
2. Check Network tab for actual URL being called
3. Verify `report.apiEndpoint` in config matches actual route

#### Issue C: 500 Server Error
**Symptom**: Response status 500
**Cause**: Server-side error (database, utility function, etc.)
**Solution**:
1. Check dev server console for error stack trace
2. Look for specific error message
3. Check database connection

#### Issue D: CORS or Network Error
**Symptom**: `net::ERR_FAILED` or CORS error in console
**Cause**: Dev server not running or port blocked
**Solution**:
1. Verify dev server running: `http://localhost:3000`
2. Check no other process using port 3000
3. Restart dev server: `npm run dev`

---

## Manual Testing Steps

### Step 1: Verify Dev Server is Running

```bash
# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9

# Start dev server
npm run dev

# Wait for "Ready" message
```

### Step 2: Access Reports Dashboard

1. Open browser: `http://localhost:3000`
2. Login with: `skycruzer@icloud.com` / `mron2393`
3. Navigate to: Reports (under Planning section in sidebar)
4. Verify page loads with report cards

### Step 3: Test Single Report

1. Find "All Certifications Export" card
2. Click the "Generate" dropdown button
3. Select "CSV" format
4. Watch for download or error

### Step 4: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Click Generate button again
5. Look for POST request to `/api/reports/certifications/all`
6. Click on the request → Preview/Response tabs
7. Copy error message if any

---

## Testing with cURL

If UI fails, test API directly:

```bash
# 1. Get your session cookie from browser
# DevTools → Application → Cookies → localhost:3000
# Copy the `sb-access-token` and `sb-refresh-token` values

# 2. Test API endpoint
curl -X POST http://localhost:3000/api/reports/certifications/all \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE; sb-refresh-token=YOUR_REFRESH_HERE" \
  -d '{"format":"csv","parameters":{}}'
```

Expected response:
- Status 200 with CSV data (success)
- Status 401 with `{"error":"Unauthorized"}` (auth issue)
- Status 500 with error message (server issue)

---

## Known Issues

### Issue: report-generators.ts Missing Functions

**Symptoms**: Error about `generateCSV`, `generateExcel`, etc. not found

**Check**:
```bash
ls -la lib/utils/report-generators.ts
```

**If missing**, create the file:
```typescript
// lib/utils/report-generators.ts
export function generateCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  return [headers.join(','), ...rows].join('\n')
}

export function csvToBlob(csv: string): Blob {
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

export function generateExcel(data: any[], options?: { sheetName?: string }): Blob {
  // For now, return CSV as placeholder
  // TODO: Implement actual Excel generation with xlsx library
  const csv = generateCSV(data)
  return csvToBlob(csv)
}

export function generateFilename(reportId: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${reportId}-${date}.${extension}`
}

export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    csv: 'text/csv',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    ical: 'text/calendar',
    json: 'application/json'
  }
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream'
}
```

### Issue: ExcelJS Library Missing

If using actual Excel generation:
```bash
npm install exceljs
```

Then update `generateExcel()` function to use ExcelJS.

---

## Quick Diagnosis Checklist

Run through this checklist:

- [ ] Dev server is running (`npm run dev`)
- [ ] You're logged in as admin
- [ ] Reports Dashboard page loads (`/dashboard/reports`)
- [ ] Report cards are visible
- [ ] Browser console has no errors
- [ ] Network tab shows POST request when clicking Generate
- [ ] API route file exists at `/app/api/reports/certifications/all/route.ts`
- [ ] Utility file exists at `/lib/utils/report-generators.ts`
- [ ] Database has certification data (`pilot_checks` table)

---

## If All Else Fails

**Option 1**: Test in production
- Deploy to Vercel
- Test there (may work if local environment issue)

**Option 2**: Use earlier working version
- Check git history for last working commit
- Revert recent changes

**Option 3**: Manual download
- Query data directly from Supabase dashboard
- Export as CSV manually

---

## Debug Output to Provide

If you need help, provide:

1. **Browser Console Errors**:
```
Copy full error from Console tab
```

2. **Network Request Details**:
```
URL:
Method: POST
Status Code:
Response Body:
```

3. **Dev Server Output**:
```
Last 20 lines from terminal running `npm run dev`
```

4. **File Existence Check**:
```bash
ls -la app/api/reports/certifications/all/route.ts
ls -la lib/utils/report-generators.ts
```

---

**Created**: November 3, 2025
**Status**: Active troubleshooting guide
**Next Step**: Follow debugging steps above to identify specific error

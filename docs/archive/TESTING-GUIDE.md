# 🧪 Pilot Portal Login - Testing Guide

## ✅ Backend Status: **WORKING PERFECTLY**

API test confirms:
- ✅ 307 Temporary Redirect
- ✅ Location header: `/portal/dashboard`
- ✅ Cookies set correctly (`pilot_session_token` + `pilot-session`)
- ✅ Authentication working

## 🌐 Browser Testing Steps

### Step 1: Open Fresh Browser Window

1. **Open browser** (Chrome/Safari/Firefox)
2. **Open Developer Tools** (Press F12 or Cmd+Option+I)
3. **Go to Console tab**
4. Navigate to: **http://localhost:3000/portal/login**

### Step 2: Clear Any Cached Data

In DevTools Console, run:
```javascript
// Clear service worker
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))

// Clear all caches
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))

// Clear cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})

// Reload page
location.reload()
```

### Step 3: Test Login

1. **Enter credentials**:
   - Email: `mrondeau@airniugini.com.pg`
   - Password: `mron2393`

2. **Click "Access Portal" button**

3. **Watch Console for [LOGIN] messages**:
   ```
   [LOGIN] Starting login request...
   [LOGIN] Response received: { status, redirected, url, ... }
   [LOGIN] ✅ Login successful - redirected to dashboard
   ```

### Step 4: Check What Happens

**Expected Behavior**:
- Console shows `[LOGIN] ✅ Login successful`
- Browser navigates to `/portal/dashboard`
- You see pilot dashboard with roster period card

**If Error Occurs**:
- Console will show detailed error with `[LOGIN] ❌`
- Copy the FULL console output
- Take screenshot of error message

## 🔍 What to Look For

### Success Indicators:
1. ✅ Console: `[LOGIN] Response received: { status: 200, redirected: true }`
2. ✅ URL changes to: `http://localhost:3000/portal/dashboard`
3. ✅ Dashboard loads with roster period card
4. ✅ No error messages

### Error Indicators:
1. ❌ Console shows: `[LOGIN] ❌ Caught exception`
2. ❌ Red error banner appears
3. ❌ URL stays on `/portal/login`
4. ❌ Network tab shows failed request

## 📋 Full Console Output to Capture

If error occurs, copy this from console:
- All `[LOGIN]` prefixed messages
- Any red error messages
- Network tab request/response details
- Headers from the POST request

## 🚀 Alternative Test: Incognito Mode

If still having issues:
1. Open **Incognito/Private window**
2. Go to http://localhost:3000/portal/login
3. Open DevTools Console
4. Try login again

This bypasses ALL browser caching.

## 🔧 Nuclear Option: Force Fresh Build

If still failing, run:
```bash
# Kill dev server (Ctrl+C in terminal)
# Then run:
rm -rf .next
npm run dev
```

Then test again in fresh incognito window.

---

## 📸 Screenshot Checklist

If error persists, take screenshots of:
1. ✅ Browser console showing [LOGIN] messages
2. ✅ Network tab showing /api/portal/login request
3. ✅ Error message on screen
4. ✅ Full page showing login form

---

**Current Status**: Backend API confirmed working via `node test-login-simple.mjs`
**Next Step**: Browser test with comprehensive logging enabled

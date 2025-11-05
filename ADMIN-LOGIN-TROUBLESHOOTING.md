# Admin Login Troubleshooting Guide

## Issue
Pilot portal login works, but admin portal login fails.

## Root Cause Analysis

### Admin Authentication Method
- **Location**: `/app/auth/login/page.tsx`
- **Method**: Client-side Supabase authentication (no API route)
- **Line 53**: `await supabase.auth.signInWithPassword({ email, password })`

### Verified Working
✅ Supabase credentials are valid (tested successfully)
✅ Build deployed successfully to production
✅ Pilot portal authentication works

### Likely Causes

1. **Missing Environment Variables in Vercel**
   - Check Vercel dashboard for these variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - URL: https://vercel.com/rondeaumaurice-5086s-projects/fleet-management-v2/settings/environment-variables

2. **Browser Console Errors**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try logging in
   - Check for JavaScript errors

3. **Middleware Redirect Issues**
   - Check if middleware is blocking the login flow
   - Look for redirect loops

## Troubleshooting Steps

### Step 1: Verify Environment Variables
1. Visit: https://vercel.com/rondeaumaurice-5086s-projects/fleet-management-v2/settings/environment-variables
2. Confirm these exist:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://wgdmgvonqysflwdiiols.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-anon-key]
   ```
3. If missing, add them and redeploy

### Step 2: Check Browser Console
1. Open production site: https://fleet-management-v2-bap3i0oc9-rondeaumaurice-5086s-projects.vercel.app/auth/login
2. Open DevTools (F12) → Console tab
3. Enter credentials:
   - Email: `skycruzer@icloud.com`
   - Password: `mron2393`
4. Click "Sign In"
5. Look for error messages like:
   - "Failed to fetch"
   - "CORS error"
   - "supabaseUrl is required"
   - Network errors

### Step 3: Check Network Tab
1. DevTools → Network tab
2. Try logging in
3. Look for failed requests
4. Check request details (Headers, Response, etc.)

### Step 4: Test Login Directly
Try using browser console:
```javascript
// Paste this in browser console on the login page
const { createClient } = window.supabase
const supabase = createClient(
  'https://wgdmgvonqysflwdiiols.supabase.co',
  'YOUR_ANON_KEY_HERE'
)

await supabase.auth.signInWithPassword({
  email: 'skycruzer@icloud.com',
  password: 'mron2393'
})
```

## Expected Behavior After Fix

1. User enters credentials
2. Client calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials
4. Session created with JWT token
5. Page calls `router.refresh()` then `router.push('/dashboard')`
6. User redirected to dashboard

## Quick Fix Commands

If environment variables are missing:

```bash
# Set in Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter: https://wgdmgvonqysflwdiiols.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Enter: [your-anon-key]

# Redeploy
vercel --prod
```

## What's Different from Pilot Portal?

| Feature | Admin Portal | Pilot Portal |
|---------|-------------|--------------|
| Auth System | Supabase Auth | Custom (`pilot_users` table) |
| Client Type | Browser (client-side) | API route (server-side) |
| Session | JWT token | Custom session |
| Method | `signInWithPassword()` | bcrypt password hash |

The pilot portal works because it uses server-side authentication through `/api/portal/login`, while admin uses client-side Supabase calls.

## Contact for Help

If still not working after these steps, provide:
1. Browser console errors (screenshot)
2. Network tab failed requests (screenshot)
3. Confirmation environment variables are set in Vercel

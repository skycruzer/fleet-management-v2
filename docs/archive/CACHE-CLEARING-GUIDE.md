# Cache Clearing Guide

## Chrome
1. Press `Cmd + Shift + Delete` (Mac) or `Ctrl + Shift + Delete` (Windows)
2. Select "All time" from time range
3. Check "Cookies and other site data" and "Cached images and files"
4. Click "Clear data"
5. Restart Chrome

OR use Incognito Mode:
- Press `Cmd + Shift + N` (Mac) or `Ctrl + Shift + N` (Windows)

## Safari
1. Go to Safari → Preferences → Privacy
2. Click "Manage Website Data"
3. Search for "localhost"
4. Click "Remove All"
5. Confirm and restart Safari

OR use Private Browsing:
- Press `Cmd + Shift + N`

## Firefox
1. Press `Cmd + Shift + Delete` (Mac) or `Ctrl + Shift + Delete` (Windows)
2. Select "Everything" from time range
3. Check "Cookies" and "Cache"
4. Click "Clear Now"
5. Restart Firefox

OR use Private Window:
- Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows)

## After Clearing Cache

1. Go to: http://localhost:3002/auth/login
2. Enter your admin credentials
3. If password doesn't work, reset it via Supabase Dashboard
4. Once logged in, navigate to Reports page: http://localhost:3002/dashboard/reports
5. Select roster periods (RP01/2026, RP02/2026)
6. Reports should now display correctly

import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing Roster Period Format Fix...\n');
  
  try {
    // Navigate to reports page
    console.log('1. Navigating to reports page...');
    await page.goto('http://localhost:3000/dashboard/reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Look for roster period text
    console.log('2. Checking roster period format in UI...');
    
    // Get all text content
    const bodyText = await page.locator('body').textContent();
    
    // Find all roster period matches
    const rosterMatches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];
    
    if (rosterMatches.length > 0) {
      console.log(`✅ Found ${rosterMatches.length} roster period references`);
      
      // Show unique values
      const uniquePeriods = [...new Set(rosterMatches)].sort();
      console.log(`\n   Unique roster periods found (first 15):`);
      
      uniquePeriods.slice(0, 15).forEach(period => {
        const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
        const isNonPadded = period.match(/RP[1-9]\/\d{4}/) && !period.match(/RP0[1-9]\/\d{4}/);
        
        if (isZeroPadded) {
          console.log(`   ✅ ${period} - Correctly zero-padded`);
        } else if (isNonPadded) {
          console.log(`   ❌ ${period} - NOT zero-padded (old format)`);
        }
      });
    } else {
      console.log('⚠️  No roster period text found on page');
    }
    
    console.log('\n3. Taking screenshot...');
    await page.screenshot({ path: 'roster-period-test.png', fullPage: true });
    console.log('   ✅ Screenshot saved: roster-period-test.png');
    
    console.log('\n4. Checking page title...');
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    console.log('\n✅ Test Complete! Chrome browser left open for manual inspection.');
    console.log('   - Check screenshot: roster-period-test.png');
    console.log('   - Chrome window is still open for manual testing');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'roster-period-error.png' });
  } finally {
    // Don't close browser - leave it open for manual inspection
    console.log('\n   (Browser left open for manual inspection)');
  }
})();

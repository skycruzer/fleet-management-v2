import { chromium } from '@playwright/test';

(async () => {
  console.log('🚀 Launching Chrome...');
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📍 Navigating to http://localhost:3000...');
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Page loaded successfully!');
    
    // Wait a bit to see if any errors occur
    await page.waitForTimeout(3000);
    
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Take screenshot
    await page.screenshot({ path: 'chrome-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: chrome-test-screenshot.png');
    
    console.log('\n✅ Chrome test completed successfully!');
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
    console.log('👋 Browser closed');
  }
})();

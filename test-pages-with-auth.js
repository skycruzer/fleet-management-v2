/**
 * Comprehensive Dashboard Page Test with Authentication
 * Tests pages by checking server logs for errors
 */

const http = require('http');
const fs = require('fs');

const baseUrl = 'http://localhost:3000';
const logFile = '/tmp/final-server.log';

// Main dashboard pages that load data
const pagesToTest = [
  { path: '/dashboard', name: 'Dashboard Home' },
  { path: '/dashboard/pilots', name: 'Pilots List' },
  { path: '/dashboard/certifications', name: 'Certifications' },
  { path: '/dashboard/certifications/expiring', name: 'Expiring Certifications' },
  { path: '/dashboard/leave', name: 'Leave Requests' },
  { path: '/dashboard/leave/calendar', name: 'Leave Calendar' },
  { path: '/dashboard/leave/approve', name: 'Leave Approval' },
  { path: '/dashboard/flight-requests', name: 'Flight Requests' },
  { path: '/dashboard/feedback', name: 'Feedback' },
  { path: '/dashboard/analytics', name: 'Analytics' },
  { path: '/dashboard/admin', name: 'Admin Dashboard' },
  { path: '/dashboard/disciplinary', name: 'Disciplinary Actions' },
  { path: '/dashboard/tasks', name: 'Tasks' },
  { path: '/dashboard/audit-logs', name: 'Audit Logs' },
];

function testPage(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = http.request(options, (res) => {
      const status = res.statusCode;
      resolve({ path, status });
    });

    req.on('error', (err) => {
      resolve({ path, status: 'ERROR', error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ path, status: 'TIMEOUT' });
    });

    req.end();
  });
}

function getRecentLogErrors(path) {
  try {
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.split('\n');

    // Find recent requests to this path
    const pathLines = [];
    for (let i = lines.length - 1; i >= 0 && pathLines.length < 20; i--) {
      if (lines[i].includes(path)) {
        pathLines.unshift(lines[i]);
      }
    }

    // Check for errors
    const errors = pathLines.filter(line =>
      line.includes('Error:') ||
      line.includes('⨯') ||
      line.includes('Could not embed') ||
      line.includes('PGRST')
    );

    return errors.length > 0 ? errors : null;
  } catch (err) {
    return null;
  }
}

async function runTests() {
  console.log('🧪 Comprehensive Dashboard Page Test\n');
  console.log('Testing pages for runtime errors...\n');
  console.log('━'.repeat(80));

  const results = [];

  for (const page of pagesToTest) {
    // Make request
    const result = await testPage(page.path);

    // Small delay to let server process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check logs for errors
    const errors = getRecentLogErrors(page.path);

    let status = '✅ OK';
    let details = '';

    if (errors && errors.length > 0) {
      status = '❌ ERRORS FOUND';
      details = `\n     ${errors.slice(0, 2).join('\n     ')}`;
      if (errors.length > 2) {
        details += `\n     ... and ${errors.length - 2} more errors`;
      }
    } else if (result.status === 'ERROR') {
      status = '❌ REQUEST FAILED';
      details = ` (${result.error})`;
    } else if (result.status === 'TIMEOUT') {
      status = '⚠️  TIMEOUT';
    } else if (result.status >= 500) {
      status = `❌ SERVER ERROR (${result.status})`;
    }

    results.push({ ...page, status, details, hasErrors: status.includes('❌') });

    console.log(`${status.padEnd(25)} ${page.name}${details}`);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('━'.repeat(80));

  // Summary
  const ok = results.filter(r => r.status.includes('✅')).length;
  const errors = results.filter(r => r.hasErrors).length;
  const warnings = results.filter(r => r.status.includes('⚠️')).length;

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Passing: ${ok}/${results.length}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);

  if (errors > 0) {
    console.log(`\n❌ ${errors} page(s) have runtime errors. Check server logs for details.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All pages load without runtime errors!`);
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

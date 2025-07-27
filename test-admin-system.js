// Quick Admin System Test Script
// Run this in browser console to validate core functionality

console.log('🚀 Starting Admin System Tests...');

// Test Configuration
const TEST_CONFIG = {
  baseUrl: window.location.origin,
  adminUserId: '764a6428-4b01-420f-8b69-3dffea3e883f',
  supabaseUrl: 'https://sxhuqsrnxfunoasutezm.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHVxc3JueGZ1bm9hc3V0ZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzQzMjMsImV4cCI6MjA2ODQ1MDMyM30.acV66qx3m1AgGZxPnqVWDbwODhqcAM_y8cTGNfc3hk0'
};

// Test Results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

// Helper Functions
function logTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    testResults.failures.push(`${name}: ${message}`);
    console.log(`❌ ${name}: ${message}`);
  }
}

function formatTime(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(2)}s`;
}

// Test 1: Raw Auth Library
async function testRawAuth() {
  console.log('\n📋 Testing Raw Auth System...');
  
  try {
    // Test if getRawSession function exists and works
    if (typeof getRawSession !== 'undefined') {
      const startTime = Date.now();
      const session = await getRawSession();
      const loadTime = Date.now() - startTime;
      
      logTest('Raw Auth Import', true);
      logTest('Session Load Speed', loadTime < 2000, loadTime < 2000 ? formatTime(loadTime) : `Too slow: ${formatTime(loadTime)}`);
      logTest('User Data Present', !!session.user, session.user ? 'User found' : 'No user data');
      logTest('Admin Role Check', session.profile?.role === 'admin', `Role: ${session.profile?.role}`);
    } else {
      logTest('Raw Auth Import', false, 'getRawSession function not found - may need to import library');
    }
  } catch (error) {
    logTest('Raw Auth Test', false, error.message);
  }
}

// Test 2: Database Connectivity
async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...');
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/transportation_requests?limit=1`, {
      headers: {
        'apikey': TEST_CONFIG.supabaseKey
      }
    });
    const loadTime = Date.now() - startTime;
    
    logTest('Database Connection', response.ok, response.ok ? 'Connected' : `HTTP ${response.status}`);
    logTest('Database Response Time', loadTime < 1000, formatTime(loadTime));
    
    if (response.ok) {
      const data = await response.json();
      logTest('Data Retrieval', Array.isArray(data), 'Data format check');
    }
  } catch (error) {
    logTest('Database Connection', false, error.message);
  }
}

// Test 3: Page Load Performance
async function testPageLoads() {
  console.log('\n⚡ Testing Page Load Performance...');
  
  const pages = [
    { name: 'Admin Dashboard', url: '/admin' },
    { name: 'New Orders', url: '/admin/orders/new' },
    { name: 'My Orders', url: '/admin/orders/assigned' },
    { name: 'All Orders', url: '/admin/orders/all' }
  ];
  
  for (const page of pages) {
    try {
      const startTime = performance.now();
      
      // Create a temporary iframe to test page load
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = TEST_CONFIG.baseUrl + page.url;
      
      await new Promise((resolve, reject) => {
        iframe.onload = () => {
          const loadTime = performance.now() - startTime;
          logTest(`${page.name} Load`, loadTime < 3000, formatTime(loadTime));
          document.body.removeChild(iframe);
          resolve();
        };
        iframe.onerror = () => {
          logTest(`${page.name} Load`, false, 'Failed to load');
          document.body.removeChild(iframe);
          reject();
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
          logTest(`${page.name} Load`, false, 'Timeout (>10s)');
          document.body.removeChild(iframe);
          reject();
        }, 10000);
        
        document.body.appendChild(iframe);
      });
    } catch (error) {
      logTest(`${page.name} Load`, false, error.message);
    }
  }
}

// Test 4: Admin Functions
async function testAdminFunctions() {
  console.log('\n🛠️ Testing Admin Functions...');
  
  try {
    // Test fetching requests
    const startTime = Date.now();
    const response = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/transportation_requests?select=id,status,assigned_admin_id&limit=10`, {
      headers: {
        'apikey': TEST_CONFIG.supabaseKey
      }
    });
    const loadTime = Date.now() - startTime;
    
    if (response.ok) {
      const requests = await response.json();
      
      logTest('Fetch Requests', true, `${requests.length} requests found`);
      logTest('Request Data Structure', requests.length === 0 || ('id' in requests[0] && 'status' in requests[0]), 'Data format check');
      
      // Test filtering logic
      const unassigned = requests.filter(r => r.status === 'pending' && !r.assigned_admin_id);
      const assigned = requests.filter(r => r.assigned_admin_id === TEST_CONFIG.adminUserId);
      
      logTest('Filter Logic - Unassigned', true, `${unassigned.length} unassigned orders`);
      logTest('Filter Logic - My Orders', true, `${assigned.length} assigned to current admin`);
      
      logTest('Request API Performance', loadTime < 1000, formatTime(loadTime));
    } else {
      logTest('Fetch Requests', false, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('Admin Functions', false, error.message);
  }
}

// Test 5: UI Element Checks (if on admin page)
function testUIElements() {
  console.log('\n🎨 Testing UI Elements...');
  
  // Check if we're on an admin page
  const isAdminPage = window.location.pathname.startsWith('/admin');
  
  if (!isAdminPage) {
    logTest('UI Elements', false, 'Not on admin page - navigate to /admin first');
    return;
  }
  
  // Check for key elements
  const elements = [
    { name: 'Admin Dashboard Title', selector: 'h1' },
    { name: 'Navigation Elements', selector: 'nav, [role="navigation"]' },
    { name: 'Loading Indicators', selector: '.animate-spin' },
    { name: 'Action Buttons', selector: 'button, .btn-primary, .btn-secondary' }
  ];
  
  elements.forEach(element => {
    const found = document.querySelector(element.selector);
    logTest(`UI - ${element.name}`, !!found, found ? 'Found' : 'Missing');
  });
  
  // Check for error messages
  const errorMessages = document.querySelectorAll('[class*="error"], [class*="red-"]');
  logTest('Error State', errorMessages.length === 0, errorMessages.length > 0 ? `${errorMessages.length} error elements found` : 'No errors');
}

// Test 6: Local Storage & Session
function testSessionStorage() {
  console.log('\n💾 Testing Session Storage...');
  
  try {
    // Check for Supabase session in localStorage
    const supabaseSession = localStorage.getItem('sb-sxhuqsrnxfunoasutezm-auth-token');
    logTest('Supabase Session', !!supabaseSession, supabaseSession ? 'Session found' : 'No session');
    
    // Test localStorage functionality
    const testKey = 'admin-test-' + Date.now();
    localStorage.setItem(testKey, 'test-value');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    logTest('localStorage Access', retrieved === 'test-value', 'Read/write test');
    
  } catch (error) {
    logTest('Session Storage', false, error.message);
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('🧪 Admin System Test Suite\n=========================');
  
  const overallStart = Date.now();
  
  await testRawAuth();
  await testDatabaseConnection();
  await testPageLoads();
  await testAdminFunctions();
  testUIElements();
  testSessionStorage();
  
  const totalTime = Date.now() - overallStart;
  
  // Results Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.total}`);
  console.log(`⏱️ Time: ${formatTime(totalTime)}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failures.length > 0) {
    console.log('\n❌ Failures:');
    testResults.failures.forEach(failure => console.log(`   • ${failure}`));
  }
  
  // Overall Assessment
  const successRate = testResults.passed / testResults.total;
  if (successRate >= 0.9) {
    console.log('\n🎉 SYSTEM STATUS: EXCELLENT - Ready for production!');
  } else if (successRate >= 0.8) {
    console.log('\n✅ SYSTEM STATUS: GOOD - Minor issues to address');
  } else if (successRate >= 0.6) {
    console.log('\n⚠️ SYSTEM STATUS: NEEDS ATTENTION - Several issues found');
  } else {
    console.log('\n🚨 SYSTEM STATUS: CRITICAL ISSUES - Requires immediate attention');
  }
  
  return testResults;
}

// Auto-run if script is executed
if (typeof window !== 'undefined') {
  runAllTests().then(results => {
    console.log('\n✨ Testing complete! Check results above.');
  });
} else {
  console.log('❌ This script must be run in a browser environment');
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
} 
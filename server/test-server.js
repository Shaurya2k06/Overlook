const http = require('http');
const { spawn } = require('child_process');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  console.log(`${colors.bold}[TEST]${colors.reset} ${testName}: ${colors[statusColor]}${status}${colors.reset} ${details}`);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && method !== 'GET') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function waitForServer(maxAttempts = 30) {
  log('Waiting for server to start...', 'yellow');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest('/');
      log('Server is ready!', 'green');
      return true;
    } catch (err) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  log('\nServer failed to start within timeout period', 'red');
  return false;
}

async function testBasicEndpoints() {
  log('\n=== Testing Basic Endpoints ===', 'blue');

  // Test root endpoint
  try {
    const response = await makeRequest('/');
    logTest('Root endpoint', response.statusCode === 200 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);

    if (response.data && response.data.message) {
      log(`  Message: ${response.data.message}`, 'reset');
    }
  } catch (err) {
    logTest('Root endpoint', 'FAIL', `Error: ${err.message}`);
  }

  // Test security health endpoint
  try {
    const response = await makeRequest('/api/security/health');
    logTest('Security health', response.statusCode === 200 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);

    if (response.data && response.data.success) {
      log(`  Exploits available: ${response.data.data.exploits}`, 'reset');
    }
  } catch (err) {
    logTest('Security health', 'FAIL', `Error: ${err.message}`);
  }
}

async function testSecurityEndpoints() {
  log('\n=== Testing Security Endpoints ===', 'blue');

  // Test exploits list
  try {
    const response = await makeRequest('/api/security/exploits');
    logTest('Exploits list', response.statusCode === 200 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);

    if (response.data && response.data.data) {
      log(`  Total exploits: ${response.data.data.total}`, 'reset');
      log(`  Categories: ${response.data.data.categories.join(', ')}`, 'reset');
    }
  } catch (err) {
    logTest('Exploits list', 'FAIL', `Error: ${err.message}`);
  }

  // Test security stats
  try {
    const response = await makeRequest('/api/security/stats');
    logTest('Security stats', response.statusCode === 200 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);

    if (response.data && response.data.data) {
      log(`  Active scans: ${response.data.data.activeScans}`, 'reset');
      log(`  Completed scans: ${response.data.data.completedScans}`, 'reset');
    }
  } catch (err) {
    logTest('Security stats', 'FAIL', `Error: ${err.message}`);
  }

  // Test scan results
  try {
    const response = await makeRequest('/api/security/results');
    logTest('Scan results', response.statusCode === 200 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);
  } catch (err) {
    logTest('Scan results', 'FAIL', `Error: ${err.message}`);
  }
}

async function testExploitExecution() {
  log('\n=== Testing Exploit Execution ===', 'blue');

  // Test SQL injection with a test target
  const testPayload = {
    target: 'http://testphp.vulnweb.com',
    options: {
      timeout: 5000,
      maxDepth: 1
    }
  };

  try {
    log('Testing SQL injection exploit...', 'yellow');
    const response = await makeRequest('/api/security/sql-injection', 'POST', testPayload);
    logTest('SQL injection exploit',
           response.statusCode === 200 || response.statusCode === 403 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);

    if (response.data) {
      log(`  Response: ${response.data.error || 'Success'}`, 'reset');
    }
  } catch (err) {
    logTest('SQL injection exploit', 'FAIL', `Error: ${err.message}`);
  }

  // Test XSS with localhost (should be allowed)
  const localhostPayload = {
    target: 'http://localhost:3000',
    options: {
      timeout: 3000,
      payloads: ['<script>alert("test")</script>']
    }
  };

  try {
    log('Testing XSS exploit against localhost...', 'yellow');
    const response = await makeRequest('/api/security/xss', 'POST', localhostPayload);
    logTest('XSS exploit (localhost)',
           response.statusCode === 200 ? 'PASS' : 'WARN',
           `Status: ${response.statusCode}`);
  } catch (err) {
    logTest('XSS exploit (localhost)', 'WARN', `Error: ${err.message}`);
  }
}

async function testValidationAndSecurity() {
  log('\n=== Testing Validation & Security ===', 'blue');

  // Test invalid URL
  try {
    const response = await makeRequest('/api/security/sql-injection', 'POST', {
      target: 'invalid-url',
      options: {}
    });
    logTest('Invalid URL validation',
           response.statusCode === 400 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);
  } catch (err) {
    logTest('Invalid URL validation', 'FAIL', `Error: ${err.message}`);
  }

  // Test unauthorized domain
  try {
    const response = await makeRequest('/api/security/sql-injection', 'POST', {
      target: 'https://google.com',
      options: {}
    });
    logTest('Unauthorized domain blocking',
           response.statusCode === 403 ? 'PASS' : 'FAIL',
           `Status: ${response.statusCode}`);
  } catch (err) {
    logTest('Unauthorized domain blocking', 'FAIL', `Error: ${err.message}`);
  }
}

async function runTests() {
  log(`${colors.bold}=== Overlook Security Suite Test ===\n`, 'blue');

  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    log('Aborting tests - server not available', 'red');
    process.exit(1);
  }

  // Run test suites
  await testBasicEndpoints();
  await testSecurityEndpoints();
  await testExploitExecution();
  await testValidationAndSecurity();

  log('\n=== Test Summary ===', 'blue');
  log('If all tests show PASS or expected WARN statuses, your security suite is working correctly!', 'green');
  log('\nTo start the server manually:', 'yellow');
  log('  cd Overlook/server && npm start', 'reset');
  log('\nSecurity endpoints available at:', 'yellow');
  log('  http://localhost:3003/api/security/health', 'reset');
  log('  http://localhost:3003/api/security/exploits', 'reset');
  log('  http://localhost:3003/api/security/stats', 'reset');
}

// Handle process cleanup
process.on('SIGINT', () => {
  log('\nTest interrupted by user', 'yellow');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'red');
});

// Run the tests
runTests().catch((err) => {
  log(`Test suite failed: ${err.message}`, 'red');
  process.exit(1);
});

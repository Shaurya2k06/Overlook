const http = require('http');
const readline = require('readline');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

async function checkServerStatus() {
  try {
    const response = await makeRequest('/');
    if (response.statusCode === 200) {
      log('✅ Server is running on port 3003', 'green');
      return true;
    } else {
      log('❌ Server responded with error', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Server is not running. Please start it with: cd Overlook/server && npm start', 'red');
    return false;
  }
}

async function showMenu() {
  log('\n=== Overlook Security Suite Interactive Tester ===', 'bold');
  log('1. Check Server Status', 'cyan');
  log('2. View Available Exploits', 'cyan');
  log('3. Test SQL Injection', 'cyan');
  log('4. Test XSS', 'cyan');
  log('5. Test CSRF', 'cyan');
  log('6. Test Network Scanner', 'cyan');
  log('7. Test SSL Analysis', 'cyan');
  log('8. Run Security Suite (Multiple Exploits)', 'cyan');
  log('9. Test Domain Validation (Should Fail)', 'cyan');
  log('10. View Security Statistics', 'cyan');
  log('11. View Scan Results', 'cyan');
  log('0. Exit', 'yellow');
  log('═══════════════════════════════════════════════════', 'blue');
}

async function testExploit(exploitName, target, options = {}) {
  log(`\n🧪 Testing ${exploitName} against ${target}...`, 'yellow');

  try {
    const response = await makeRequest(`/api/security/${exploitName}`, 'POST', {
      target,
      options
    });

    if (response.statusCode === 200) {
      log('✅ Test completed successfully!', 'green');
      if (response.data.data) {
        const vulns = response.data.data.vulnerabilities || [];
        log(`   Vulnerabilities found: ${vulns.length}`, 'cyan');
        if (vulns.length > 0) {
          vulns.slice(0, 3).forEach((vuln, i) => {
            log(`   ${i + 1}. ${vuln.type} (${vuln.severity}) at ${vuln.location}`, 'yellow');
          });
          if (vulns.length > 3) {
            log(`   ... and ${vulns.length - 3} more`, 'cyan');
          }
        }
        log(`   Scan ID: ${response.data.data.scanId}`, 'blue');
      }
    } else if (response.statusCode === 403) {
      log('🚫 Domain not allowed for testing (security protection working)', 'yellow');
      log(`   Error: ${response.data.error}`, 'cyan');
    } else {
      log(`❌ Test failed with status ${response.statusCode}`, 'red');
      log(`   Error: ${response.data.error || 'Unknown error'}`, 'cyan');
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }
}

async function viewExploits() {
  log('\n📋 Fetching available exploits...', 'yellow');

  try {
    const response = await makeRequest('/api/security/exploits');

    if (response.statusCode === 200 && response.data.success) {
      const exploits = response.data.data.exploits;
      log(`\n✅ Found ${exploits.length} available exploits:`, 'green');

      exploits.forEach((exploit, i) => {
        const severity = exploit.severity === 'high' ? 'red' :
                        exploit.severity === 'medium' ? 'yellow' : 'green';
        log(`${i + 1}. ${exploit.displayName} (${exploit.name})`, 'cyan');
        log(`   Category: ${exploit.category} | Severity: ${colors[severity]}${exploit.severity}${colors.reset}`, 'reset');
      });

      log(`\nCategories: ${response.data.data.categories.join(', ')}`, 'blue');
    } else {
      log('❌ Failed to fetch exploits', 'red');
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }
}

async function viewStats() {
  log('\n📊 Fetching security statistics...', 'yellow');

  try {
    const response = await makeRequest('/api/security/stats');

    if (response.statusCode === 200 && response.data.success) {
      const stats = response.data.data;
      log('\n✅ Security Statistics:', 'green');
      log(`   Exploits Available: ${stats.exploitsAvailable}`, 'cyan');
      log(`   Active Scans: ${stats.activeScans}`, 'cyan');
      log(`   Completed Scans: ${stats.completedScans}`, 'cyan');

      if (stats.lastScanTime) {
        log(`   Last Scan: ${new Date(stats.lastScanTime).toLocaleString()}`, 'cyan');
      } else {
        log(`   Last Scan: Never`, 'cyan');
      }
    } else {
      log('❌ Failed to fetch statistics', 'red');
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }
}

async function viewResults() {
  log('\n📄 Fetching scan results...', 'yellow');

  try {
    const response = await makeRequest('/api/security/results');

    if (response.statusCode === 200 && response.data.success) {
      const results = response.data.data.results;
      log(`\n✅ Found ${results.length} scan results:`, 'green');

      if (results.length === 0) {
        log('   No scan results yet. Run some exploits first!', 'cyan');
      } else {
        results.slice(0, 5).forEach((result, i) => {
          log(`${i + 1}. ${result.exploitName} on ${result.target}`, 'cyan');
          log(`   Date: ${new Date(result.timestamp).toLocaleString()}`, 'reset');
          log(`   Vulnerabilities: ${result.vulnerabilities?.length || 0}`, 'yellow');
        });

        if (results.length > 5) {
          log(`   ... and ${results.length - 5} more results`, 'cyan');
        }
      }
    } else {
      log('❌ Failed to fetch results', 'red');
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }
}

async function runSecuritySuite() {
  log('\n🎯 Running comprehensive security suite...', 'yellow');

  const target = 'http://testphp.vulnweb.com';
  const selectedExploits = ['sqlInjection', 'xss', 'csrf'];

  try {
    const response = await makeRequest('/api/security/suite', 'POST', {
      target,
      selectedExploits,
      options: {
        timeout: 10000,
        maxDepth: 2,
        aggressive: false
      }
    });

    if (response.statusCode === 200) {
      log('✅ Security suite completed!', 'green');
      if (response.data.data) {
        const results = response.data.data.results || [];
        log(`   Exploits run: ${results.length}`, 'cyan');

        let totalVulns = 0;
        results.forEach((result, i) => {
          const vulns = result.vulnerabilities?.length || 0;
          totalVulns += vulns;
          log(`   ${i + 1}. ${result.exploitName}: ${vulns} vulnerabilities`, 'yellow');
        });

        log(`   Total vulnerabilities found: ${totalVulns}`, 'bold');
        log(`   Suite ID: ${response.data.data.suiteId}`, 'blue');
      }
    } else {
      log(`❌ Security suite failed with status ${response.statusCode}`, 'red');
      log(`   Error: ${response.data.error || 'Unknown error'}`, 'cyan');
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }
}

async function testDomainValidation() {
  log('\n🚫 Testing domain validation (this should fail)...', 'yellow');

  try {
    const response = await makeRequest('/api/security/sql-injection', 'POST', {
      target: 'https://google.com',
      options: {}
    });

    if (response.statusCode === 403) {
      log('✅ Domain validation working correctly!', 'green');
      log('   Google.com was blocked as expected', 'cyan');
      log(`   Allowed domains: ${response.data.allowedDomains?.join(', ')}`, 'blue');
    } else {
      log('❌ Domain validation failed - unauthorized domain was allowed!', 'red');
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
  }
}

async function getUserChoice() {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}Enter your choice (0-11): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  log('🚀 Starting Overlook Security Suite Interactive Tester', 'bold');

  // Check if server is running
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    log('\n💡 To start the server, run:', 'yellow');
    log('   cd Overlook/server && npm start', 'cyan');
    process.exit(1);
  }

  while (true) {
    await showMenu();
    const choice = await getUserChoice();

    switch (choice) {
      case '1':
        await checkServerStatus();
        break;

      case '2':
        await viewExploits();
        break;

      case '3':
        await testExploit('sql-injection', 'http://testphp.vulnweb.com', {
          timeout: 5000,
          maxDepth: 2
        });
        break;

      case '4':
        await testExploit('xss', 'http://testphp.vulnweb.com', {
          payloads: ['<script>alert("test")</script>', '<img src=x onerror=alert(1)>'],
          timeout: 5000
        });
        break;

      case '5':
        await testExploit('csrf', 'http://testphp.vulnweb.com', {
          timeout: 5000
        });
        break;

      case '6':
        await testExploit('network-scan', 'http://127.0.0.1', {
          ports: [22, 80, 443, 3000, 3003, 8080],
          timeout: 3000
        });
        break;

      case '7':
        await testExploit('ssl-analysis', 'https://testphp.vulnweb.com', {
          timeout: 10000
        });
        break;

      case '8':
        await runSecuritySuite();
        break;

      case '9':
        await testDomainValidation();
        break;

      case '10':
        await viewStats();
        break;

      case '11':
        await viewResults();
        break;

      case '0':
        log('\n👋 Goodbye!', 'green');
        rl.close();
        process.exit(0);
        break;

      default:
        log('\n❌ Invalid choice. Please enter a number between 0-11.', 'red');
        break;
    }

    // Wait for user to press enter before showing menu again
    if (choice !== '0') {
      await new Promise((resolve) => {
        rl.question(`\n${colors.blue}Press Enter to continue...${colors.reset}`, () => {
          resolve();
        });
      });
    }
  }
}

// Handle process cleanup
process.on('SIGINT', () => {
  log('\n\n👋 Interrupted by user. Goodbye!', 'yellow');
  rl.close();
  process.exit(0);
});

// Start the interactive tester
main().catch((err) => {
  log(`💥 Fatal error: ${err.message}`, 'red');
  rl.close();
  process.exit(1);
});

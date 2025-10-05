# 🧪 Overlook Security Suite Testing Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
cd Overlook/server
npm start
```

Wait for the message: "Server running on port 3003"

### 2. Verify Server is Running
Open your browser and go to: http://localhost:3003

You should see:
```json
{
  "message": "Overlook Collaborative Code Editor",
  "activeRooms": 0,
  "status": "running"
}
```

## 🔍 Browser Testing (Click These Links)

### Basic Health Checks
- **Server Status**: http://localhost:3003/
- **Security Health**: http://localhost:3003/api/security/health
- **Available Exploits**: http://localhost:3003/api/security/exploits
- **Security Statistics**: http://localhost:3003/api/security/stats
- **Scan Results**: http://localhost:3003/api/security/results

### Expected Responses

#### Security Health Check
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "exploits": 10,
    "systemHealth": {...},
    "timestamp": "2024-01-XX..."
  }
}
```

#### Available Exploits
```json
{
  "success": true,
  "data": {
    "exploits": [
      {
        "name": "sqlInjection",
        "displayName": "SQL Injection",
        "category": "web-application",
        "severity": "high"
      },
      // ... 9 more exploits
    ],
    "total": 10,
    "categories": ["web-application", "authentication", "network", "cryptographic", "memory-corruption"]
  }
}
```

## 🧪 Testing Individual Exploits

### Using curl Commands

#### 1. Test SQL Injection (Approved Target)
```bash
curl -X POST http://localhost:3003/api/security/sql-injection \
  -H "Content-Type: application/json" \
  -d '{
    "target": "http://testphp.vulnweb.com",
    "options": {
      "timeout": 5000,
      "maxDepth": 2
    }
  }'
```

#### 2. Test XSS on Localhost (Safe)
```bash
curl -X POST http://localhost:3003/api/security/xss \
  -H "Content-Type: application/json" \
  -d '{
    "target": "http://localhost:3000",
    "options": {
      "payloads": ["<script>alert(\"test\")</script>"],
      "timeout": 3000
    }
  }'
```

#### 3. Test CSRF Protection
```bash
curl -X POST http://localhost:3003/api/security/csrf \
  -H "Content-Type: application/json" \
  -d '{
    "target": "http://testphp.vulnweb.com",
    "options": {
      "timeout": 5000
    }
  }'
```

#### 4. Test Network Scanner
```bash
curl -X POST http://localhost:3003/api/security/network-scan \
  -H "Content-Type: application/json" \
  -d '{
    "target": "http://127.0.0.1",
    "options": {
      "ports": [80, 443, 3000, 3003],
      "timeout": 3000
    }
  }'
```

#### 5. Test SSL/TLS Analysis
```bash
curl -X POST http://localhost:3003/api/security/ssl-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://testphp.vulnweb.com",
    "options": {
      "timeout": 10000
    }
  }'
```

## 🔒 Security Validation Tests

### Test Invalid URLs (Should Fail)
```bash
curl -X POST http://localhost:3003/api/security/sql-injection \
  -H "Content-Type: application/json" \
  -d '{
    "target": "invalid-url",
    "options": {}
  }'
```

Expected Response:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "msg": "Valid target URL is required",
      "param": "target"
    }
  ]
}
```

### Test Unauthorized Domain (Should Block)
```bash
curl -X POST http://localhost:3003/api/security/sql-injection \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://google.com",
    "options": {}
  }'
```

Expected Response:
```json
{
  "success": false,
  "error": "Target domain not allowed for security testing",
  "allowedDomains": ["localhost", "127.0.0.1", "testphp.vulnweb.com", ...]
}
```

## 🎯 Comprehensive Security Suite Test

### Run Full Security Scan
```bash
curl -X POST http://localhost:3003/api/security/suite \
  -H "Content-Type: application/json" \
  -d '{
    "target": "http://testphp.vulnweb.com",
    "selectedExploits": ["sqlInjection", "xss", "csrf"],
    "options": {
      "timeout": 10000,
      "maxDepth": 2,
      "aggressive": false
    }
  }'
```

## 🛠️ Advanced Testing with Node.js Script

Create a test file (`test-exploits.js`):

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api/security';

async function testExploit(exploitName, target, options = {}) {
  try {
    const response = await axios.post(`${BASE_URL}/${exploitName}`, {
      target,
      options
    });
    
    console.log(`✅ ${exploitName}: SUCCESS`);
    console.log(`   Vulnerabilities found: ${response.data.data?.vulnerabilities?.length || 0}`);
    return response.data;
  } catch (error) {
    console.log(`❌ ${exploitName}: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Overlook Security Suite\n');
  
  // Test safe targets
  await testExploit('sql-injection', 'http://testphp.vulnweb.com');
  await testExploit('xss', 'http://localhost:3000');
  await testExploit('csrf', 'http://testphp.vulnweb.com');
  await testExploit('network-scan', 'http://127.0.0.1');
  
  console.log('\n✨ Testing complete!');
}

runTests();
```

Run with: `node test-exploits.js`

## 🎯 Safe Testing Targets

### Approved Domains for Testing:
- `http://testphp.vulnweb.com` - Legal vulnerability testing site
- `http://demo.testfire.net` - IBM's test application
- `http://localhost` - Your local applications
- `http://127.0.0.1` - Local network testing

### Educational Platforms:
- **DVWA** (Damn Vulnerable Web Application) - Setup locally
- **WebGoat** - OWASP's vulnerable application
- **VulnHub VMs** - Download vulnerable virtual machines

## 📊 Understanding Results

### Successful Exploit Response:
```json
{
  "success": true,
  "data": {
    "exploitName": "sqlInjection",
    "target": "http://testphp.vulnweb.com",
    "vulnerabilities": [
      {
        "type": "SQL Injection",
        "severity": "high",
        "location": "/search.php?query=",
        "payload": "' OR 1=1--",
        "evidence": "MySQL error detected"
      }
    ],
    "scanId": "uuid-here",
    "timestamp": "2024-01-XX...",
    "duration": 2500
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Target domain not allowed for security testing",
  "allowedDomains": ["localhost", "127.0.0.1", ...]
}
```

## 🚨 Important Security Notes

1. **Only test authorized targets** - Never test sites you don't own without permission
2. **Use provided test sites** - testphp.vulnweb.com is specifically for security testing
3. **Rate limiting** - The suite has built-in rate limiting to prevent abuse
4. **Logging** - All tests are logged for audit purposes

## 🔧 Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3003

# Kill process if needed
pkill -f "node main.js"

# Restart server
cd Overlook/server && npm start
```

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux

# Start MongoDB if needed
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

### Dependencies Missing
```bash
cd Overlook/server
npm install
```

## 📈 Next Steps

1. **Frontend Integration** - Connect your React frontend to these API endpoints
2. **Automated Scanning** - Set up scheduled scans using cron jobs
3. **Reporting** - Generate PDF/HTML reports from scan results
4. **Custom Exploits** - Add your own security test modules

## 🎉 Success Indicators

Your security suite is working correctly if you see:
- ✅ Server starts without errors on port 3003
- ✅ `/api/security/health` returns 200 with 10 exploits
- ✅ Individual exploits return structured vulnerability data
- ✅ Invalid requests are properly rejected with 400/403 errors
- ✅ MongoDB connection established

Happy testing! 🚀
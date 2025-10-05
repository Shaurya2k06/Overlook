# Overlook Security Testing Guide

## Overview

The Overlook security testing suite provides a comprehensive sandbox environment for running individual security exploits against your applications. This guide walks you through setting up and using the system to perform real vulnerability testing.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main App      │    │  Security API   │    │  Sandbox Env   │
│  (Port 3001)    │◄──►│  /api/security  │◄──►│  (Port 3002)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                        ┌─────────────────┬─────────────┼─────────────────┐
                        │                 │             │                 │
                   ┌────▼────┐      ┌────▼────┐   ┌────▼────┐      ┌────▼────┐
                   │ WebGoat │      │  DVWA   │   │ OWASP   │      │Database │
                   │ :8080   │      │  :8081  │   │ ZAP     │      │ :5433   │
                   └─────────┘      └─────────┘   │ :8090   │      └─────────┘
                                                  └─────────┘
```

## Quick Setup

### 1. Run the Setup Script

```bash
cd Overlook/server/security
./setup-security-testing.sh
```

This script will:
- Check prerequisites (Docker, Node.js)
- Create necessary directories and files
- Install dependencies
- Build Docker images
- Start all services

### 2. Configure Environment

Edit `server/security/sandbox/.env`:

```bash
# Add your API keys (optional)
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_key_here

# Configure allowed test domains
ALLOWED_DOMAINS=localhost,127.0.0.1,webgoat,dvwa-test-app,vulnerable-test-app

# Set rate limits
RATE_LIMIT_REQUESTS=20
RATE_LIMIT_WINDOW=60000
```

## Running Individual Exploits

### Available Exploit Types

| Exploit Type | Description | Severity |
|--------------|-------------|----------|
| `sql_injection` | SQL Injection testing | Critical |
| `xss` | Cross-Site Scripting | High |
| `csrf` | Cross-Site Request Forgery | High |
| `auth_bypass` | Authentication bypass | Critical |
| `directory_traversal` | Path traversal | Critical |
| `open_redirect` | Open redirect | Medium |
| `ssrf` | Server-Side Request Forgery | Critical |
| `command_injection` | OS command injection | Critical |
| `file_upload` | File upload vulnerabilities | High |
| `cors_misconfiguration` | CORS security issues | Medium |

### API Usage Examples

#### 1. Test SQL Injection

```bash
curl -X POST http://localhost:3001/api/security/exploits/sql_injection \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "http://localhost:8081/vulnerabilities/sqli/?id=1&Submit=Submit",
    "options": {
      "timeout": 10000,
      "payloadLimit": 20
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testId": "test_1703123456789_abc123",
    "exploitType": "sql_injection",
    "targetUrl": "http://localhost:8081/vulnerabilities/sqli/?id=1&Submit=Submit",
    "status": "completed",
    "vulnerable": true,
    "findings": [
      {
        "type": "sql_error_disclosure",
        "payload": "' OR '1'='1",
        "evidence": "SQL error messages detected in response",
        "severity": "high",
        "responseTime": 156
      }
    ],
    "testedPayloads": 6,
    "riskLevel": "high",
    "duration": 3245,
    "timestamp": "2023-12-21T10:30:45.789Z"
  }
}
```

#### 2. Test XSS Vulnerabilities

```bash
curl -X POST http://localhost:3001/api/security/exploits/xss \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "http://localhost:8081/vulnerabilities/xss_r/",
    "options": {
      "testReflected": true,
      "testStored": false
    }
  }'
```

#### 3. Run Comprehensive Security Scan

```bash
curl -X POST http://localhost:3001/api/security/scan/comprehensive \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "http://localhost:8081",
    "exploitTypes": ["sql_injection", "xss", "csrf", "directory_traversal"],
    "options": {
      "parallel": false,
      "delayBetweenTests": 1000
    }
  }'
```

**Comprehensive Scan Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "scanId": "scan_1703123456789_xyz789",
      "targetUrl": "http://localhost:8081",
      "timestamp": "2023-12-21T10:35:00.000Z",
      "totalTests": 4,
      "successfulTests": 4,
      "failedTests": 0,
      "vulnerabilitiesFound": 8,
      "criticalFindings": 2,
      "highFindings": 4,
      "mediumFindings": 2,
      "lowFindings": 0
    },
    "results": [...]
  }
}
```

## Frontend Integration

### Using the Security Testing Page

1. Navigate to `http://localhost:3001/security-testing`
2. Click on any test in the "ACTIVE_PENETRATION_TESTS" section
3. Use the `[START]`, `[STOP]`, or `[CONFIG]` buttons
4. View real-time results and findings

### Programmatic Integration

```javascript
// In your React component
const runSecurityTest = async (exploitType, targetUrl) => {
  try {
    const response = await fetch(`/api/security/exploits/${exploitType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUrl })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Test completed:', result.data);
      // Update UI with results
      setTestResults(prev => [...prev, result.data]);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

## Test Targets

### Built-in Vulnerable Applications

#### 1. DVWA (Damn Vulnerable Web Application)
- **URL**: http://localhost:8081
- **Login**: admin/password
- **Tests**: SQL injection, XSS, CSRF, file upload
- **Security Levels**: Low, Medium, High, Impossible

#### 2. WebGoat
- **URL**: http://localhost:8080
- **Tests**: OWASP Top 10 vulnerabilities
- **Interactive lessons with built-in challenges

### Testing Your Own Application

```bash
# Test your local development server
curl -X POST http://localhost:3001/api/security/exploits/sql_injection \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "http://localhost:3001/api/rooms",
    "options": {
      "authenticatedTest": true,
      "sessionCookie": "your-session-cookie"
    }
  }'
```

## Advanced Configuration

### Custom Exploit Options

```javascript
{
  "targetUrl": "http://target.com/endpoint",
  "options": {
    // General options
    "timeout": 15000,
    "userAgent": "Custom-Security-Scanner/1.0",
    "maxRedirects": 5,
    
    // Authentication
    "authType": "bearer", // "basic", "bearer", "cookie"
    "authToken": "your-jwt-token",
    "sessionCookie": "session=abc123",
    
    // Test-specific options
    "payloadFile": "/custom/payloads.txt",
    "skipPayloads": ["payload1", "payload2"],
    "customHeaders": {
      "X-Custom": "value"
    },
    
    // Rate limiting
    "requestDelay": 500,
    "maxConcurrent": 3,
    
    // Reporting
    "includeRequestResponse": true,
    "screenshotOnSuccess": true
  }
}
```

### Environment Variables

```bash
# In sandbox/.env

# Security settings
RATE_LIMIT_REQUESTS=50          # Requests per window
RATE_LIMIT_WINDOW=60000         # Window in milliseconds
MAX_CONCURRENT_TESTS=10         # Max parallel tests
TEST_TIMEOUT=30000              # Default test timeout

# Target restrictions
ALLOWED_DOMAINS=localhost,127.0.0.1,testsite.com
BLOCKED_PATTERNS=production,live,api.company.com

# Reporting
REPORT_RETENTION_DAYS=30        # Keep test results for 30 days
AUTO_CLEANUP_ENABLED=true       # Automatically clean old results
NOTIFICATION_ENABLED=true       # Send notifications on findings

# External integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
JIRA_API_URL=https://company.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-api-token
```

## Monitoring and Logging

### Real-time Test Monitoring

```bash
# View active tests
curl http://localhost:3001/api/security/exploits/active

# Get specific test result
curl http://localhost:3001/api/security/exploits/results/test_123456789_abc

# Monitor logs
docker-compose logs -f security-sandbox
```

### Database Queries

```sql
-- View recent vulnerabilities
SELECT 
    tr.exploit_type,
    tr.target_url,
    tr.vulnerable,
    tr.risk_level,
    COUNT(vf.id) as finding_count
FROM test_results tr
LEFT JOIN vulnerability_findings vf ON tr.id = vf.test_result_id
WHERE tr.timestamp > NOW() - INTERVAL '24 hours'
GROUP BY tr.id
ORDER BY tr.timestamp DESC;

-- Security metrics over time
SELECT 
    DATE(timestamp) as test_date,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN vulnerable = true THEN 1 END) as vulnerable_tests,
    AVG(duration) as avg_duration
FROM test_results
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY test_date;
```

## Security Considerations

### Safe Testing Practices

1. **Only test authorized targets**
   - Use the ALLOWED_DOMAINS configuration
   - Never test production systems without permission
   - Test in isolated environments

2. **Rate limiting and throttling**
   - Configure appropriate request delays
   - Limit concurrent tests
   - Monitor target system load

3. **Data handling**
   - Test results may contain sensitive data
   - Configure proper retention policies
   - Use encryption for stored results

### Legal and Ethical Guidelines

⚠️ **Important**: Only use this tool on systems you own or have explicit written permission to test.

- Obtain proper authorization before testing
- Follow responsible disclosure practices
- Respect rate limits and system resources
- Document all testing activities
- Report findings through appropriate channels

## Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker status
docker info

# Check port availability
netstat -tulpn | grep :3002

# Restart services
cd server/security/sandbox
./stop-security-testing.sh
./start-security-testing.sh
```

#### Test Failures
```bash
# Check sandbox logs
docker-compose logs security-sandbox

# Verify target accessibility
curl -I http://target-url

# Check domain allowlist
grep ALLOWED_DOMAINS sandbox/.env
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Connect to database
docker-compose exec postgres psql -U sandbox_user -d sandbox_db

# Reset database
docker-compose down
docker volume rm sandbox_postgres_data
docker-compose up -d
```

### Performance Optimization

```bash
# Increase memory limits
export DOCKER_DEFAULT_MEM=2g

# Optimize concurrent tests
# In .env:
MAX_CONCURRENT_TESTS=5
REQUEST_DELAY=100

# Enable result caching
CACHE_RESULTS=true
CACHE_TTL=3600
```

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/security/health` | Check sandbox health |
| GET | `/api/security/exploits/types` | Get available exploit types |
| POST | `/api/security/exploits/{type}` | Run specific exploit test |
| GET | `/api/security/exploits/active` | Get running tests |
| GET | `/api/security/exploits/results` | Get all test results |
| GET | `/api/security/exploits/results/{id}` | Get specific test result |
| POST | `/api/security/scan/comprehensive` | Run multiple tests |

### Response Formats

All API responses follow this format:

```json
{
  "success": true|false,
  "data": { /* response data */ },
  "error": "error message (if success=false)",
  "details": "additional error details",
  "pagination": { /* for paginated responses */ }
}
```

## Contributing

To add new exploit types:

1. Add the exploit class to `sandbox-server.js`
2. Implement the test method following the pattern
3. Add the exploit type to the types endpoint
4. Update documentation
5. Add tests for the new exploit

Example exploit implementation:

```javascript
async testCustomExploit(targetUrl, options) {
  const findings = [];
  let vulnerable = false;

  // Your exploit logic here
  
  return {
    vulnerable,
    findings,
    riskLevel: vulnerable ? 'high' : 'low'
  };
}
```

---

For additional help, check the logs, review the Docker Compose configuration, or consult the API documentation at `http://localhost:3002/docs` (if available).
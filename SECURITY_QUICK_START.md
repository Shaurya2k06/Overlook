# Overlook Security Suite - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Start the Server

```bash
cd server
npm install
node main.js
```

Server runs on: `http://localhost:3003`

### 2. Test the Security Dashboard

```bash
curl http://localhost:3003/api/security/dashboard
```

### 3. Run Your First Security Scan

#### SQL Injection Test
```bash
curl -X POST http://localhost:3003/api/security/sql-injection \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://testphp.vulnweb.com/artists.php?artist=1",
    "options": {"delay": 100}
  }'
```

#### XSS Vulnerability Scan
```bash
curl -X POST http://localhost:3003/api/security/xss \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://xss-game.appspot.com/level1/frame?query=test",
    "options": {"delay": 100}
  }'
```

#### Comprehensive Security Suite
```bash
curl -X POST http://localhost:3003/api/security/suite \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://demo.testfire.net",
    "selectedExploits": ["sqlInjection", "xss", "csrf"],
    "options": {"delay": 200}
  }'
```

### 4. Check Available Exploits

```bash
curl http://localhost:3003/api/security/exploits
```

### 5. Monitor Scan Results

```bash
curl http://localhost:3003/api/security/results
```

## 🛡️ Available Security Tests

| Test | Endpoint | Description |
|------|----------|-------------|
| SQL Injection | `/api/security/sql-injection` | Database injection testing |
| XSS | `/api/security/xss` | Cross-site scripting detection |
| CSRF | `/api/security/csrf` | Cross-site request forgery |
| Auth Bypass | `/api/security/auth-bypass` | Authentication bypass testing |
| Directory Traversal | `/api/security/directory-traversal` | Path traversal detection |
| Command Injection | `/api/security/command-injection` | Command injection testing |
| Network Scan | `/api/security/network-scan` | Port and service scanning |
| SSL Analysis | `/api/security/ssl-analysis` | SSL/TLS security analysis |
| Web Vuln Scan | `/api/security/web-vuln-scan` | General web vulnerabilities |
| Buffer Overflow | `/api/security/buffer-overflow` | Memory corruption testing |

## 🎯 Test Targets

Safe testing targets included:
- `testphp.vulnweb.com`
- `demo.testfire.net`
- `xss-game.appspot.com`
- `localhost` (your own apps)

## ⚡ Example Response

```json
{
  "success": true,
  "scanId": "scan_1640995200000_abc123",
  "message": "SQL injection scan started",
  "estimatedTime": 30,
  "data": {
    "vulnerabilities": [
      {
        "type": "SQL Injection",
        "severity": "critical",
        "parameter": "artist",
        "evidence": "Boolean-based blind injection detected",
        "recommendation": "Use parameterized queries"
      }
    ]
  }
}
```

## 🔧 Common Options

```json
{
  "target": "https://example.com/vulnerable?id=1",
  "options": {
    "delay": 100,          // ms between requests
    "timeout": 30000,      // request timeout
    "bypassDomainCheck": true  // for authorized testing
  }
}
```

## 📊 Quick Dashboard Check

Visit in browser: `http://localhost:3003/api/security/dashboard`

## 🚨 Security Notice

- Only test applications you own or have permission to test
- Use responsible disclosure for any vulnerabilities found
- Respect rate limits and target system resources

## 🛠️ Troubleshooting

**Port in use?**
```bash
PORT=3004 node main.js
```

**Need help?**
```bash
curl http://localhost:3003/api/security/health
```

---

**Ready to secure your applications! 🔒**

For full documentation, see `SECURITY_SUITE_README.md`

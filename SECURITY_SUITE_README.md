# Overlook Security Suite

A comprehensive security testing framework integrated into the Overlook collaborative coding platform. This suite provides advanced vulnerability detection and penetration testing capabilities for web applications.

## 🚀 Features

### Core Security Modules

1. **SQL Injection Scanner** - Advanced SQL injection vulnerability detection
2. **XSS Scanner** - Cross-Site Scripting vulnerability analysis
3. **CSRF Scanner** - Cross-Site Request Forgery testing
4. **Authentication Bypass Scanner** - Authentication mechanism testing
5. **Directory Traversal Scanner** - Path traversal vulnerability detection
6. **Command Injection Scanner** - Command injection vulnerability testing
7. **Network Scanner** - Port scanning and service enumeration
8. **SSL/TLS Analyzer** - SSL/TLS security configuration analysis
9. **Web Vulnerability Scanner** - Comprehensive web application security testing
10. **Buffer Overflow Scanner** - Memory corruption vulnerability detection

### Advanced Capabilities

- **Real-time Scanning** - Live vulnerability assessment with progress tracking
- **Comprehensive Reporting** - Detailed vulnerability reports with remediation guidance
- **Multi-format Output** - JSON, HTML, and PDF report generation
- **Risk Assessment** - Automated vulnerability severity classification
- **Dashboard Analytics** - Security metrics and trend analysis

## 🛠️ Installation & Setup

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

### Dependencies

The security suite includes the following key dependencies:

```json
{
  "axios": "^1.6.0",
  "cheerio": "^1.0.0-rc.12",
  "helmet": "^7.0.0",
  "rate-limiter-flexible": "^3.0.0",
  "crypto-random-string": "^5.0.0",
  "jsonwebtoken": "^9.0.2"
}
```

### Installation

```bash
cd server
npm install
```

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/security/dashboard` | Security dashboard overview |
| GET | `/api/security/exploits` | List all available exploits |
| POST | `/api/security/suite` | Run comprehensive security scan |
| GET | `/api/security/results` | Get scan results |
| GET | `/api/security/health` | System health check |

### Individual Exploit Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/security/sql-injection` | SQL injection testing |
| POST | `/api/security/xss` | XSS vulnerability scanning |
| POST | `/api/security/csrf` | CSRF token analysis |
| POST | `/api/security/auth-bypass` | Authentication bypass testing |
| POST | `/api/security/directory-traversal` | Directory traversal detection |
| POST | `/api/security/command-injection` | Command injection testing |
| POST | `/api/security/network-scan` | Network port scanning |
| POST | `/api/security/ssl-analysis` | SSL/TLS security analysis |
| POST | `/api/security/web-vuln-scan` | Web vulnerability scanning |
| POST | `/api/security/buffer-overflow` | Buffer overflow detection |

### Advanced Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/security/scan/:scanId/status` | Get scan status |
| GET | `/api/security/exploit/:exploitName/info` | Get exploit information |
| GET | `/api/security/report/:scanId` | Generate security report |
| GET | `/api/security/stats` | Get vulnerability statistics |

## 🔧 Usage Examples

### Basic SQL Injection Test

```bash
curl -X POST http://localhost:3003/api/security/sql-injection \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://testphp.vulnweb.com/artists.php?artist=1",
    "options": {
      "delay": 100,
      "timeout": 30000
    }
  }'
```

### Comprehensive Security Scan

```bash
curl -X POST http://localhost:3003/api/security/suite \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://demo.testfire.net",
    "selectedExploits": ["sqlInjection", "xss", "csrf"],
    "options": {
      "delay": 200,
      "timeout": 60000
    }
  }'
```

### XSS Vulnerability Scan

```bash
curl -X POST http://localhost:3003/api/security/xss \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://xss-game.appspot.com/level1/frame?query=test",
    "options": {
      "testStored": true,
      "delay": 150
    }
  }'
```

### Network Reconnaissance

```bash
curl -X POST http://localhost:3003/api/security/network-scan \
  -H "Content-Type: application/json" \
  -d '{
    "target": "127.0.0.1",
    "options": {
      "customPorts": [21, 22, 23, 25, 53, 80, 110, 443, 993, 995],
      "enablePing": true,
      "osDetection": true
    }
  }'
```

## 📊 Response Format

### Successful Response

```json
{
  "success": true,
  "scanId": "scan_1640995200000_abc123",
  "message": "Security scan started",
  "estimatedTime": 120,
  "data": {
    "target": "https://example.com",
    "vulnerabilities": [
      {
        "type": "SQL Injection",
        "subtype": "Boolean-based Blind",
        "severity": "critical",
        "parameter": "id",
        "payload": "' OR '1'='1",
        "evidence": "Response indicates successful injection",
        "impact": "Complete authentication bypass possible",
        "recommendation": "Use parameterized queries",
        "cwe": "CWE-89",
        "owasp": "A03:2021 – Injection"
      }
    ],
    "statistics": {
      "totalTests": 150,
      "successfulInjections": 3,
      "criticalVulnerabilities": 1
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Target domain not allowed for security testing",
  "allowedDomains": ["localhost", "127.0.0.1", "testphp.vulnweb.com"],
  "hint": "Use bypassDomainCheck option if testing is authorized"
}
```

## 🛡️ Security Features

### Domain Restrictions

The security suite includes built-in domain restrictions to prevent unauthorized scanning:

```javascript
const allowedDomains = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "dvwa-test-app",
  "vulnerable-test-app",
  "webgoat",
  "testphp.vulnweb.com",
  "demo.testfire.net"
];
```

### Rate Limiting

- Configurable delays between requests
- Timeout protection for long-running scans
- Request throttling to prevent target overload

### Authentication

- JWT-based authentication for API access
- Role-based access control for advanced features
- Audit logging for all security operations

## 📈 Vulnerability Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **Critical** | Immediate threat, remote code execution | SQL injection with admin access |
| **High** | Significant security risk | XSS in admin panels, auth bypass |
| **Medium** | Moderate security concern | Information disclosure, weak crypto |
| **Low** | Minor security issue | Missing security headers |
| **Info** | Informational finding | Version disclosure, debug info |

## 📋 Exploit Modules Details

### SQL Injection Scanner

**Techniques Supported:**
- Boolean-based blind SQL injection
- Time-based blind SQL injection
- Union-based SQL injection
- Error-based SQL injection
- NoSQL injection

**Payload Categories:**
- MySQL specific payloads
- PostgreSQL specific payloads
- MSSQL specific payloads
- Oracle specific payloads
- MongoDB/NoSQL payloads

### XSS Scanner

**Types Detected:**
- Reflected XSS
- Stored/Persistent XSS
- DOM-based XSS
- Filter bypass XSS

**Context Analysis:**
- HTML context
- Attribute context
- JavaScript context
- CSS context
- URL context

### CSRF Scanner

**Features:**
- CSRF token detection and analysis
- Token predictability testing
- SameSite cookie analysis
- Method override testing
- Token reuse vulnerability detection

### Authentication Bypass Scanner

**Attack Vectors:**
- SQL injection in login forms
- NoSQL injection bypass
- LDAP injection
- Default credentials testing
- Session manipulation
- JWT token manipulation
- Cookie value manipulation

### Directory Traversal Scanner

**Techniques:**
- Basic path traversal
- URL encoded traversal
- Unicode encoded traversal
- Null byte injection
- Filter bypass techniques

### Command Injection Scanner

**Detection Methods:**
- Output-based command injection
- Time-based blind command injection
- Error-based detection
- Filter bypass techniques

### Network Scanner

**Capabilities:**
- TCP port scanning
- Service detection and fingerprinting
- OS fingerprinting
- Host discovery
- SSL/TLS service analysis

### SSL/TLS Analyzer

**Analysis Areas:**
- Protocol version support
- Cipher suite analysis
- Certificate validation
- Known vulnerability detection (POODLE, BEAST, etc.)
- Security headers analysis
- Perfect Forward Secrecy check

### Web Vulnerability Scanner

**Scanned Areas:**
- Information disclosure
- Security misconfigurations
- Error-based information leakage
- HTTP method testing
- CMS-specific vulnerabilities

### Buffer Overflow Scanner

**Detection Types:**
- Stack-based buffer overflows
- Heap-based buffer overflows
- Format string vulnerabilities
- Integer overflow detection
- Unicode/UTF-8 overflow testing

## 📊 Dashboard Features

### Security Overview

- Total exploits available
- Active scans in progress
- Completed scans summary
- Critical vulnerabilities count
- System health status

### Vulnerability Trends

- Vulnerability discovery over time
- Severity distribution charts
- Most common vulnerability types
- Target risk assessment

### Scan Management

- Active scan monitoring
- Scan queue management
- Historical scan results
- Report generation and export

## 🔧 Configuration Options

### Global Options

```json
{
  "delay": 100,
  "timeout": 30000,
  "userAgent": "OverlookSecuritySuite/2.0.0",
  "bypassDomainCheck": false,
  "headers": {
    "X-Security-Test": "true"
  }
}
```

### Exploit-Specific Options

#### SQL Injection
```json
{
  "includeNoSQL": true,
  "blindTesting": true,
  "unionTesting": true,
  "errorTesting": true
}
```

#### XSS
```json
{
  "testStored": true,
  "contextTesting": true,
  "encodingTests": true
}
```

#### Network Scanner
```json
{
  "customPorts": [80, 443, 22, 21],
  "enablePing": true,
  "osDetection": true,
  "serviceTimeout": 5000
}
```

## 📝 Report Generation

### Supported Formats

1. **JSON** - Machine-readable format
2. **HTML** - Human-readable web format
3. **PDF** - Printable report format

### Report Sections

1. **Executive Summary** - High-level findings overview
2. **Technical Details** - Detailed vulnerability information
3. **Risk Assessment** - Business impact analysis
4. **Remediation Guide** - Step-by-step fix instructions
5. **Appendices** - Raw scan data and evidence

## 🔍 Testing & Quality Assurance

### Test Coverage

- Unit tests for each exploit module
- Integration tests for API endpoints
- Performance tests for large-scale scans
- Security tests for the scanner itself

### Validation

- False positive detection and filtering
- Payload validation and sanitization
- Response analysis accuracy
- Severity assessment verification

## 🚦 Best Practices

### Responsible Disclosure

1. Only test applications you own or have explicit permission to test
2. Respect rate limits and avoid overwhelming target systems
3. Follow responsible disclosure practices for found vulnerabilities
4. Document and report findings appropriately

### Performance Optimization

1. Use appropriate delays between requests
2. Implement connection pooling for multiple targets
3. Cache results to avoid redundant testing
4. Monitor resource usage during scans

### Security Considerations

1. Secure storage of scan results
2. Encrypted communication for sensitive data
3. Access control for vulnerability reports
4. Audit logging for compliance

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill existing processes
pkill -f node
# Or use different port
PORT=3004 node main.js
```

**Domain Restrictions**
```bash
# Add bypassDomainCheck option
{
  "target": "https://example.com",
  "options": {
    "bypassDomainCheck": true
  }
}
```

**Timeout Errors**
```bash
# Increase timeout values
{
  "options": {
    "timeout": 60000,
    "delay": 500
  }
}
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=security:* node main.js
```

## 📚 API Documentation

### Request/Response Examples

All API requests require the following headers:
```
Content-Type: application/json
Authorization: Bearer <jwt-token> (if authentication is enabled)
```

### Status Codes

- `200` - Success
- `400` - Bad Request (validation failed)
- `403` - Forbidden (domain not allowed)
- `404` - Not Found (scan/exploit not found)
- `500` - Internal Server Error
- `503` - Service Unavailable

## 🔄 Updates & Maintenance

### Version History

- **v2.0.0** - Complete rewrite with modular architecture
- **v1.5.0** - Added network scanning capabilities
- **v1.4.0** - Enhanced XSS detection
- **v1.3.0** - Added SSL/TLS analysis
- **v1.2.0** - Improved SQL injection detection
- **v1.1.0** - Added dashboard and reporting
- **v1.0.0** - Initial release

### Roadmap

- [ ] AI-powered vulnerability analysis
- [ ] Automated exploit generation
- [ ] Integration with CI/CD pipelines
- [ ] Mobile application security testing
- [ ] Cloud infrastructure scanning
- [ ] Compliance reporting (PCI, HIPAA, etc.)

## 🤝 Contributing

We welcome contributions to the Overlook Security Suite! Please see our contributing guidelines for details on submitting pull requests, reporting bugs, and suggesting improvements.

### Development Setup

```bash
git clone https://github.com/Shaurya2k06/Overlook.git
cd Overlook/server
npm install
npm run dev
```

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## ⚠️ Disclaimer

This security suite is intended for authorized security testing only. Users are responsible for ensuring they have proper authorization before testing any systems. The developers are not responsible for any misuse of this tool.

## 📞 Support

For support, bug reports, or feature requests:
- GitHub Issues: https://github.com/Shaurya2k06/Overlook/issues
- Documentation: https://overlook-docs.com
- Community: https://discord.gg/overlook-security

---

**Overlook Security Suite - Comprehensive Security Testing for Modern Applications**
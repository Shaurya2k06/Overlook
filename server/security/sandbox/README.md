# Overlook Security Testing Sandbox

This directory contains the security testing sandbox environment for the Overlook collaborative coding platform.

## Quick Start

1. **Start the environment:**
   ```bash
   ./start-security-testing.sh
   ```

2. **Check status:**
   ```bash
   ./status-security-testing.sh
   ```

3. **Stop the environment:**
   ```bash
   ./stop-security-testing.sh
   ```

## Services

- **Security Sandbox**: http://localhost:3002
- **WebGoat (Vulnerable App)**: http://localhost:8080
- **DVWA**: http://localhost:8081
- **OWASP ZAP**: http://localhost:8090
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6380
- **File Server**: http://localhost:8082

## API Endpoints

### Run Individual Exploit Test
```bash
curl -X POST http://localhost:3001/api/security/exploits/sql_injection \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "http://localhost:8081"}'
```

### Get Available Exploit Types
```bash
curl http://localhost:3001/api/security/exploits/types
```

### Get Test Results
```bash
curl http://localhost:3001/api/security/exploits/results
```

### Run Comprehensive Scan
```bash
curl -X POST http://localhost:3001/api/security/scan/comprehensive \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "http://localhost:8081"}'
```

## Available Exploit Types

1. **sql_injection** - SQL Injection testing
2. **xss** - Cross-Site Scripting testing
3. **csrf** - Cross-Site Request Forgery testing
4. **auth_bypass** - Authentication bypass testing
5. **directory_traversal** - Path traversal testing
6. **open_redirect** - Open redirect testing
7. **ssrf** - Server-Side Request Forgery testing
8. **command_injection** - OS command injection testing
9. **file_upload** - File upload vulnerability testing
10. **cors_misconfiguration** - CORS misconfiguration testing

## Configuration

Edit the `.env` file to configure:
- API keys for external services
- Allowed test domains
- Rate limiting settings
- Database connections
- Notification webhooks

## Security Considerations

- This environment is designed for testing only
- Only test against allowed domains
- Do not run tests against production systems
- All tests are logged and monitored
- Rate limiting is enforced to prevent abuse

## Troubleshooting

1. **Services not starting:**
   - Check Docker is running: `docker info`
   - Check port availability: `netstat -tulpn | grep :3002`

2. **Database connection issues:**
   - Verify PostgreSQL is running: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`

3. **Test failures:**
   - Check sandbox logs: `docker-compose logs security-sandbox`
   - Verify target URL is accessible
   - Ensure target domain is in allowed list

## Logs

- Application logs: `./logs/`
- Test results: `./test-results/`
- Docker logs: `docker-compose logs [service-name]`

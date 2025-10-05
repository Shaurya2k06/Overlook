#!/bin/bash

# Overlook Security Testing Environment Setup Script
# This script sets up the complete security testing sandbox environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_DIR="$SCRIPT_DIR/sandbox"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$SERVER_DIR")"

echo -e "${BLUE}=== Overlook Security Testing Environment Setup ===${NC}"
echo -e "${BLUE}Project Root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}Sandbox Directory: $SANDBOX_DIR${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    print_status "Docker is installed and running ✓"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking Docker Compose installation..."

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi

    print_status "Docker Compose is installed ✓"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_VERSION="18.0.0"

    if ! node -e "process.exit(process.version.slice(1).split('.').map(Number).reduce((a,b,i)=>a+b*Math.pow(1000,2-i)) >= '$REQUIRED_VERSION'.split('.').map(Number).reduce((a,b,i)=>a+b*Math.pow(1000,2-i)) ? 0 : 1)"; then
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher."
        exit 1
    fi

    print_status "Node.js $NODE_VERSION is installed ✓"
}

# Create necessary directories
create_directories() {
    print_status "Creating directory structure..."

    mkdir -p "$SANDBOX_DIR/test-results"
    mkdir -p "$SANDBOX_DIR/logs"
    mkdir -p "$SANDBOX_DIR/code-to-scan"
    mkdir -p "$SANDBOX_DIR/semgrep-results"
    mkdir -p "$SANDBOX_DIR/sqlmap-results"
    mkdir -p "$SANDBOX_DIR/nikto-results"
    mkdir -p "$SANDBOX_DIR/reports"
    mkdir -p "$SANDBOX_DIR/test-files"

    print_status "Directory structure created ✓"
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."

    ENV_FILE="$SANDBOX_DIR/.env"

    cat > "$ENV_FILE" << EOF
# Overlook Security Testing Environment Configuration

# Node.js Environment
NODE_ENV=sandbox

# Server Ports
SANDBOX_PORT=3002
MAIN_APP_URL=http://localhost:3001

# Database Configuration
POSTGRES_URL=postgresql://sandbox_user:sandbox_pass@localhost:5433/sandbox_db
POSTGRES_DB=sandbox_db
POSTGRES_USER=sandbox_user
POSTGRES_PASSWORD=sandbox_pass

# Redis Configuration
REDIS_URL=redis://localhost:6380

# Security Configuration
RATE_LIMIT_REQUESTS=20
RATE_LIMIT_WINDOW=60000
LOG_LEVEL=debug

# External Services
GITHUB_TOKEN=
OPENAI_API_KEY=

# Test Environment URLs
WEBGOAT_URL=http://localhost:8080
DVWA_URL=http://localhost:8081
ZAP_URL=http://localhost:8090

# Allowed Test Domains (comma-separated)
ALLOWED_DOMAINS=localhost,127.0.0.1,webgoat,dvwa-test-app,vulnerable-test-app

# Notification Settings
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=

# Report Settings
REPORT_RETENTION_DAYS=30
MAX_CONCURRENT_TESTS=5
EOF

    print_status "Environment file created: $ENV_FILE"
    print_warning "Please edit $ENV_FILE to configure your API keys and settings"
}

# Create database initialization script
create_db_init() {
    print_status "Creating database initialization script..."

    DB_INIT_FILE="$SANDBOX_DIR/init-db.sql"

    cat > "$DB_INIT_FILE" << 'EOF'
-- Overlook Security Testing Database Schema

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id VARCHAR(255) UNIQUE NOT NULL,
    exploit_type VARCHAR(100) NOT NULL,
    target_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    vulnerable BOOLEAN DEFAULT FALSE,
    risk_level VARCHAR(20),
    findings JSONB,
    duration INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    test_types TEXT[],
    status VARCHAR(50) NOT NULL,
    summary JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vulnerability findings table
CREATE TABLE IF NOT EXISTS vulnerability_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
    finding_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    payload TEXT,
    evidence TEXT,
    location TEXT,
    risk_score INTEGER DEFAULT 0,
    false_positive BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_url TEXT NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    user_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_exploit_type ON test_results(exploit_type);
CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_test_results_vulnerable ON test_results(vulnerable);
CREATE INDEX IF NOT EXISTS idx_vulnerability_findings_severity ON vulnerability_findings(severity);
CREATE INDEX IF NOT EXISTS idx_security_metrics_target_url ON security_metrics(target_url);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON test_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO security_metrics (target_url, metric_type, metric_value) VALUES
('http://localhost:3001', 'security_score', 75.5),
('http://localhost:3001', 'vulnerabilities_found', 3),
('http://localhost:3001', 'last_scan_duration', 120);

-- Create views for common queries
CREATE OR REPLACE VIEW vulnerability_summary AS
SELECT
    target_url,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN vulnerable = true THEN 1 END) as vulnerable_tests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tests,
    AVG(duration) as avg_duration,
    MAX(timestamp) as last_test
FROM test_results
GROUP BY target_url;

CREATE OR REPLACE VIEW severity_breakdown AS
SELECT
    tr.target_url,
    vf.severity,
    COUNT(*) as finding_count
FROM test_results tr
JOIN vulnerability_findings vf ON tr.id = vf.test_result_id
WHERE tr.vulnerable = true
GROUP BY tr.target_url, vf.severity;
EOF

    print_status "Database initialization script created ✓"
}

# Create nginx configuration
create_nginx_config() {
    print_status "Creating nginx configuration for file server..."

    NGINX_CONFIG="$SANDBOX_DIR/nginx.conf"

    cat > "$NGINX_CONFIG" << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html index.htm;

        # Enable directory listing
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            try_files $uri $uri/ =404;
        }

        # Test files location
        location /test-files/ {
            alias /usr/share/nginx/html/;
            autoindex on;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

    print_status "Nginx configuration created ✓"
}

# Create test files
create_test_files() {
    print_status "Creating test files for upload testing..."

    TEST_FILES_DIR="$SANDBOX_DIR/test-files"

    # Create PHP test file
    cat > "$TEST_FILES_DIR/test.php" << 'EOF'
<?php
echo "PHP execution test - this file should not be executed!";
phpinfo();
?>
EOF

    # Create JavaScript test file
    cat > "$TEST_FILES_DIR/test.js" << 'EOF'
// JavaScript test file
console.log("JavaScript execution test");
alert("XSS test");
EOF

    # Create HTML test file with XSS
    cat > "$TEST_FILES_DIR/test.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>XSS Test</title>
</head>
<body>
    <h1>XSS Test File</h1>
    <script>alert('XSS test executed');</script>
    <img src="x" onerror="alert('Image XSS')">
</body>
</html>
EOF

    # Create SQL injection test file
    cat > "$TEST_FILES_DIR/sql-test.txt" << 'EOF'
' OR '1'='1
' UNION SELECT NULL--
'; DROP TABLE users--
' OR SLEEP(5)--
EOF

    # Create a large file for testing file size limits
    dd if=/dev/zero of="$TEST_FILES_DIR/large-file.bin" bs=1M count=50 2>/dev/null

    print_status "Test files created ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."

    cd "$SANDBOX_DIR"

    if [ ! -f "package.json" ]; then
        print_error "package.json not found in sandbox directory"
        exit 1
    fi

    npm install

    print_status "Dependencies installed ✓"
}

# Build Docker images
build_docker_images() {
    print_status "Building Docker images..."

    cd "$SANDBOX_DIR"

    # Build main sandbox image
    docker build -t overlook-security-sandbox .

    print_status "Docker images built ✓"
}

# Start services
start_services() {
    print_status "Starting security testing services..."

    cd "$SANDBOX_DIR"

    # Start services with Docker Compose
    docker-compose up -d

    print_status "Waiting for services to be ready..."

    # Wait for services to start
    sleep 30

    # Check service health
    check_service_health

    print_status "Services started ✓"
}

# Check service health
check_service_health() {
    print_status "Checking service health..."

    services=(
        "http://localhost:3002/health:Security Sandbox"
        "http://localhost:8080:WebGoat"
        "http://localhost:8081:DVWA"
        "http://localhost:5433:PostgreSQL"
        "http://localhost:6380:Redis"
    )

    for service in "${services[@]}"; do
        IFS=':' read -r url name <<< "$service"

        if [[ "$url" == *"5433"* ]] || [[ "$url" == *"6380"* ]]; then
            # For database services, just check if port is open
            if nc -z localhost ${url##*:} 2>/dev/null; then
                print_status "$name is running ✓"
            else
                print_warning "$name may not be ready"
            fi
        else
            # For HTTP services, check HTTP response
            if curl -s -f "$url" > /dev/null 2>&1; then
                print_status "$name is running ✓"
            else
                print_warning "$name may not be ready (this is normal during initial startup)"
            fi
        fi
    done
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."

    # Create start script
    cat > "$SANDBOX_DIR/start-security-testing.sh" << 'EOF'
#!/bin/bash
echo "Starting Overlook Security Testing Environment..."
cd "$(dirname "$0")"
docker-compose up -d
echo "Services starting... Please wait 30 seconds for full initialization."
EOF

    # Create stop script
    cat > "$SANDBOX_DIR/stop-security-testing.sh" << 'EOF'
#!/bin/bash
echo "Stopping Overlook Security Testing Environment..."
cd "$(dirname "$0")"
docker-compose down
echo "Services stopped."
EOF

    # Create status script
    cat > "$SANDBOX_DIR/status-security-testing.sh" << 'EOF'
#!/bin/bash
echo "Overlook Security Testing Environment Status:"
cd "$(dirname "$0")"
docker-compose ps
EOF

    # Make scripts executable
    chmod +x "$SANDBOX_DIR/start-security-testing.sh"
    chmod +x "$SANDBOX_DIR/stop-security-testing.sh"
    chmod +x "$SANDBOX_DIR/status-security-testing.sh"

    print_status "Startup scripts created ✓"
}

# Add security routes to main server
add_security_routes() {
    print_status "Adding security routes to main server..."

    MAIN_JS="$SERVER_DIR/main.js"

    if [ -f "$MAIN_JS" ]; then
        # Check if security routes are already added
        if ! grep -q "securityRoutes" "$MAIN_JS"; then
            # Add security routes import and usage
            cat >> "$MAIN_JS" << 'EOF'

// Security testing routes
const securityRoutes = require('./routes/securityRoutes');
app.use('/api/security', securityRoutes);
EOF
            print_status "Security routes added to main server ✓"
        else
            print_status "Security routes already exist in main server ✓"
        fi
    else
        print_warning "Main server file not found. Please manually add security routes."
    fi
}

# Install express-validator if not present
install_server_dependencies() {
    print_status "Installing additional server dependencies..."

    cd "$SERVER_DIR"

    # Check if express-validator is installed
    if ! npm list express-validator &>/dev/null; then
        npm install express-validator
        print_status "express-validator installed ✓"
    fi
}

# Create documentation
create_documentation() {
    print_status "Creating documentation..."

    cat > "$SANDBOX_DIR/README.md" << 'EOF'
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
EOF

    print_status "Documentation created ✓"
}

# Main execution flow
main() {
    echo -e "${BLUE}Starting Overlook Security Testing Environment Setup...${NC}"
    echo ""

    # Prerequisites
    check_docker
    check_docker_compose
    check_nodejs

    # Setup
    create_directories
    create_env_file
    create_db_init
    create_nginx_config
    create_test_files
    create_startup_scripts
    create_documentation

    # Dependencies and services
    install_dependencies
    install_server_dependencies
    add_security_routes

    # Docker setup
    build_docker_images
    start_services

    echo ""
    echo -e "${GREEN}=== Setup Complete! ===${NC}"
    echo ""
    echo -e "${BLUE}Security Testing Environment is ready!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Edit $SANDBOX_DIR/.env to configure your settings"
    echo "2. Access the security testing interface at http://localhost:3001/security-testing"
    echo "3. Run individual exploits via API: curl -X POST http://localhost:3001/api/security/exploits/sql_injection -H 'Content-Type: application/json' -d '{\"targetUrl\": \"http://localhost:8081\"}'"
    echo "4. View vulnerable test applications:"
    echo "   - WebGoat: http://localhost:8080"
    echo "   - DVWA: http://localhost:8081"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo "- Start services: cd $SANDBOX_DIR && ./start-security-testing.sh"
    echo "- Stop services: cd $SANDBOX_DIR && ./stop-security-testing.sh"
    echo "- Check status: cd $SANDBOX_DIR && ./status-security-testing.sh"
    echo ""
    echo -e "${GREEN}Happy security testing! 🔒${NC}"
}

# Run main function
main "$@"

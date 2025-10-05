#!/bin/bash

# Overlook Security Suite - curl Testing Script
# This script tests all the security endpoints using curl commands

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3003"
API_URL="$BASE_URL/api/security"

echo -e "${BLUE}=== Overlook Security Suite curl Tests ===${NC}"
echo

# Function to test endpoint with GET request
test_get() {
    local endpoint=$1
    local description=$2
    echo -e "${YELLOW}Testing: $description${NC}"
    echo -e "${CYAN}GET $endpoint${NC}"

    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$endpoint")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (200)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "$body"
    fi
    echo
}

# Function to test endpoint with POST request
test_post() {
    local endpoint=$1
    local description=$2
    local payload=$3
    echo -e "${YELLOW}Testing: $description${NC}"
    echo -e "${CYAN}POST $endpoint${NC}"
    echo -e "${CYAN}Payload: $payload${NC}"

    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$endpoint")

    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (200)${NC}"
    elif [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}🚫 BLOCKED (403) - Domain validation working${NC}"
    elif [ "$http_code" -eq 400 ]; then
        echo -e "${YELLOW}⚠️  VALIDATION ERROR (400)${NC}"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
    fi

    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo
}

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${RED}❌ Server not running on port 3003${NC}"
    echo -e "${YELLOW}Please start the server with: cd Overlook/server && npm start${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo

# Test basic endpoints
echo -e "${BLUE}=== Basic Endpoint Tests ===${NC}"
test_get "$BASE_URL/" "Server root endpoint"
test_get "$API_URL/health" "Security health check"
test_get "$API_URL/exploits" "Available exploits list"
test_get "$API_URL/stats" "Security statistics"
test_get "$API_URL/results" "Scan results"

# Test individual exploits with safe targets
echo -e "${BLUE}=== Individual Exploit Tests ===${NC}"

# SQL Injection test
test_post "$API_URL/sql-injection" "SQL Injection on test site" '{
  "target": "http://testphp.vulnweb.com",
  "options": {
    "timeout": 5000,
    "maxDepth": 2
  }
}'

# XSS test
test_post "$API_URL/xss" "XSS on test site" '{
  "target": "http://testphp.vulnweb.com",
  "options": {
    "payloads": ["<script>alert(\"test\")</script>", "<img src=x onerror=alert(1)>"],
    "timeout": 5000
  }
}'

# CSRF test
test_post "$API_URL/csrf" "CSRF on test site" '{
  "target": "http://testphp.vulnweb.com",
  "options": {
    "timeout": 5000
  }
}'

# Network scan test (localhost)
test_post "$API_URL/network-scan" "Network scan on localhost" '{
  "target": "http://127.0.0.1",
  "options": {
    "ports": [22, 80, 443, 3000, 3003, 8080],
    "timeout": 3000
  }
}'

# SSL Analysis test
test_post "$API_URL/ssl-analysis" "SSL analysis on test site" '{
  "target": "https://testphp.vulnweb.com",
  "options": {
    "timeout": 10000
  }
}'

# Authentication bypass test
test_post "$API_URL/auth-bypass" "Authentication bypass test" '{
  "target": "http://testphp.vulnweb.com",
  "options": {
    "timeout": 5000
  }
}'

# Directory traversal test
test_post "$API_URL/directory-traversal" "Directory traversal test" '{
  "target": "http://testphp.vulnweb.com",
  "options": {
    "timeout": 5000,
    "payloads": ["../../../etc/passwd", "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts"]
  }
}'

# Command injection test
test_post "$API_URL/command-injection" "Command injection test" '{
  "target": "http://testphp.vulnweb.com",
  "options": {
    "timeout": 5000,
    "payloads": ["; ls -la", "| whoami", "&& id"]
  }
}'

# Web vulnerability scanner test
test_post "$API_URL/web-vuln-scan" "Web vulnerability scanner" '{
  "target": "http://testphp.vulnweb.com",
  "options": {
    "timeout": 8000,
    "depth": 2
  }
}'

# Buffer overflow test
test_post "$API_URL/buffer-overflow" "Buffer overflow test" '{
  "target": "http://localhost:3000",
  "options": {
    "timeout": 5000,
    "payloadSize": 1024
  }
}'

# Test comprehensive security suite
echo -e "${BLUE}=== Security Suite Test ===${NC}"
test_post "$API_URL/suite" "Comprehensive security suite" '{
  "target": "http://testphp.vulnweb.com",
  "selectedExploits": ["sqlInjection", "xss", "csrf"],
  "options": {
    "timeout": 15000,
    "maxDepth": 2,
    "aggressive": false
  }
}'

# Test validation and security controls
echo -e "${BLUE}=== Security Validation Tests ===${NC}"

# Test invalid URL
test_post "$API_URL/sql-injection" "Invalid URL validation" '{
  "target": "invalid-url",
  "options": {}
}'

# Test unauthorized domain
test_post "$API_URL/sql-injection" "Unauthorized domain blocking" '{
  "target": "https://google.com",
  "options": {}
}'

# Test missing required fields
test_post "$API_URL/xss" "Missing target field" '{
  "options": {
    "timeout": 5000
  }
}'

# Test specific exploit info endpoints
echo -e "${BLUE}=== Exploit Information Tests ===${NC}"
test_get "$API_URL/exploit/sqlInjection/info" "SQL Injection exploit info"
test_get "$API_URL/exploit/xss/info" "XSS exploit info"
test_get "$API_URL/exploit/csrf/info" "CSRF exploit info"

# Summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}✅ SUCCESS${NC} - Request completed successfully"
echo -e "${YELLOW}🚫 BLOCKED${NC} - Domain validation working (expected)"
echo -e "${YELLOW}⚠️  VALIDATION ERROR${NC} - Input validation working (expected)"
echo -e "${RED}❌ FAILED${NC} - Unexpected error"
echo
echo -e "${CYAN}Your Overlook Security Suite is ready for use!${NC}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start your frontend application"
echo "2. Connect to these API endpoints from your React app"
echo "3. Build your security dashboard UI"
echo "4. Set up automated scanning schedules"
echo
echo -e "${CYAN}API Base URL: $API_URL${NC}"
echo -e "${CYAN}Documentation: See TESTING_GUIDE.md${NC}"

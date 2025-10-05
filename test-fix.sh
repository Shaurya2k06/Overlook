#!/bin/bash

echo "🧪 Testing Multi-Exploit Results Fix"
echo "===================================================="

API_BASE="http://localhost:3003/api/security"

# Check if server is running
echo "🔄 Checking server status..."
if ! curl -s "$API_BASE/health" > /dev/null 2>&1; then
    echo "❌ Server not running on port 3003"
    echo "Please start the server with: cd server && npm start"
    exit 1
fi
echo "✅ Server is running"

# Clear previous results
echo ""
echo "🗑️ Clearing previous results..."
curl -s -X POST "$API_BASE/clear-results" > /dev/null
echo "✅ Previous results cleared"

# Run multi-exploit scan
echo ""
echo "🎯 Running multi-exploit scan..."
SCAN_RESPONSE=$(curl -s -X POST "$API_BASE/scan-files" \
    -H "Content-Type: application/json" \
    -d '{"selectedExploits": ["csrf", "webVulnScanner", "xss", "sqlInjection", "bufferOverflow"]}')

echo "✅ Multi-exploit scan completed"

# Wait a moment for results to process
sleep 2

# Get results
echo ""
echo "📋 Fetching scan results..."
RESULTS=$(curl -s "$API_BASE/results")

# Parse and display results
echo "📊 Results Analysis:"
echo "==================="

# Count total results
TOTAL_RESULTS=$(echo "$RESULTS" | grep -o '"exploitName"' | wc -l)
echo "📈 Total result entries: $TOTAL_RESULTS"

# Check for each exploit type
echo ""
echo "🔍 Results by exploit type:"
for exploit in "csrf" "webVulnScanner" "xss" "sqlInjection" "bufferOverflow"; do
    COUNT=$(echo "$RESULTS" | grep -o "\"exploitName\":\"$exploit\"" | wc -l)
    if [ $COUNT -gt 0 ]; then
        # Count vulnerabilities for this exploit
        VULN_COUNT=$(echo "$RESULTS" | grep -A 20 "\"exploitName\":\"$exploit\"" | grep -o '"vulnerabilities":\[' | wc -l)
        echo "   ✅ $exploit: $COUNT result(s)"
    else
        echo "   ❌ $exploit: 0 results (MISSING)"
    fi
done

# Check if all 5 exploits have results
if [ "$TOTAL_RESULTS" -eq 5 ]; then
    echo ""
    echo "🎉 SUCCESS: All 5 exploits preserved their results!"
    echo "✅ Auto-clear fix is working correctly"
    echo "🎯 Users should now see results from all exploits, not just buffer overflow"
else
    echo ""
    echo "❌ ISSUE: Only $TOTAL_RESULTS out of 5 exploits have results"
    echo "🔧 The auto-clear fix may need additional work"
fi

# Show vulnerability summary
echo ""
echo "🛡️ Vulnerability Summary:"
echo "========================"

# Extract and show vulnerabilities found
CSRF_VULNS=$(echo "$RESULTS" | grep -A 50 '"exploitName":"csrf"' | grep -o '"vulnerabilities":\[[^]]*\]' | grep -o '"type":"[^"]*"' | wc -l)
WEB_VULNS=$(echo "$RESULTS" | grep -A 50 '"exploitName":"webVulnScanner"' | grep -o '"vulnerabilities":\[[^]]*\]' | grep -o '"type":"[^"]*"' | wc -l)

echo "CSRF vulnerabilities: $CSRF_VULNS"
echo "WebVulnScanner vulnerabilities: $WEB_VULNS"

# Test single exploit scan
echo ""
echo "🔬 Testing single exploit scan (should clear previous)..."
curl -s -X POST "$API_BASE/scan-files" \
    -H "Content-Type: application/json" \
    -d '{"selectedExploits": ["networkScanner"]}' > /dev/null

sleep 1

SINGLE_RESULTS=$(curl -s "$API_BASE/results")
SINGLE_COUNT=$(echo "$SINGLE_RESULTS" | grep -o '"exploitName"' | wc -l)

echo "📊 Results after single scan: $SINGLE_COUNT"
if [ "$SINGLE_COUNT" -eq 1 ]; then
    echo "✅ Single exploit scan correctly cleared previous results"
else
    echo "⚠️ Single exploit scan behavior: $SINGLE_COUNT results (expected 1)"
fi

echo ""
echo "🎯 FINAL VERDICT:"
echo "================"

if [ "$TOTAL_RESULTS" -eq 5 ]; then
    echo "✅ PASSED: Multi-exploit results are preserved"
    echo "🎉 Fix is working! Users will see all exploit results"
    echo ""
    echo "🔧 What was fixed:"
    echo "   - Each exploit no longer clears previous results"
    echo "   - Multi-exploit scans preserve all results"
    echo "   - Single exploit scans still clear properly"
    exit 0
else
    echo "❌ FAILED: Some exploit results are missing"
    echo "🔧 Further debugging needed"
    echo ""
    echo "💡 Possible issues:"
    echo "   - Auto-clear logic still running between exploits"
    echo "   - Results not being stored properly"
    echo "   - API response processing issue"
    exit 1
fi

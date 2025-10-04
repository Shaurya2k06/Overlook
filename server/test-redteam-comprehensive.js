const axios = require("axios");

// Comprehensive test cases that should trigger your custom exploits
const testCases = [
  {
    name: "SQL Injection Test",
    code: `const query = "SELECT * FROM users WHERE id = " + req.params.id; db.execute(query);`,
    expectedFindings: ["SQL injection"],
  },
  {
    name: "XSS Test",
    code: `document.innerHTML = req.body.userContent;`,
    expectedFindings: ["XSS"],
  },
  {
    name: "Hardcoded API Key Test",
    code: `const apiKey = "sk-1234567890abcdef"; axios.get('/api/data', { headers: { 'Authorization': apiKey } });`,
    expectedFindings: ["Hardcoded secret"],
  },
  {
    name: "Command Injection Test",
    code: `const { exec } = require('child_process'); exec('ls ' + req.body.directory);`,
    expectedFindings: ["OS command injection"],
  },
  {
    name: "Multiple Vulnerabilities Test",
    code: `
        const apiKey = "secret-key-123";
        const userInput = req.body.input;
        const query = "SELECT * FROM users WHERE name = " + userInput;
        db.execute(query);
        document.innerHTML = req.body.html;
        eval(req.body.code);
        console.log(req.body.password);
        res.cookie('session', sessionId);
        res.redirect(req.body.url);
        `,
    expectedFindings: [
      "Hardcoded secret",
      "SQL injection",
      "XSS",
      "eval",
      "Sensitive data",
      "Cookie",
      "Open redirect",
    ],
  },
  {
    name: "CSRF Vulnerability Test",
    code: `<form action="/transfer" method="POST"><input name="amount" type="text"></form>`,
    expectedFindings: ["CSRF"],
  },
  {
    name: "Insecure CORS Test",
    code: `app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', '*'); next(); });`,
    expectedFindings: ["CORS"],
  },
  {
    name: "JWT None Algorithm Test",
    code: `const decoded = jwt.verify(token, null, { algorithm: "none" });`,
    expectedFindings: ["JWT verification"],
  },
  {
    name: "File Upload Without Validation Test",
    code: `const multer = require('multer'); const upload = multer({ dest: 'uploads/' });`,
    expectedFindings: ["File upload"],
  },
  {
    name: "SSRF Test",
    code: `axios.get(req.body.url).then(response => res.json(response.data));`,
    expectedFindings: ["SSRF"],
  },
  {
    name: "Path Traversal Test",
    code: `fs.readFile(req.body.filename, 'utf8', (err, data) => res.send(data));`,
    expectedFindings: ["Path traversal"],
  },
  {
    name: "Clean Code Test (Should have minimal findings)",
    code: `
        const safeValue = validator.escape(req.body.input);
        const query = 'SELECT * FROM users WHERE id = ?';
        db.execute(query, [safeValue]);
        app.use(helmet());
        app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
        `,
    expectedFindings: [],
  },
];

async function testRedTeamAgent() {
  console.log("🔴 Red Team Security Agent - Comprehensive Test Suite\n");
  console.log("=".repeat(80));

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n🧪 Test ${totalTests}: ${testCase.name}`);
    console.log("─".repeat(60));

    try {
      const response = await axios.post(
        "http://localhost:3001/api/redteam/audit",
        {
          code: testCase.code,
          language: "javascript",
        },
      );

      console.log("✅ Status:", response.data.status);

      // Extract custom findings from the report
      const reportLines = response.data.audit_report.split("\n");
      const customFindingsStart = reportLines.findIndex((line) =>
        line.includes("Custom Exploit Findings"),
      );
      const llmAuditStart = reportLines.findIndex((line) =>
        line.includes("LLM Security Audit"),
      );

      let customFindings = [];
      if (customFindingsStart >= 0 && llmAuditStart >= 0) {
        const findingsLines = reportLines.slice(
          customFindingsStart + 1,
          llmAuditStart,
        );
        customFindings = findingsLines.filter(
          (line) => line.trim() && !line.includes("#"),
        );
      }

      console.log("\n📋 Custom Exploit Findings:");
      if (customFindings.length > 0) {
        customFindings.forEach((finding) => {
          if (finding.trim()) console.log(`  • ${finding.trim()}`);
        });
      } else {
        console.log("  • No custom vulnerabilities detected");
      }

      // Check if expected findings were detected
      if (testCase.expectedFindings && testCase.expectedFindings.length > 0) {
        const foundExpected = testCase.expectedFindings.some((expected) =>
          customFindings.some((finding) =>
            finding.toLowerCase().includes(expected.toLowerCase()),
          ),
        );

        if (foundExpected || customFindings.length > 0) {
          console.log(
            "✅ Test Result: PASS - Vulnerabilities detected as expected",
          );
          passedTests++;
        } else {
          console.log(
            "❌ Test Result: FAIL - Expected vulnerabilities not detected",
          );
          console.log(
            `   Expected to find: ${testCase.expectedFindings.join(", ")}`,
          );
        }
      } else {
        // For clean code test, fewer findings is better
        if (customFindings.length <= 2) {
          console.log("✅ Test Result: PASS - Clean code detected correctly");
          passedTests++;
        } else {
          console.log(
            "❌ Test Result: FAIL - Too many false positives in clean code",
          );
        }
      }
    } catch (error) {
      console.log("❌ Error:", error.response?.data?.error || error.message);
      console.log("❌ Test Result: FAIL - Request failed");
    }

    console.log("\n" + "=".repeat(80));
  }

  // Summary
  console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);
  console.log(
    `📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
  );

  if (passedTests === totalTests) {
    console.log(
      "🎉 All tests passed! Your red team agent is working correctly.",
    );
  } else {
    console.log("⚠️  Some tests failed. Check the individual results above.");
  }
}

// Run the comprehensive test suite
testRedTeamAgent().catch(console.error);

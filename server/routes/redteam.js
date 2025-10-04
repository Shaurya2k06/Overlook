const express = require("express");
const router = express.Router();
const {
  redTeamAudit,
  redTeamAuditMultiple,
} = require("../controllers/RedTeamController");

/**
 * @route POST /api/redteam/audit
 * @desc Audit a single code snippet for security vulnerabilities
 * @access Public
 * @body { code: string, language?: string }
 */
router.post("/audit", redTeamAudit);

/**
 * @route POST /api/redteam/audit-multiple
 * @desc Audit multiple files for security vulnerabilities
 * @access Public
 * @body { files: { [filename]: code } }
 */
router.post("/audit-multiple", redTeamAuditMultiple);

/**
 * @route GET /api/redteam/health
 * @desc Health check for Red Team service
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Red Team Security Audit",
    timestamp: new Date().toISOString(),
    features: {
      semgrep: "enabled",
      custom_exploits: "enabled",
      llm_audit: process.env.GITHUB_MODELS_TOKEN ? "enabled" : "disabled",
    },
  });
});

/**
 * @route GET /api/redteam/vulnerabilities
 * @desc Get list of vulnerability types checked
 * @access Public
 */
router.get("/vulnerabilities", (req, res) => {
  res.json({
    categories: [
      {
        name: "Injection Attacks",
        types: ["SQL Injection", "NoSQL Injection", "Command Injection", "Code Injection"],
      },
      {
        name: "Cross-Site Attacks",
        types: ["XSS", "CSRF", "Open Redirects"],
      },
      {
        name: "Authentication & Authorization",
        types: ["JWT Vulnerabilities", "Direct Object References", "Missing Authorization"],
      },
      {
        name: "Data Security",
        types: ["Hardcoded Secrets", "Sensitive Data Exposure", "Insecure Deserialization"],
      },
      {
        name: "Network Security",
        types: ["SSRF", "Insecure CORS", "Missing Security Headers"],
      },
      {
        name: "File Security",
        types: ["Path Traversal", "File Upload Vulnerabilities", "XXE"],
      },
      {
        name: "Cryptography",
        types: ["Weak Hashing", "Insecure Randomness", "Crypto Implementation"],
      },
      {
        name: "Configuration",
        types: ["Insecure Cookies", "Missing Rate Limiting", "Overly Permissive Settings"],
      },
    ],
    total_checks: 30,
    static_analysis: "Semgrep integration",
    ai_analysis: "GPT-4o powered security review",
  });
});

/**
 * @route POST /api/redteam/batch-audit
 * @desc Batch audit for CI/CD integration
 * @access Public
 * @body { project_files: { [path]: code }, options?: { severity_threshold: string } }
 */
router.post("/batch-audit", async (req, res) => {
  try {
    const { project_files, options = {} } = req.body;

    if (!project_files || typeof project_files !== "object") {
      return res.status(400).json({
        error: "project_files object is required",
        example: { "src/app.js": "const app = require('express')();" }
      });
    }

    const { redTeamAuditMultiple } = require("../controllers/RedTeamController");

    // Create mock req/res for controller reuse
    const mockReq = { body: { files: project_files } };
    let auditResult;

    const mockRes = {
      json: (data) => { auditResult = data; },
      status: () => mockRes,
    };

    await redTeamAuditMultiple(mockReq, mockRes);

    // Filter results by severity threshold if specified
    const threshold = options.severity_threshold || "low";
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = severityLevels[threshold] || 0;

    if (auditResult && auditResult.results) {
      Object.keys(auditResult.results).forEach(filename => {
        const result = auditResult.results[filename];
        if (result.findings) {
          result.findings = result.findings.filter(finding =>
            severityLevels[finding.severity] >= minLevel
          );
        }
      });
    }

    res.json({
      ...auditResult,
      batch_audit: true,
      threshold_applied: threshold,
      scan_timestamp: new Date().toISOString(),
    });

  } catch (error) {
    res.status(500).json({
      error: "Batch audit failed",
      details: error.message
    });
  }
});

/**
 * @route GET /api/redteam/metrics
 * @desc Get security metrics and statistics
 * @access Public
 */
router.get("/metrics", (req, res) => {
  res.json({
    scanner_info: {
      version: "1.0.0",
      last_updated: "2024-01-01",
      vulnerability_database: "Custom + Semgrep + AI",
    },
    supported_languages: [
      "JavaScript/TypeScript",
      "Python",
      "Java",
      "PHP",
      "Ruby",
      "Go",
      "C#"
    ],
    detection_capabilities: {
      static_analysis: true,
      dynamic_analysis: false,
      ai_powered: true,
      real_time: true,
    },
    performance: {
      avg_scan_time: "< 30 seconds",
      max_file_size: "10MB",
      concurrent_scans: "unlimited",
    },
  });
});

module.exports = router;

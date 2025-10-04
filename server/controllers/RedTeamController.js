const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const runCustomExploit = require("../middleware/red_team_exploits");

/**
 * Main Red Team audit controller.
 * @param {Object} req - Express request object (expects { code, language } in body)
 * @param {Object} res - Express response object
 */
async function redTeamAudit(req, res) {
  try {
    const { code, language = "javascript" } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required." });

    const auditResult = await performSecurityAudit(code, language);

    res.json({
      audit_report: auditResult.report,
      status: "red_team_analysis_complete",
      findings: auditResult.findings,
      severity: auditResult.severity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Red Team audit for multiple files (Agent Chain integration)
 * @param {Object} req - Express request object (expects { files } in body)
 * @param {Object} res - Express response object
 */
async function redTeamAuditMultiple(req, res) {
  try {
    const { files } = req.body; // files: { filename: code }
    if (!files || typeof files !== "object") {
      return res.status(400).json({ error: "Files object is required." });
    }

    const results = {};
    const summary = {
      totalFiles: 0,
      filesWithIssues: 0,
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      overallRisk: "low",
    };

    // Audit each file
    for (const [filename, code] of Object.entries(files)) {
      // Skip non-code files
      if (!isCodeFile(filename)) {
        continue;
      }

      summary.totalFiles++;
      const language = getLanguageFromFilename(filename);
      const auditResult = await performSecurityAudit(code, language, filename);

      results[filename] = auditResult;

      if (auditResult.findings.length > 0) {
        summary.filesWithIssues++;
        summary.totalFindings += auditResult.findings.length;

        // Count by severity
        auditResult.findings.forEach((finding) => {
          switch (finding.severity) {
            case "critical":
              summary.criticalFindings++;
              break;
            case "high":
              summary.highFindings++;
              break;
            case "medium":
              summary.mediumFindings++;
              break;
            case "low":
              summary.lowFindings++;
              break;
          }
        });
      }
    }

    // Determine overall risk
    if (summary.criticalFindings > 0) {
      summary.overallRisk = "critical";
    } else if (summary.highFindings > 0) {
      summary.overallRisk = "high";
    } else if (summary.mediumFindings > 0) {
      summary.overallRisk = "medium";
    }

    res.json({
      success: true,
      summary,
      results,
      status: "multi_file_red_team_analysis_complete",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Core security audit function
 * @param {string} code - Code to audit
 * @param {string} language - Programming language
 * @param {string} filename - Optional filename for context
 */
async function performSecurityAudit(
  code,
  language = "javascript",
  filename = "temp_code.js",
) {
  // --- Static Analysis (Semgrep) ---
  const tmpFile = path.join(__dirname, `temp_${Date.now()}_${filename}`);
  fs.writeFileSync(tmpFile, code, "utf8");
  let semgrepReport;
  try {
    const semgrepPath = "/home/quagza/Desktop/venv/bin/semgrep";
    semgrepReport = execSync(`${semgrepPath} --config auto ${tmpFile}`, {
      encoding: "utf8",
      timeout: 30000,
    });
  } catch (e) {
    semgrepReport = e.stdout || e.message || "No Semgrep findings";
  } finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }

  // --- Custom Exploit Checks ---
  const customFindings = runCustomExploit(code);

  // --- LLM Audit (optional) ---
  let llmAudit = "LLM audit skipped (GitHub token not set).";
  const githubToken =
    process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN;
  if (githubToken) {
    const prompt = `
You are an expert security auditor. Analyze the following ${language} code for vulnerabilities.
File: ${filename}

Code:
${code}

Semgrep report:
${semgrepReport}

Custom exploit findings:
${JSON.stringify(customFindings, null, 2)}

Provide a detailed security audit with:
1. List of vulnerabilities found
2. Severity assessment (critical/high/medium/low)
3. Specific remediation suggestions
4. Best practices recommendations

Format as a structured markdown report.
    `;
    try {
      const response = await axios.post(
        "https://models.inference.ai.azure.com/chat/completions",
        {
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.0,
        },
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      llmAudit = response.data.choices[0].message.content;
    } catch (e) {
      llmAudit = `LLM Analysis failed: ${e.message}`;
    }
  }

  // --- Process findings ---
  const findings = processFindings(semgrepReport, customFindings, llmAudit);
  const severity = determineSeverity(findings);

  // --- Compose Audit Report ---
  const auditReport = `
# Red Team Audit Report - ${filename}

## Summary
- **File**: ${filename}
- **Language**: ${language}
- **Overall Severity**: ${severity}
- **Total Findings**: ${findings.length}

## Semgrep Static Analysis
${semgrepReport}

## Custom Security Checks
${customFindings.length > 0 ? customFindings.map((f) => `- ${f}`).join("\n") : "No custom findings detected"}

## AI-Powered Security Analysis
${llmAudit}

## Recommendations
${generateRecommendations(findings)}
  `;

  return {
    report: auditReport,
    findings,
    severity,
    filename,
    language,
  };
}

/**
 * Process and categorize security findings
 */
function processFindings(semgrepReport, customFindings, llmAudit) {
  const findings = [];

  // Process custom findings
  customFindings.forEach((finding) => {
    findings.push({
      type: "custom",
      description: finding,
      severity: categorizeCustomFinding(finding),
      source: "custom_exploit_scanner",
    });
  });

  // Process semgrep findings
  if (semgrepReport && semgrepReport !== "No Semgrep findings") {
    findings.push({
      type: "static_analysis",
      description: "Semgrep static analysis findings detected",
      severity: "medium",
      source: "semgrep",
      details: semgrepReport,
    });
  }

  // Process LLM findings
  if (
    llmAudit &&
    !llmAudit.includes("skipped") &&
    !llmAudit.includes("failed")
  ) {
    findings.push({
      type: "ai_analysis",
      description: "AI-powered security analysis completed",
      severity: "medium",
      source: "llm_audit",
      details: llmAudit,
    });
  }

  return findings;
}

/**
 * Categorize custom findings by severity
 */
function categorizeCustomFinding(finding) {
  const critical = ["injection", "XSS", "CSRF", "code execution", "eval"];
  const high = [
    "hardcoded secret",
    "insecure deserialization",
    "path traversal",
  ];
  const medium = ["CORS", "redirect", "headers", "cookie"];

  const lowerFinding = finding.toLowerCase();

  if (critical.some((term) => lowerFinding.includes(term))) return "critical";
  if (high.some((term) => lowerFinding.includes(term))) return "high";
  if (medium.some((term) => lowerFinding.includes(term))) return "medium";

  return "low";
}

/**
 * Determine overall severity from findings
 */
function determineSeverity(findings) {
  if (findings.some((f) => f.severity === "critical")) return "critical";
  if (findings.some((f) => f.severity === "high")) return "high";
  if (findings.some((f) => f.severity === "medium")) return "medium";
  if (findings.length > 0) return "low";
  return "none";
}

/**
 * Generate security recommendations
 */
function generateRecommendations(findings) {
  if (findings.length === 0) {
    return "✅ No significant security issues detected. Continue following secure coding practices.";
  }

  const recommendations = [
    "🔍 **Immediate Actions Required:**",
    "1. Review and address all critical and high severity findings",
    "2. Implement input validation and sanitization",
    "3. Add security headers and CSRF protection",
    "4. Use parameterized queries to prevent injection attacks",
    "5. Implement proper authentication and authorization",
    "",
    "🛡️ **Security Best Practices:**",
    "- Use security linters and static analysis tools",
    "- Implement rate limiting and request validation",
    "- Keep dependencies updated and scan for vulnerabilities",
    "- Use HTTPS and secure cookie settings",
    "- Implement proper error handling without information leakage",
  ];

  return recommendations.join("\n");
}

/**
 * Check if file is a code file that should be audited
 */
function isCodeFile(filename) {
  const codeExtensions = [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".py",
    ".java",
    ".php",
    ".rb",
    ".go",
    ".cs",
  ];
  return codeExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

/**
 * Get programming language from filename
 */
function getLanguageFromFilename(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    php: "php",
    rb: "ruby",
    go: "go",
    cs: "csharp",
  };
  return languageMap[ext] || "javascript";
}

module.exports = {
  redTeamAudit,
  redTeamAuditMultiple,
  performSecurityAudit,
};

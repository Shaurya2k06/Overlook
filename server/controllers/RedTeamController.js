const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { ModelClient } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const { isUnexpected } = require("@azure-rest/ai-inference");

// GitHub Models API endpoint
const endpoint = "https://models.inference.ai.azure.com";

// Try to import the exploits module, fallback if not found
let runCustomExploit;
try {
  runCustomExploit = require("../middleware/red_team_exploits");
} catch (error) {
  console.warn("Custom exploits module not found, using basic checks");
  runCustomExploit = (code) => {
    const findings = [];
    // Basic fallback checks
    if (/password\s*=\s*['"][\w]+['"]/.test(code))
      findings.push("Hardcoded password detected");
    if (/eval\s*\(/.test(code)) findings.push("Use of eval detected");
    if (/innerHTML\s*=/.test(code))
      findings.push("Potential XSS via innerHTML");
    return findings;
  };
}

/**
 * Main Red Team audit controller with robust error handling
 */
async function redTeamAudit(req, res) {
  try {
    const { code, language = "javascript" } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Valid code string is required",
        received: typeof code,
      });
    }

    if (code.length > 1000000) {
      // 1MB limit
      return res.status(400).json({
        error: "Code too large (max 1MB)",
        size: code.length,
      });
    }

    console.log(
      `Starting security audit for ${language} code (${code.length} chars)`,
    );

    const auditResult = await performSecurityAudit(code, language);

    res.json({
      success: true,
      audit_report: auditResult.report,
      status: "red_team_analysis_complete",
      findings: auditResult.findings,
      severity: auditResult.severity,
      timestamp: new Date().toISOString(),
      tools_used: auditResult.toolsUsed,
    });
  } catch (err) {
    console.error("Red team audit error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

/**
 * Red Team audit for multiple files with better error handling
 */
async function redTeamAuditMultiple(req, res) {
  try {
    const { files } = req.body;

    if (!files || typeof files !== "object" || Array.isArray(files)) {
      return res.status(400).json({
        error: "Files object is required",
        example: { "app.js": "const app = require('express')();" },
      });
    }

    const fileCount = Object.keys(files).length;
    if (fileCount === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    if (fileCount > 50) {
      return res.status(400).json({ error: "Too many files (max 50)" });
    }

    console.log(`Starting multi-file audit for ${fileCount} files`);

    const results = {};
    const summary = {
      totalFiles: 0,
      filesProcessed: 0,
      filesWithIssues: 0,
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      overallRisk: "low",
      errors: [],
    };

    // Process each file with individual error handling
    for (const [filename, code] of Object.entries(files)) {
      if (!filename || typeof code !== "string") {
        summary.errors.push(`Invalid file: ${filename}`);
        continue;
      }

      if (!isCodeFile(filename)) {
        continue; // Skip non-code files silently
      }

      summary.totalFiles++;

      try {
        const language = getLanguageFromFilename(filename);
        const auditResult = await performSecurityAudit(
          code,
          language,
          filename,
        );

        results[filename] = auditResult;
        summary.filesProcessed++;

        if (auditResult.findings && auditResult.findings.length > 0) {
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
      } catch (fileError) {
        console.error(`Error processing file ${filename}:`, fileError);
        summary.errors.push(`${filename}: ${fileError.message}`);
        results[filename] = {
          error: fileError.message,
          findings: [],
          severity: "error",
        };
      }
    }

    // Determine overall risk
    if (summary.criticalFindings > 0) summary.overallRisk = "critical";
    else if (summary.highFindings > 0) summary.overallRisk = "high";
    else if (summary.mediumFindings > 0) summary.overallRisk = "medium";

    res.json({
      success: true,
      summary,
      results,
      status: "multi_file_red_team_analysis_complete",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Multi-file audit error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

/**
 * Core security audit function with fallback strategies
 */
async function performSecurityAudit(
  code,
  language = "javascript",
  filename = "temp_code.js",
) {
  const toolsUsed = [];
  let semgrepReport = "Semgrep not available";
  let customFindings = [];
  let llmAudit = "LLM audit skipped";

  // --- Custom Exploit Checks (Always runs) ---
  try {
    customFindings = runCustomExploit(code);
    toolsUsed.push("custom_exploits");
  } catch (error) {
    console.warn("Custom exploit check failed:", error.message);
    customFindings = ["Custom security check failed"];
  }

  // --- Static Analysis (Semgrep) - Multiple fallback strategies ---
  try {
    semgrepReport = await runSemgrepAnalysis(code, filename);
    toolsUsed.push("semgrep");
  } catch (error) {
    console.warn("Semgrep analysis failed:", error.message);
    semgrepReport = `Semgrep unavailable: ${error.message}`;
  }

  // --- LLM Audit (Optional with GitHub Models API) ---
  try {
    llmAudit = await runLLMAudit(
      code,
      language,
      filename,
      semgrepReport,
      customFindings,
    );
    toolsUsed.push("llm_audit");
  } catch (error) {
    console.warn("LLM audit failed:", error.message);
    llmAudit = `LLM audit failed: ${error.message}`;
  }

  // --- Process all findings ---
  const findings = processFindings(semgrepReport, customFindings, llmAudit);
  const severity = determineSeverity(findings);

  // --- Compose comprehensive audit report ---
  const auditReport = generateAuditReport(
    filename,
    language,
    severity,
    findings,
    semgrepReport,
    customFindings,
    llmAudit,
    toolsUsed,
  );

  return {
    report: auditReport,
    findings,
    severity,
    filename,
    language,
    toolsUsed,
  };
}

/**
 * Run Semgrep analysis with multiple fallback strategies
 */
async function runSemgrepAnalysis(code, filename) {
  return new Promise((resolve) => {
    // Create secure temp file
    const tempDir = os.tmpdir();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const tmpFile = path.join(tempDir, `redteam_${Date.now()}_${safeFilename}`);

    try {
      fs.writeFileSync(tmpFile, code, { encoding: "utf8", mode: 0o600 });

      // Try multiple semgrep locations
      const semgrepPaths = [
        "semgrep", // System PATH
        "/usr/local/bin/semgrep",
        "/usr/bin/semgrep",
        "/home/quagza/Desktop/venv/bin/semgrep", // User's specific path
        process.env.SEMGREP_PATH, // Environment variable
      ].filter(Boolean);

      let semgrepFound = false;

      for (const semgrepPath of semgrepPaths) {
        try {
          const result = execSync(`${semgrepPath} --version`, {
            encoding: "utf8",
            timeout: 5000,
            stdio: "pipe",
          });

          if (result.includes("semgrep")) {
            // Run actual analysis
            const output = execSync(
              `${semgrepPath} --config auto --json --quiet "${tmpFile}"`,
              {
                encoding: "utf8",
                timeout: 30000,
                stdio: "pipe",
              },
            );

            semgrepFound = true;
            resolve(output || "No Semgrep findings");
            break;
          }
        } catch (pathError) {
          continue; // Try next path
        }
      }

      if (!semgrepFound) {
        resolve("Semgrep not found in system PATH or common locations");
      }
    } catch (error) {
      resolve(`Semgrep execution failed: ${error.message}`);
    } finally {
      // Always cleanup temp file
      try {
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError.message);
      }
    }
  });
}

/**
 * Run LLM-powered security audit
 */
async function runLLMAudit(
  code,
  language,
  filename,
  semgrepReport,
  customFindings,
) {
  const githubToken =
    process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return "LLM audit skipped (no GitHub token available)";
  }

  const prompt = `Analyze this ${language} code for security vulnerabilities:

File: ${filename}
Code:
\`\`\`${language}
${code.substring(0, 2000)}${code.length > 2000 ? "\n... (truncated)" : ""}
\`\`\`

Static Analysis: ${semgrepReport}
Custom Checks: ${customFindings.slice(0, 5).join(", ")}

Provide concise security findings with severity levels.`;

  try {
    return await makeGitHubModelsRequest(prompt, "gpt-4o");
  } catch (error) {
    throw new Error(`LLM API error: ${error.message}`);
  }
}

/**
 * Process and categorize all security findings
 */
function processFindings(semgrepReport, customFindings, llmAudit) {
  const findings = [];

  // Process custom findings
  if (Array.isArray(customFindings)) {
    customFindings.forEach((finding) => {
      findings.push({
        type: "custom",
        description: finding,
        severity: categorizeCustomFinding(finding),
        source: "custom_exploit_scanner",
      });
    });
  }

  // Process semgrep findings
  if (
    semgrepReport &&
    !semgrepReport.includes("not available") &&
    !semgrepReport.includes("failed")
  ) {
    try {
      const semgrepData = JSON.parse(semgrepReport);
      if (semgrepData.results && semgrepData.results.length > 0) {
        semgrepData.results.forEach((result) => {
          findings.push({
            type: "static_analysis",
            description: result.message || "Semgrep finding",
            severity: mapSemgrepSeverity(result.extra?.severity),
            source: "semgrep",
            rule_id: result.check_id,
            details: result,
          });
        });
      }
    } catch (parseError) {
      // If not JSON, treat as text
      if (
        semgrepReport.includes("finding") ||
        semgrepReport.includes("vulnerability")
      ) {
        findings.push({
          type: "static_analysis",
          description: "Semgrep static analysis findings detected",
          severity: "medium",
          source: "semgrep",
          details: semgrepReport,
        });
      }
    }
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
 * Map Semgrep severity to our severity levels
 */
function mapSemgrepSeverity(semgrepSeverity) {
  const severityMap = {
    ERROR: "high",
    WARNING: "medium",
    INFO: "low",
  };
  return severityMap[semgrepSeverity] || "medium";
}

/**
 * Enhanced custom finding categorization
 */
function categorizeCustomFinding(finding) {
  const lowerFinding = finding.toLowerCase();

  const critical = [
    "sql injection",
    "command injection",
    "code execution",
    "eval",
    "xss",
  ];
  const high = [
    "hardcoded",
    "secret",
    "password",
    "insecure deserialization",
    "path traversal",
  ];
  const medium = ["cors", "redirect", "headers", "cookie", "csrf"];

  if (critical.some((term) => lowerFinding.includes(term))) return "critical";
  if (high.some((term) => lowerFinding.includes(term))) return "high";
  if (medium.some((term) => lowerFinding.includes(term))) return "medium";

  return "low";
}

/**
 * Determine overall severity from findings
 */
function determineSeverity(findings) {
  if (!Array.isArray(findings) || findings.length === 0) return "none";

  const severityOrder = ["critical", "high", "medium", "low"];

  for (const severity of severityOrder) {
    if (findings.some((f) => f.severity === severity)) {
      return severity;
    }
  }

  return "none";
}

/**
 * Generate comprehensive audit report
 */
function generateAuditReport(
  filename,
  language,
  severity,
  findings,
  semgrepReport,
  customFindings,
  llmAudit,
  toolsUsed,
) {
  const timestamp = new Date().toISOString();

  return `# Red Team Security Audit Report

## Summary
- **File**: ${filename}
- **Language**: ${language}
- **Scan Time**: ${timestamp}
- **Overall Severity**: ${severity.toUpperCase()}
- **Total Findings**: ${findings.length}
- **Tools Used**: ${toolsUsed.join(", ")}

## Findings by Severity
${generateFindingsSummary(findings)}

## Custom Security Checks
${
  Array.isArray(customFindings) && customFindings.length > 0
    ? customFindings.map((f) => `- ${f}`).join("\n")
    : "No custom findings detected"
}

## Static Analysis (Semgrep)
${
  semgrepReport.includes("not available") || semgrepReport.includes("failed")
    ? semgrepReport
    : "```\n" + semgrepReport + "\n```"
}

## AI Security Analysis
${llmAudit}

## Recommendations
${generateRecommendations(findings)}

---
*Generated by Overlook Red Team Security Scanner*`;
}

/**
 * Generate findings summary by severity
 */
function generateFindingsSummary(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return "✅ No security issues detected";
  }

  const bySeverity = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(bySeverity)
    .map(([severity, count]) => `- **${severity.toUpperCase()}**: ${count}`)
    .join("\n");
}

/**
 * Generate security recommendations based on findings
 */
function generateRecommendations(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return "✅ No significant security issues detected. Continue following secure coding practices.";
  }

  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high");

  const recommendations = ["🔍 **Immediate Actions Required:**"];

  if (hasCritical) {
    recommendations.push(
      "1. ⚠️  **CRITICAL**: Address critical vulnerabilities immediately",
    );
  }
  if (hasHigh) {
    recommendations.push("2. 🚨 **HIGH**: Review and fix high severity issues");
  }

  recommendations.push(
    ...[
      "3. Implement input validation and sanitization",
      "4. Add security headers and CSRF protection",
      "5. Use parameterized queries to prevent injection attacks",
      "6. Implement proper authentication and authorization",
      "",
      "🛡️ **Security Best Practices:**",
      "- Use security linters and static analysis tools",
      "- Implement rate limiting and request validation",
      "- Keep dependencies updated and scan for vulnerabilities",
      "- Use HTTPS and secure cookie settings",
      "- Implement proper error handling without information leakage",
    ],
  );

  return recommendations.join("\n");
}

/**
 * Check if file should be audited based on extension
 */
function isCodeFile(filename) {
  if (!filename || typeof filename !== "string") return false;

  const codeExtensions = [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".mjs",
    ".py",
    ".java",
    ".php",
    ".rb",
    ".go",
    ".cs",
    ".cpp",
    ".c",
    ".h",
    ".rs",
    ".swift",
    ".kt",
    ".scala",
    ".sql",
  ];

  return codeExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

/**
 * Determine programming language from filename
 */
function getLanguageFromFilename(filename) {
  if (!filename || typeof filename !== "string") return "text";

  const ext = filename.toLowerCase().split(".").pop();
  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    php: "php",
    rb: "ruby",
    go: "go",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",
    rs: "rust",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    sql: "sql",
  };

  return languageMap[ext] || "text";
}

/* ----------------------  GITHUB MODELS API HELPER  ---------------------- */
async function makeGitHubModelsRequest(payload, model) {
  const token = process.env.GITHUB_MODELS_TOKEN;

  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        {
          role: "user",
          content: payload,
        },
      ],
      temperature: 1.0,
      top_p: 1.0,
      model: model,
    },
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }
  console.log(response.body.choices[0].message.content);
  try {
    return response.body.choices[0].message.content;
  } catch (error) {
    console.error(
      "GitHub Models API Error:",
      error.response?.data || error.message,
    );
    throw new Error(
      `GitHub Models API request failed: ${error.response?.data?.error?.message || error.message}`,
    );
  }
}

module.exports = {
  redTeamAudit,
  redTeamAuditMultiple,
  performSecurityAudit,
};

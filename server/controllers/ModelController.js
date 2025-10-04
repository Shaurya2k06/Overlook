const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();
const githubToken = process.env.GITHUB_MODELS_TOKEN;

// GitHub Models API endpoints
const GITHUB_MODELS_BASE_URL = "https://models.inference.ai.azure.com";

/* ----------------------  EXPRESS HANDLER  ---------------------- */
async function agentChainHandler(req, res) {
  const { prompt, files, runRedTeamTest = false } = req.body; // files: [{ name, code }]

  try {
    console.log("Starting 4-agent chain processing...");

    // Agent 1: Prompt Structuring Agent (Gemini)
    console.log("Agent 1: Structuring prompt...");
    const structuredPrompt = await agent1_promptStructuring(prompt, files);

    // Agent 2: Generation Agent (GPT-4o)
    console.log("Agent 2: Generating initial code...");
    const generatedCode = await agent2_codeGeneration(structuredPrompt, files);

    // Agent 3: Debugging Agent (Groq Llama 3.1)
    console.log("Agent 3: Debugging and improving code...");
    const debuggedCode = await agent3_debugging(generatedCode);

    // Agent 4: Security Agent (Mistral Medium 3)
    console.log("Agent 4: Security analysis and final refinement...");
    const finalOutput = await agent4_securityAndFinalization(debuggedCode);

    let redTeamResults = null;

    // Optional Red Team Testing
    if (runRedTeamTest) {
      console.log("Running Red Team security testing...");
      redTeamResults = await runRedTeamOnGeneratedCode(finalOutput);
    }

    res.json({
      success: true,
      structuredPrompt,
      generatedCode,
      debuggedCode,
      finalOutput,
      files: finalOutput, // The final JSON output with file structure
      redTeamResults,
    });
  } catch (err) {
    console.error("Agent chain error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
}

/* ----------------------  COMBINED HANDLER WITH RED TEAM  ---------------------- */
async function agentChainWithRedTeamHandler(req, res) {
  const { prompt, files } = req.body;

  try {
    console.log("Starting 4-agent chain with red team testing...");

    // Run the 4-agent chain
    const { structuredPrompt, generatedCode, debuggedCode, finalOutput } =
      await runAgentChain(prompt, files);

    // Run red team testing on generated code
    console.log("Running Red Team security testing...");
    const redTeamResults = await runRedTeamOnGeneratedCode(finalOutput);

    res.json({
      success: true,
      structuredPrompt,
      generatedCode,
      debuggedCode,
      finalOutput,
      files: finalOutput,
      redTeamResults,
    });
  } catch (err) {
    console.error("Agent chain with red team error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
}

/* ----------------------  AGENT 1: PROMPT STRUCTURING (GEMINI)  ---------------------- */
async function agent1_promptStructuring(originalPrompt, files = []) {
  const payload = {
    messages: [
      {
        role: "system",
        content: `You are a prompt structuring specialist. Your job is to take a user's request and create a clear, structured prompt for code generation.

INSTRUCTIONS:
1. Analyze the user request and existing files
2. Create a detailed, structured prompt that includes:
   - Clear requirements and specifications
   - Technology stack and dependencies
   - File structure expectations
   - Coding standards and best practices
   - Security considerations
3. Make the prompt comprehensive but concise
4. Focus on actionable, specific instructions

Return ONLY the structured prompt text, no additional commentary.`,
      },
      {
        role: "user",
        content: `Original Request: ${originalPrompt}

Existing Files:
${files.map((f) => `File: ${f.name}\n${f.code}`).join("\n\n")}`,
      },
    ],
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 2000,
  };

  const response = await makeGitHubModelsRequest(payload);
  return response.choices[0].message.content;
}

/* ----------------------  AGENT 2: CODE GENERATION (GPT-4O)  ---------------------- */
async function agent2_codeGeneration(structuredPrompt, files = []) {
  const payload = {
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer specializing in code generation. Your task is to create functional, well-structured code based on requirements.

INSTRUCTIONS:
1. Generate complete, functional code that meets all requirements
2. Follow best practices and coding standards
3. Include proper error handling and validation
4. Write clean, maintainable code with appropriate comments
5. Ensure code is production-ready with proper structure
6. Return ONLY the code, no explanations or markdown formatting
7. If multiple files are needed, separate them clearly with file headers

IMPORTANT: Return only raw code output, no markdown backticks or formatting.`,
      },
      {
        role: "user",
        content: `${structuredPrompt}

Context Files:
${files.map((f) => `=== ${f.name} ===\n${f.code}`).join("\n\n")}`,
      },
    ],
    model: "gpt-4o",
    temperature: 0.1,
    max_tokens: 4000,
  };

  const response = await makeGitHubModelsRequest(payload);
  return response.choices[0].message.content;
}

/* ----------------------  AGENT 3: DEBUGGING (GROQ LLAMA 3.1)  ---------------------- */
async function agent3_debugging(generatedCode) {
  const payload = {
    messages: [
      {
        role: "system",
        content: `You are a debugging specialist focused on code quality improvement and error detection.

RESPONSIBILITIES:
1. Analyze the provided code for syntax errors, logical issues, and potential bugs
2. Fix any compilation or runtime errors
3. Improve code quality, performance, and maintainability
4. Ensure proper error handling and edge case coverage
5. Optimize code structure and efficiency
6. Validate that all functions work correctly together

IMPORTANT: Return ONLY the corrected/improved code, no explanations or markdown formatting.`,
      },
      {
        role: "user",
        content: `Debug and improve this code:

${generatedCode}`,
      },
    ],
    model: "Meta-Llama-3.1-70B-Instruct",
    temperature: 0.1,
    max_tokens: 4000,
  };

  const response = await makeGitHubModelsRequest(payload);
  return response.choices[0].message.content;
}

/* ----------------------  AGENT 4: SECURITY & FINALIZATION (MISTRAL MEDIUM)  ---------------------- */
async function agent4_securityAndFinalization(debuggedCode) {
  const payload = {
    messages: [
      {
        role: "system",
        content: `You are a security specialist and code finalization expert. Your final task is to:

SECURITY ANALYSIS:
1. Identify and fix security vulnerabilities
2. Implement proper input validation and sanitization
3. Add security headers and protection mechanisms
4. Ensure secure coding practices
5. Check for injection vulnerabilities, XSS, CSRF, etc.

FINALIZATION:
1. Ensure code is production-ready
2. Add comprehensive error handling
3. Optimize performance and security
4. Create the final JSON output structure

CRITICAL OUTPUT FORMAT:
You must return a valid JSON object where:
- Each key is a filename (e.g., "app.js", "package.json", "README.md")
- Each value is the complete file content as a string
- Include ALL necessary files for a complete, working project
- Ensure proper JSON escaping for code content

Example format:
{
  "app.js": "const express = require('express');\\nconst app = express();\\n...",
  "package.json": "{\\n  \\"name\\": \\"my-app\\",\\n  \\"version\\": \\"1.0.0\\"\\n}",
  "README.md": "# My App\\n\\nThis is a description..."
}

Return ONLY the JSON object, no additional text or formatting.`,
      },
      {
        role: "user",
        content: `Perform security analysis and create final JSON output for:

${debuggedCode}`,
      },
    ],
    model: "Mistral-large",
    temperature: 0.1,
    max_tokens: 6000,
  };

  const response = await makeGitHubModelsRequest(payload);
  const content = response.choices[0].message.content.trim();

  try {
    // Try to parse as JSON, if it fails, wrap in a single file structure
    return JSON.parse(content);
  } catch (error) {
    console.warn(
      "Failed to parse JSON response, wrapping in default structure",
    );
    return {
      "main.js": content,
    };
  }
}

/* ----------------------  GITHUB MODELS API HELPER  ---------------------- */
async function makeGitHubModelsRequest(payload) {
  const config = {
    method: "post",
    url: `${GITHUB_MODELS_BASE_URL}/chat/completions`,
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
    },
    data: payload,
  };

  try {
    const response = await axios(config);
    return response.data;
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

/* ----------------------  UTILITY FUNCTIONS  ---------------------- */
async function validateGitHubToken() {
  if (!githubToken) {
    throw new Error("GITHUB_MODELS_TOKEN environment variable is required");
  }
  return true;
}

/* ----------------------  HELPER FUNCTIONS  ---------------------- */
async function runAgentChain(prompt, files = []) {
  // Agent 1: Prompt Structuring Agent (Gemini)
  const structuredPrompt = await agent1_promptStructuring(prompt, files);

  // Agent 2: Generation Agent (GPT-4o)
  const generatedCode = await agent2_codeGeneration(structuredPrompt, files);

  // Agent 3: Debugging Agent (Groq Llama 3.1)
  const debuggedCode = await agent3_debugging(generatedCode);

  // Agent 4: Security Agent (Mistral Medium 3)
  const finalOutput = await agent4_securityAndFinalization(debuggedCode);

  return {
    structuredPrompt,
    generatedCode,
    debuggedCode,
    finalOutput,
  };
}

async function runRedTeamOnGeneratedCode(finalOutput) {
  const { redTeamAudit } = require("./RedTeamController");
  const redTeamResults = {};

  try {
    // Test each file in the generated output
    for (const [filename, code] of Object.entries(finalOutput)) {
      // Skip non-code files
      if (
        !filename.endsWith(".js") &&
        !filename.endsWith(".ts") &&
        !filename.endsWith(".jsx") &&
        !filename.endsWith(".tsx")
      ) {
        continue;
      }

      console.log(`Red team testing file: ${filename}`);

      // Create a mock request/response to use the existing redTeamAudit function
      const mockReq = {
        body: {
          code: code,
          language:
            filename.endsWith(".ts") || filename.endsWith(".tsx")
              ? "typescript"
              : "javascript",
        },
      };

      let auditResult;
      const mockRes = {
        json: (data) => {
          auditResult = data;
        },
        status: () => mockRes,
      };

      await redTeamAudit(mockReq, mockRes);

      redTeamResults[filename] = auditResult;
    }

    return {
      success: true,
      results: redTeamResults,
      summary: generateRedTeamSummary(redTeamResults),
    };
  } catch (error) {
    console.error("Red team testing error:", error);
    return {
      success: false,
      error: error.message,
      results: redTeamResults,
    };
  }
}

function generateRedTeamSummary(redTeamResults) {
  const summary = {
    totalFiles: Object.keys(redTeamResults).length,
    filesWithIssues: 0,
    totalIssues: 0,
    criticalIssues: 0,
    issues: [],
  };

  for (const [filename, result] of Object.entries(redTeamResults)) {
    if (result.audit_report) {
      const hasIssues =
        result.audit_report.includes("vulnerability") ||
        result.audit_report.includes("detected") ||
        result.audit_report.includes("risk");

      if (hasIssues) {
        summary.filesWithIssues++;
        summary.totalIssues++;

        // Check for critical issues
        if (
          result.audit_report.includes("injection") ||
          result.audit_report.includes("XSS") ||
          result.audit_report.includes("CSRF")
        ) {
          summary.criticalIssues++;
        }

        summary.issues.push({
          file: filename,
          severity: result.audit_report.includes("injection")
            ? "critical"
            : "medium",
          report: result.audit_report,
        });
      }
    }
  }

  return summary;
}

// Legacy function for backward compatibility
async function geminiHandler(req, res) {
  console.warn("geminiHandler is deprecated, redirecting to agentChainHandler");
  return agentChainHandler(req, res);
}

module.exports = {
  agentChainHandler,
  agentChainWithRedTeamHandler,
  geminiHandler, // Keep for backward compatibility
  agent1_promptStructuring,
  agent2_codeGeneration,
  agent3_debugging,
  agent4_securityAndFinalization,
  runAgentChain,
  runRedTeamOnGeneratedCode,
};

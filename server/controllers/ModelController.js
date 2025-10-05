import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import Rooms from "../model/Rooms.js";
import axios from "axios";

dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY;
const githubToken = process.env.GITHUB_MODELS_TOKEN;

// GitHub Models API endpoints
const GITHUB_MODELS_BASE_URL = "https://models.inference.ai.azure.com";

/* ----------------------  EXPRESS HANDLERS  ---------------------- */
async function agentChainHandler(req, res) {
  const { prompt, rid, runRedTeamTest = false } = req.body;

  try {
    if (!prompt || !rid) {
      return res.status(400).json({
        success: false,
        error: "Prompt and Room ID are required",
      });
    }

    const room = await Rooms.findOne({ rid });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    const files = room.files || []; // [{ filename, code }]

    console.log("Starting recursive 4-agent chain processing...");

    // Start recursive agent chain with Security & Finalization Agent
    const finalOutput = await agent4_securityAndFinalization(prompt, files);

    let redTeamResults = null;

    // Optional Red Team Testing
    if (runRedTeamTest) {
      console.log("Running Red Team security testing...");
      redTeamResults = await runRedTeamOnGeneratedCode(finalOutput.files);
    }

    res.json({
      success: true,
      structuredPrompt: finalOutput.structuredPrompt,
      generatedCode: finalOutput.generatedCode,
      debuggedCode: finalOutput.debuggedCode,
      finalOutput: finalOutput.files,
      files: finalOutput.files,
      redTeamResults,
    });
  } catch (err) {
    console.error("Agent chain error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

async function agentChainWithRedTeamHandler(req, res) {
  const { prompt, rid } = req.body;

  try {
    if (!prompt || !rid) {
      return res.status(400).json({
        success: false,
        error: "Prompt and Room ID are required",
      });
    }

    const room = await Rooms.findOne({ rid });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    const files = room.files || [];

    console.log("Starting recursive 4-agent chain with red team testing...");

    // Run the recursive agent chain
    const finalOutput = await agent4_securityAndFinalization(prompt, files);

    // Run red team testing on generated code
    console.log("Running Red Team security testing...");
    const redTeamResults = await runRedTeamOnGeneratedCode(finalOutput.files);

    res.json({
      success: true,
      structuredPrompt: finalOutput.structuredPrompt,
      generatedCode: finalOutput.generatedCode,
      debuggedCode: finalOutput.debuggedCode,
      finalOutput: finalOutput.files,
      files: finalOutput.files,
      redTeamResults,
    });
  } catch (err) {
    console.error("Agent chain with red team error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

// Legacy Gemini handler for backward compatibility
async function geminiHandler(req, res) {
  const { prompt, rid } = req.body;
  try {
    if (!prompt || !rid) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt and Room ID are required" });
    }

    const room = await Rooms.findOne({ rid });
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }
    const files = room.files || []; // [{ filename, code }]

    // Use the refined prompt approach from original implementation
    const refinedPrompt = await getRefinedPrompt(prompt, files);
    const output = await geminiPrompt(refinedPrompt, files);

    return res.json({ success: true, refinedPrompt, output });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

/* ----------------------  RECURSIVE AGENT FUNCTIONS  ---------------------- */

/* AGENT 4: SECURITY & FINALIZATION - INITIATES THE RECURSIVE CHAIN */
async function agent4_securityAndFinalization(originalPrompt, files = []) {
  console.log("Agent 4: Starting security analysis and finalization...");

  try {
    // Call Agent 3 (Debugging) recursively
    const debuggingResults = await agent3_debugging(originalPrompt, files);

    const systemPrompt = `You are a security specialist and code finalization expert. Your final task is to:

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

Return ONLY the JSON object, no additional text or formatting.`;

    const userPrompt = `Perform security analysis and create final JSON output for:

${debuggingResults.debuggedCode}`;

    const response = await makeGitHubModelsRequest(
      systemPrompt,
      userPrompt,
      "Mistral-large",
    );
    const content = response.trim();

    let finalFiles;
    try {
      finalFiles = JSON.parse(content);
    } catch (error) {
      console.warn(
        "Failed to parse JSON response, wrapping in default structure",
      );
      finalFiles = {
        "main.js": content,
      };
    }

    return {
      structuredPrompt: debuggingResults.structuredPrompt,
      generatedCode: debuggingResults.generatedCode,
      debuggedCode: debuggingResults.debuggedCode,
      files: finalFiles,
    };
  } catch (error) {
    console.error("Agent 4 error:", error);
    throw new Error(`Security and finalization failed: ${error.message}`);
  }
}

/* AGENT 3: DEBUGGING - CALLS CODE GENERATION */
async function agent3_debugging(originalPrompt, files = []) {
  console.log("Agent 3: Starting debugging and code improvement...");

  try {
    // Call Agent 2 (Code Generation) recursively
    const codeGenResults = await agent2_codeGeneration(originalPrompt, files);

    const systemPrompt = `You are a debugging specialist focused on code quality improvement and error detection.

RESPONSIBILITIES:
1. Analyze the provided code for syntax errors, logical issues, and potential bugs
2. Fix any compilation or runtime errors
3. Improve code quality, performance, and maintainability
4. Ensure proper error handling and edge case coverage
5. Optimize code structure and efficiency
6. Validate that all functions work correctly together

IMPORTANT: Return ONLY the corrected/improved code, no explanations or markdown formatting.`;

    const userPrompt = `Debug and improve this code:

${codeGenResults.generatedCode}`;

    const response = await makeGitHubModelsRequest(
      systemPrompt,
      userPrompt,
      "Meta-Llama-3.1-70B-Instruct",
    );
    const debuggedCode = response;

    return {
      structuredPrompt: codeGenResults.structuredPrompt,
      generatedCode: codeGenResults.generatedCode,
      debuggedCode: debuggedCode,
    };
  } catch (error) {
    console.error("Agent 3 error:", error);
    throw new Error(`Debugging failed: ${error.message}`);
  }
}

/* AGENT 2: CODE GENERATION - CALLS PROMPT STRUCTURING */
async function agent2_codeGeneration(originalPrompt, files = []) {
  console.log("Agent 2: Starting code generation...");

  try {
    // Call Agent 1 (Prompt Structuring) recursively
    const structuredPrompt = await agent1_promptStructuring(
      originalPrompt,
      files,
    );

    const systemPrompt = `You are a senior software engineer specializing in code generation. Your task is to create functional, well-structured code based on requirements.

INSTRUCTIONS:
1. Generate complete, functional code that meets all requirements
2. Follow best practices and coding standards
3. Include proper error handling and validation
4. Write clean, maintainable code with appropriate comments
5. Ensure code is production-ready with proper structure
6. Return ONLY the code, no explanations or markdown formatting
7. If multiple files are needed, separate them clearly with file headers

IMPORTANT: Return only raw code output, no markdown backticks or formatting.`;

    const userPrompt = `${structuredPrompt}

Context Files:
${files.map((f) => `=== ${f.filename} ===\n${f.code}`).join("\n\n")}`;

    const response = await makeGitHubModelsRequest(
      systemPrompt,
      userPrompt,
      "gpt-4o",
    );
    const generatedCode = response;

    return {
      structuredPrompt: structuredPrompt,
      generatedCode: generatedCode,
    };
  } catch (error) {
    console.error("Agent 2 error:", error);
    throw new Error(`Code generation failed: ${error.message}`);
  }
}

/* AGENT 1: PROMPT STRUCTURING - BASE OF RECURSION */
async function agent1_promptStructuring(originalPrompt, files = []) {
  console.log("Agent 1: Starting prompt structuring...");

  try {
    const systemPrompt = `You are a prompt structuring specialist. Your job is to take a user's request and create a clear, structured prompt for code generation.

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

Return ONLY the structured prompt text, no additional commentary.`;

    const userPrompt = `Original Request: ${originalPrompt}

Existing Files:
${files.map((f) => `File: ${f.filename}\n${f.code}`).join("\n\n")}`;

    const response = await makeGitHubModelsRequest(
      systemPrompt,
      userPrompt,
      "gpt-4o",
    );
    return response;
  } catch (error) {
    console.error("Agent 1 error:", error);
    throw new Error(`Prompt structuring failed: ${error.message}`);
  }
}

/* ----------------------  LEGACY GEMINI FUNCTIONS (PRESERVED)  ---------------------- */

// refining the prompt to be clearer and more specific
async function getRefinedPrompt(originalPrompt, files = []) {
  try {
    if (!geminiApiKey) {
      console.warn("GEMINI_API_KEY not found, using original prompt");
      return originalPrompt;
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let helperInstruction = `You are a prompt-crafting assistant.
Rewrite the following user request so it is clear, concise, and well-structured for another AI code model.
Keep the intent unchanged but improve clarity and specificity.
Use the supplied project files as context to tailor the prompt, but DO NOT output file contents.

USER REQUEST:
${originalPrompt}

--- PROJECT FILES CONTEXT START ---`;

    if (files.length) {
      for (const f of files) {
        const preview = (f.code || "").slice(0, 1500);
        helperInstruction += `

### FILE: ${f.filename}
${preview}
`;
      }
    } else {
      helperInstruction += `

(no project files provided)
`;
    }

    helperInstruction += `
--- PROJECT FILES CONTEXT END ---`;

    const result = await model.generateContent(helperInstruction);
    return result.response?.text() || originalPrompt;
  } catch (error) {
    console.error("Gemini prompt refinement error:", error);
    return originalPrompt;
  }
}

// asking Gemini to produce the code in your single-file multi-section format
async function geminiPrompt(refinedPrompt, files = []) {
  try {
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let fullPrompt = `You are a code generator. Output ONLY source files in a single message, split into sections.

FORMAT RULES:
- For every file:
  (a) Print the relative file path on its own line (e.g., src/App.jsx). No prefixes, no code fences.
  (b) Then print the entire file content verbatim.
      The FIRST line inside the content must be a language-appropriate comment that repeats the same path
      (e.g., // src/App.jsx, /* src/styles.css */, <!-- src/index.html -->, # src/main.py).
  (c) After the file content, print this delimiter EXACTLY on its own line:
      **##$$%%(())--==++__
- Do NOT include any markdown code fences.
- Do NOT include explanations or extra lines outside file sections.
- Use ASCII quotes (no smart quotes).

REFINED USER REQUEST:
${refinedPrompt}

You may use the following project files as CONTEXT ONLY (do not echo them verbatim unless you are modifying or reusing parts).
If you produce updated or new files, emit them as proper sections per the rules above.

--- PROJECT FILES START ---`;

    if (files.length) {
      for (const f of files) {
        fullPrompt += `
### FILE: ${f.filename}
${f.code || ""}
`;
      }
    } else {
      fullPrompt += `

(no project files provided)
`;
    }

    fullPrompt += `
--- PROJECT FILES END ---
Now output ONLY the generated/updated files in the exact sectioned format described above.`;

    const result = await model.generateContent(fullPrompt);
    return result.response?.text() || "";
  } catch (error) {
    console.error("Gemini prompt error:", error);
    throw new Error(`Gemini API request failed: ${error.message}`);
  }
}

/* ----------------------  GITHUB MODELS API HELPER  ---------------------- */
async function makeGitHubModelsRequest(
  systemPrompt,
  userPrompt,
  model = "gpt-4o",
) {
  try {
    if (!githubToken) {
      throw new Error("GITHUB_MODELS_TOKEN environment variable is required");
    }

    const payload = {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4000,
      model: model,
    };

    const config = {
      method: "post",
      url: `${GITHUB_MODELS_BASE_URL}/chat/completions`,
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      data: payload,
    };

    const response = await axios(config);

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error("Invalid response format from GitHub Models API");
    }
  } catch (error) {
    console.error(
      "GitHub Models API Error:",
      error.response?.data || error.message,
    );

    if (error.response?.status === 401) {
      throw new Error(
        "GitHub Models API authentication failed. Check your GITHUB_MODELS_TOKEN.",
      );
    } else if (error.response?.status === 429) {
      throw new Error(
        "GitHub Models API rate limit exceeded. Please try again later.",
      );
    } else if (error.response?.status === 404) {
      throw new Error(`GitHub Models API model not found: ${model}`);
    }

    throw new Error(
      `GitHub Models API request failed: ${error.response?.data?.error?.message || error.message}`,
    );
  }
}

/* ----------------------  RED TEAM TESTING FUNCTIONS  ---------------------- */
async function runRedTeamOnGeneratedCode(finalOutput) {
  const redTeamResults = {};

  try {
    // Test each file in the generated output
    for (const [filename, code] of Object.entries(finalOutput)) {
      // Skip non-code files
      if (
        !filename.endsWith(".js") &&
        !filename.endsWith(".ts") &&
        !filename.endsWith(".jsx") &&
        !filename.endsWith(".tsx") &&
        !filename.endsWith(".py") &&
        !filename.endsWith(".php") &&
        !filename.endsWith(".java")
      ) {
        continue;
      }

      console.log(`Red team testing file: ${filename}`);

      // Simple vulnerability checks for demonstration
      const vulnerabilities = [];

      // Check for potential SQL injection
      if (
        code.includes("query") &&
        (code.includes("+") || code.includes("${") || code.includes("%s"))
      ) {
        vulnerabilities.push("Potential SQL injection vulnerability detected");
      }

      // Check for XSS vulnerabilities
      if (
        code.includes("innerHTML") ||
        code.includes("dangerouslySetInnerHTML") ||
        code.includes("document.write")
      ) {
        vulnerabilities.push("Potential XSS vulnerability detected");
      }

      // Check for hardcoded secrets
      if (
        code.match(/password\s*[=:]\s*["'][^"']+["']/i) ||
        code.match(/api[_-]?key\s*[=:]\s*["'][^"']+["']/i) ||
        code.match(/secret\s*[=:]\s*["'][^"']+["']/i)
      ) {
        vulnerabilities.push("Hardcoded credentials detected");
      }

      // Check for command injection
      if (
        code.includes("exec(") ||
        code.includes("system(") ||
        code.includes("shell_exec(") ||
        code.includes("eval(")
      ) {
        vulnerabilities.push(
          "Potential command injection vulnerability detected",
        );
      }

      // Check for insecure random generation
      if (
        code.includes("Math.random()") &&
        (code.includes("password") || code.includes("token"))
      ) {
        vulnerabilities.push(
          "Insecure random number generation for security purposes",
        );
      }

      // Check for missing input validation
      if (code.includes("req.body") || code.includes("request.form")) {
        if (!code.includes("validate") && !code.includes("sanitize")) {
          vulnerabilities.push("Missing input validation detected");
        }
      }

      redTeamResults[filename] = {
        success: true,
        vulnerabilities: vulnerabilities,
        audit_report:
          vulnerabilities.length > 0
            ? `Security issues found: ${vulnerabilities.join(", ")}`
            : "No obvious security vulnerabilities detected",
      };
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
    if (result.vulnerabilities && result.vulnerabilities.length > 0) {
      summary.filesWithIssues++;
      summary.totalIssues += result.vulnerabilities.length;

      // Check for critical issues
      const hasCritical = result.vulnerabilities.some(
        (vuln) =>
          vuln.includes("injection") ||
          vuln.includes("XSS") ||
          vuln.includes("credentials") ||
          vuln.includes("command"),
      );

      if (hasCritical) {
        summary.criticalIssues++;
      }

      summary.issues.push({
        file: filename,
        severity: hasCritical ? "critical" : "medium",
        vulnerabilities: result.vulnerabilities,
      });
    }
  }

  return summary;
}

/* ----------------------  UTILITY FUNCTIONS  ---------------------- */
async function validateGitHubToken() {
  if (!githubToken) {
    throw new Error("GITHUB_MODELS_TOKEN environment variable is required");
  }
  return true;
}

// Non-recursive helper function for backward compatibility
async function runAgentChain(prompt, files = []) {
  console.warn(
    "runAgentChain is deprecated in favor of recursive implementation",
  );
  const result = await agent4_securityAndFinalization(prompt, files);
  return {
    structuredPrompt: result.structuredPrompt,
    generatedCode: result.generatedCode,
    debuggedCode: result.debuggedCode,
    finalOutput: result.files,
  };
}

export {
  agentChainHandler,
  agentChainWithRedTeamHandler,
  geminiHandler,
  agent1_promptStructuring,
  agent2_codeGeneration,
  agent3_debugging,
  agent4_securityAndFinalization,
  runAgentChain,
  runRedTeamOnGeneratedCode,
  getRefinedPrompt,
  geminiPrompt,
  validateGitHubToken,
};

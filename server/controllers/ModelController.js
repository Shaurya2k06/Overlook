import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import Rooms from "../model/Rooms.js";

dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY;


export async function geminiHandler(req, res) {
  const { prompt, rid } = req.body;
  try {
    if (!prompt || !rid) {
      return res.status(400).json({ success: false, error: "Prompt and Room ID are required" });
    }

    const room = await Rooms.findOne({ rid });
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }
    const files = room.files || []; // [{ filename, code }]

    // 2) refine using prompt + files context
    const refinedPrompt = await getRefinedPrompt(prompt, files);

    // 3) ask for codebase in your single-file multi-section format
    const output = await geminiPrompt(refinedPrompt, files);

    return res.json({ success: true, refinedPrompt, output });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// refining the prompt to be clearer and more specific
async function getRefinedPrompt(originalPrompt, files = []) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Keep this request lightweight; include brief file previews
  let helperInstruction =
      `You are a prompt-crafting assistant.
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
}

// asking Gemini to produce the code in your single-file multi-section format
async function geminiPrompt(refinedPrompt, files = []) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Clear, fence-free instructions for your single-file output format
  let fullPrompt =
      `You are a code generator. Output ONLY source files in a single message, split into sections.

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
}
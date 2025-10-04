//temp file for parsing but good conflicts we've suffered. can't anynore.....


const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const Rooms = require("../model/Rooms.js");

dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY;


async function geminiHandler(req, res) {
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

        const outputFileList = await parseCode(output);

        room.updatedFiles = outputFileList;
        await room.save();

        return res.json({ outputFileList });
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


export async function parseCode(resultText) {
    if (!resultText || typeof resultText !== "string") {
        return [];
    }

    const DELIM_RE = /^\*\*##\$\$%%\(\(\)\)--==\+\+__\s*$/m;

    const rawSections = resultText
        .split(DELIM_RE)
        .map(s => s.trim())
        .filter(Boolean);

    const files = [];

    for (let section of rawSections) {
        // A section *may* start with a standalone path line (per your format),
        // followed by the file content whose FIRST line is a comment repeating the path.
        // We'll be robust to either presence/absence of the header path line.

        const lines = section.split(/\r?\n/);

        // Try to detect an optional header path line (not a comment)
        // Heuristic: if first non-empty line has no typical comment opener and resembles a filepath (has "/" or a dot ext), treat it as header.
        let idx = 0;
        while (idx < lines.length && lines[idx].trim() === "") idx++;
        let headerPath = null;
        if (idx < lines.length) {
            const probe = lines[idx].trim();
            const looksLikeComment =
                /^\/\//.test(probe) ||                 // // ...
                /^\/\*/.test(probe) ||                 /* ... */
                /^<!--/.test(probe) ||                 // <!-- ... -->
                /^#/.test(probe);                      // # ...
            const looksLikePath = /[\/\\]/.test(probe) || /\.[A-Za-z0-9]+$/.test(probe);
            if (!looksLikeComment && looksLikePath) {
                headerPath = probe;
                idx++; // advance to content start
            }
        }

        // Now the content should start at idx. The first line of content should be a comment that repeats the path.
        if (idx >= lines.length) {
            continue;
        }

        const firstContentLine = (lines[idx] ?? "").trim();

        const pathFromComment = extractPathFromFirstLineComment(firstContentLine);
        const filename = (pathFromComment || headerPath || "").trim();

        if (!filename) {
            continue;
        }

        const contentLines = lines.slice(idx + 1);

        const code = contentLines.join("\n");

        files.push({ filename, code });
    }

    return files;
}


function extractPathFromFirstLineComment(line) {
    if (!line) return "";

    // : // path
    let m = line.match(/^\/\/\s*(.+?)\s*$/);
    if (m) return m[1];

    // : /* path */
    m = line.match(/^\/\*\s*(.+?)\s*\*\/\s*$/);
    if (m) return m[1];

    // : <!-- path -->
    m = line.match(/^<!--\s*(.+?)\s*-->\s*$/);
    if (m) return m[1];

    // : # path
    m = line.match(/^#\s*(.+?)\s*$/);
    if (m) return m[1];

    // : also allow `;` comments (e.g., some cfgs) if needed:
    m = line.match(/^;\s*(.+?)\s*$/);
    if (m) return m[1];

    return "";
}

module.exports = { geminiHandler }
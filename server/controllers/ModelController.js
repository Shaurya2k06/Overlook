//using const = require

const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY;

/* ----------------------  EXPRESS HANDLER  ---------------------- */
async function geminiHandler(req, res) {
  const { prompt, files } = req.body; // files: [{ name, code }]
  try {
    const refinedPrompt = await getRefinedPrompt(prompt);

    // 2. Send refined prompt along with the files to Gemini again
    const output = await geminiPrompt(refinedPrompt, files);

    res.json({
      success: true,
      refinedPrompt,
      output,
    });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/* ----------------------  STEP 1: refine user prompt  ---------------------- */
async function getRefinedPrompt(originalPrompt) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const helperInstruction = `You are a prompt-crafting assistant.
Rewrite the following user request so it is clear, concise, and well-structured for another AI code model.
Keep the intent unchanged but make it as precise as possible.

USER PROMPT:
${originalPrompt}`;

  const result = await model.generateContent(helperInstruction);
  return result.response?.text() || originalPrompt;
}

/* ----------------------  STEP 2: send refined prompt with files  ---------------------- */
async function geminiPrompt(prompt, files = []) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let fullPrompt = `You are an expert code assistant.
Follow the refined user request below, using the supplied project files.

REFINED REQUEST:
${prompt}

--- PROJECT FILES START ---`;

  if (files.length) {
    for (const f of files) {
      fullPrompt += `
### FILE: ${f.name}
${f.code}
`;
    }
  } else {
    fullPrompt += `\n(no project files provided)\n`;
  }

  fullPrompt += `
--- PROJECT FILES END ---
Provide your best possible answer based on the above.`;

  const result = await model.generateContent(fullPrompt);
  return result.response?.text() || "";
}

module.exports = { geminiHandler };

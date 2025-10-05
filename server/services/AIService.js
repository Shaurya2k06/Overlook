const { agentChainHandler, agentChainWithRedTeamHandler } = require('../controllers/ModelController');
const { addFilesToRoomHelper } = require('../controllers/RoomsController');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced AI Pipeline Service that handles:
 * 1. Gemini - Prompt refinement
 * 2. GPT-4o - Code generation
 * 3. Mistral - Code debugging  
 * 4. Llama 3.3 70B - Security vulnerability testing
 * 5. Automatic file upload to room
 */

/**
 * Complete end-to-end AI generation with automatic room creation and file display
 */
async function endToEndAIGeneration(req, res) {
  const startTime = Date.now();
  const { prompt, includeRedTeam = false } = req.body;

  try {
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendProgress = (step, agent, progress, message, timeEstimate = null) => {
      const data = {
        step,
        agent,
        progress,
        message,
        timeEstimate,
        timestamp: new Date().toISOString()
      };
      console.log(`📊 Progress: ${progress}% - ${agent}: ${message}`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const sendError = (error) => {
      const data = {
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      };
      console.error('❌ Pipeline Error:', error);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.end();
    };

    // Generate unique room ID
    const rid = `ai-room-${uuidv4()}`;
    
    console.log(`🚀 Starting End-to-End AI Pipeline`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🆔 Generated Room ID: ${rid}`);
    console.log(`🔒 Red Team Testing: ${includeRedTeam ? 'ENABLED' : 'DISABLED'}`);

    sendProgress("Initializing Pipeline", "SYSTEM", 5, "Starting 4-agent AI pipeline", "60-90 seconds estimated");

    // Create temporary room object
    const room = {
      rid: rid,
      files: [],
      owner: null
    };

    sendProgress("Room Created", "SYSTEM", 10, `Generated room ID: ${rid}`, "55-85 seconds remaining");

    // Time estimates for each agent
    const timeEstimates = {
      agent1: "15-20 seconds",
      agent2: "15-25 seconds", 
      agent3: "15-25 seconds",
      agent4: "15-20 seconds"
    };

    sendProgress("Starting Agent 1", "GPT-4o", 15, "Structuring and refining prompt", timeEstimates.agent1);

        // Step 4: Run the AI pipeline with improved error handling
    let aiResults = null;
    try {
      sendProgress("AI Processing", "AGENT CHAIN", 25, "Starting 4-agent pipeline");
      
      const mockReq = { body: { prompt, rid: rid, runRedTeamTest: false } };
      const mockRes = {
        json: (data) => { aiResults = data; },
        status: (code) => ({ json: (data) => { aiResults = { error: data, statusCode: code }; } })
      };
      
      await agentChainHandler(mockReq, mockRes);
      
      if (aiResults && aiResults.error) {
        throw new Error(aiResults.error.error || 'Agent chain failed');
      }
      
      if (!aiResults || !aiResults.success) {
        throw new Error('AI pipeline returned invalid response');
      }
      
      // Validate and clean up the results
      if (aiResults.files && typeof aiResults.files === 'object') {
        // Ensure all files have valid content
        const validFiles = {};
        for (const [filename, content] of Object.entries(aiResults.files)) {
          if (filename && content && typeof content === 'string') {
            validFiles[filename] = content;
          }
        }
        aiResults.files = validFiles;
      }
      
      sendProgress("AI Processing", "AGENT CHAIN", 70, "Agent chain completed successfully");
      
    } catch (error) {
      console.error('❌ AI Pipeline Error:', error);
      sendProgress("Pipeline Error", "SYSTEM", 70, `Error: ${error.message}`);
      
      // Create fallback response based on the prompt
      aiResults = createFallbackResponse(prompt);
      sendProgress("Fallback Response", "SYSTEM", 75, "Using intelligent fallback response");
    }

    sendProgress("Preparing Files", "SYSTEM", 95, "Processing generated files for IDE display", "2-3 seconds remaining");

    // Process the files for display
    let filesToDisplay = [];
    
    if (aiResults && aiResults.success) {
      console.log('Processing AI results:', {
        hasFiles: !!aiResults.files,
        hasFinalOutput: !!aiResults.finalOutput,
        filesType: typeof aiResults.files,
        finalOutputType: typeof aiResults.finalOutput
      });
      
      // Try to extract files from various possible locations
      let fileData = aiResults.files || aiResults.finalOutput || {};
      
      // Handle different response formats
      if (typeof fileData === 'string') {
        try {
          fileData = JSON.parse(fileData);
        } catch (e) {
          console.log('Could not parse file data as JSON, treating as single file');
          fileData = { 'generated.txt': fileData };
        }
      }
      
      if (fileData && typeof fileData === 'object') {
        console.log('File data keys:', Object.keys(fileData));
        
        // Convert to array format for display
        for (const [filename, code] of Object.entries(fileData)) {
          if (filename && code && typeof code === 'string') {
            filesToDisplay.push({
              filename: filename,
              code: code,
              language: getLanguageFromFilename(filename)
            });
          }
        }
      }
    }

    // If no files were generated, create a fallback
    if (filesToDisplay.length === 0) {
      console.log('No files found in AI results, creating fallback');
      const fallbackFiles = createFallbackResponse(prompt);
      for (const [filename, code] of Object.entries(fallbackFiles.files)) {
        filesToDisplay.push({
          filename: filename,
          code: code,
          language: getLanguageFromFilename(filename)
        });
      }
    }

    console.log(`Prepared ${filesToDisplay.length} files for display:`, filesToDisplay.map(f => f.filename));

    // Debug: Log the complete file structure
    filesToDisplay.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        filename: file.filename,
        language: file.language,
        codeLength: file.code?.length || 0,
        codePreview: file.code?.substring(0, 100) + '...'
      });
    });

    // Final completion
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    sendProgress("Pipeline Complete", "SYSTEM", 100, `Pipeline completed successfully in ${totalTime}s`, null);

    // Send final result with files ready for IDE display
    const finalResult = {
      complete: true,
      success: true,
      roomId: rid,
      processingTime: totalTime,
      files: filesToDisplay,
      totalFiles: filesToDisplay.length,
      agentResults: aiResults,
      timestamp: new Date().toISOString()
    };

    console.log('Sending final result to frontend:', {
      complete: finalResult.complete,
      filesCount: finalResult.files?.length,
      fileNames: finalResult.files?.map(f => f.filename)
    });

    res.write(`data: ${JSON.stringify(finalResult)}\n\n`);
    res.end();

  } catch (error) {
    console.error('End-to-end pipeline error:', error);
    const errorData = {
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.end();
  }
}

/**
 * Get file language for syntax highlighting
 */
function getLanguageFromFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript', 
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'txt': 'text',
    'yaml': 'yaml',
    'yml': 'yaml'
  };
  return languageMap[ext] || 'text';
}

/**
 * Process AI pipeline and automatically upload files to room
 * @param {string} prompt - User prompt
 * @param {string} rid - Room ID  
 * @param {boolean} runRedTeamTest - Whether to run red team security testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function processAIPipelineAndUpload(req, res) {
  const { prompt, rid, runRedTeamTest = false } = req.body;

  try {
    if (!prompt || !rid) {
      return res.status(400).json({
        success: false,
        error: "Prompt and Room ID are required",
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendProgress = (step, agent, progress, message) => {
      const data = {
        step,
        agent,
        progress,
        message,
        timestamp: new Date().toISOString()
      };
      console.log(`📊 Progress: ${progress}% - ${agent}: ${message}`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const sendError = (error) => {
      const data = {
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      };
      console.error('❌ Pipeline Error:', error);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.end();
    };

    console.log(`🚀 Starting AI Pipeline for room: ${rid}`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🔒 Red Team Testing: ${runRedTeamTest ? 'ENABLED' : 'DISABLED'}`);

    sendProgress("Initializing Pipeline", "SYSTEM", 5, "Starting 4-agent AI pipeline");

    // Check if room exists, create temporary one for testing if not found
    const Rooms = require('../model/Rooms');
    let room = await Rooms.findOne({ rid });
    if (!room) {
      console.log(`⚠️  Room ${rid} not found, creating temporary room for testing`);
      room = {
        rid: rid,
        files: [],
        owner: null // Temporary for testing
      };
      sendProgress("Room Created", "SYSTEM", 10, "Temporary room created for testing");
    } else {
      sendProgress("Room Validated", "SYSTEM", 10, "Room found and validated");
    }

    // Step 1-4: Run the AI pipeline with proper error handling
    let aiResults = null;
    
    try {
      sendProgress("Starting AI Agents", "SYSTEM", 15, "Initializing agent chain");
      
      // Create a mock response handler that captures the result
      let pipelineComplete = false;
      const mockReq = { body: { prompt, rid, runRedTeamTest } };
      const mockRes = {
        json: (data) => {
          aiResults = data;
          pipelineComplete = true;
          sendProgress("AI Processing", "SYSTEM", 70, "Agent chain completed");
          return data;
        },
        status: (code) => ({
          json: (data) => {
            aiResults = { status: code, ...data };
            pipelineComplete = true;
            if (code !== 200) {
              throw new Error(data.error || `HTTP ${code}`);
            }
            return data;
          }
        })
      };

      // Import and run the appropriate handler
      const { agentChainHandler, agentChainWithRedTeamHandler } = require('../controllers/ModelController');
      
      if (runRedTeamTest) {
        sendProgress("Secure Mode", "SYSTEM", 20, "Running with red team testing");
        await agentChainWithRedTeamHandler(mockReq, mockRes);
      } else {
        sendProgress("Quick Mode", "SYSTEM", 20, "Running quick pipeline");
        await agentChainHandler(mockReq, mockRes);
      }

      // Wait a bit for the async operation to complete
      let attempts = 0;
      while (!pipelineComplete && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!pipelineComplete) {
        throw new Error("AI pipeline timeout - no response received");
      }

      if (!aiResults) {
        throw new Error("AI pipeline completed but returned no results");
      }

      if (!aiResults.success) {
        throw new Error(aiResults.error || 'AI Pipeline failed');
      }

      sendProgress("Pipeline Complete", "SYSTEM", 80, "AI agents completed successfully");

    } catch (pipelineError) {
      console.error('Pipeline execution error:', pipelineError);
      sendProgress("Pipeline Error", "SYSTEM", 70, `Error: ${pipelineError.message}`);
      
      // Create a simple fallback response
      aiResults = {
        success: true,
        files: {
          "demo.js": `// Generated code for: ${prompt}\nconsole.log("Hello, this is a demo response!");\n// Error occurred in full pipeline: ${pipelineError.message}`,
          "README.md": `# Demo Project\n\nThis is a demo response because the full AI pipeline encountered an error:\n${pipelineError.message}\n\nPrompt: ${prompt}`
        }
      };
      
      sendProgress("Fallback Response", "SYSTEM", 75, "Using fallback response due to pipeline error");
    }

    // Step 5: Prepare files for upload
    sendProgress("Preparing Files", "SYSTEM", 85, "Processing generated files");
    
    const filesForUpload = [];
    if (aiResults && aiResults.files && typeof aiResults.files === 'object') {
      for (const [filename, code] of Object.entries(aiResults.files)) {
        filesForUpload.push({
          filename: filename,
          code: code
        });
      }
    }

    // Step 6: Upload files to room
    sendProgress("Uploading Files", "SYSTEM", 90, `Uploading ${filesForUpload.length} files to room`);
    
    let uploadResult = { message: 'No files to upload' };
    if (filesForUpload.length > 0) {
      try {
        const { addFilesToRoomHelper } = require('../controllers/RoomsController');
        uploadResult = await addFilesToRoomHelper(rid, filesForUpload);
        sendProgress("Files Uploaded", "SYSTEM", 95, "Files uploaded successfully to room");
      } catch (uploadError) {
        console.error('❌ File upload failed:', uploadError);
        uploadResult = { error: uploadError.message };
        sendProgress("Upload Warning", "SYSTEM", 95, "File upload encountered issues");
      }
    }

    // Send completion
    sendProgress("Pipeline Complete", "SYSTEM", 100, "AI pipeline completed successfully");
    
    res.write(`data: ${JSON.stringify({
      complete: true,
      result: aiResults,
      files: filesForUpload,
      uploadResult: uploadResult,
      timestamp: new Date().toISOString()
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('❌ AI Pipeline Error:', error);
    
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    } else {
      res.write(`data: ${JSON.stringify({
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    }
  }
}

/**
 * Quick AI generation endpoint (no red team testing)
 */
async function quickAIGeneration(req, res) {
  req.body.runRedTeamTest = false;
  return processAIPipelineAndUpload(req, res);
}

/**
 * Secure AI generation endpoint (with red team testing)
 */
async function secureAIGeneration(req, res) {
  req.body.runRedTeamTest = true;
  return processAIPipelineAndUpload(req, res);
}

/**
 * Get AI pipeline status and capabilities
 */
async function getAIPipelineInfo(req, res) {
  return res.json({
    success: true,
    pipeline: {
      name: 'Overlook AI Pipeline',
      version: '1.0.0',
      stages: [
        {
          stage: 1,
          name: 'Prompt Refinement',
          model: 'Gemini 1.5 Flash',
          description: 'Analyzes and refines user prompts for clarity and specificity'
        },
        {
          stage: 2, 
          name: 'Code Generation',
          model: 'GPT-4o',
          description: 'Generates functional, well-structured code based on refined prompts'
        },
        {
          stage: 3,
          name: 'Code Debugging',
          model: 'Mistral Large',
          description: 'Analyzes code for bugs, improves quality and performance'
        },
        {
          stage: 4,
          name: 'Security Analysis',
          model: 'Llama 3.3 70B',
          description: 'Performs security vulnerability testing and code finalization'
        }
      ],
      capabilities: [
        'Multi-model AI pipeline',
        'Automatic file generation',
        'Security vulnerability testing',
        'Room integration',
        'Real-time collaboration support'
      ],
      endpoints: {
        quick: '/api/ai/generate',
        secure: '/api/ai/generate-secure', 
        info: '/api/ai/info'
      }
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Create an intelligent fallback response based on the prompt
 */
function createFallbackResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  let files = {};
  
  if (lowerPrompt.includes('website') || lowerPrompt.includes('web') || lowerPrompt.includes('html')) {
    files = {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Welcome to Your Website</h1>
    </header>
    <main>
        <p>This website was generated based on your prompt: "${prompt}"</p>
        <button onclick="sayHello()">Click Me!</button>
    </main>
    <script src="script.js"></script>
</body>
</html>`,
      "style.css": `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

header {
    text-align: center;
    background-color: #333;
    color: white;
    padding: 20px;
    border-radius: 8px;
}

main {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #0056b3;
}`,
      "script.js": `function sayHello() {
    alert('Hello! This website was generated by AI!');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
});`
    };
  } else if (lowerPrompt.includes('react') || lowerPrompt.includes('component')) {
    files = {
      "App.jsx": `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Generated React App</h1>
        <p>Prompt: "${prompt}"</p>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      </header>
    </div>
  );
}

export default App;`,
      "App.css": `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

button {
  background-color: #61dafb;
  border: none;
  color: black;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #21a6c4;
}`
    };
  } else {
    files = {
      "main.js": `// Generated code for: ${prompt}
console.log("Hello World!");

function main() {
    // TODO: Implement functionality based on: ${prompt}
    console.log("This is a fallback response");
}

main();`,
      "README.md": `# Generated Project

This project was generated based on your prompt: "${prompt}"

## Getting Started

1. Review the generated files
2. Modify as needed for your specific requirements
3. Add additional functionality as desired

## Note

This is a fallback response. For better results, try being more specific in your prompt.`
    };
  }
  
  return {
    success: true,
    files: files
  };
}

module.exports = {
  processAIPipelineAndUpload,
  quickAIGeneration,
  secureAIGeneration,
  getAIPipelineInfo,
  endToEndAIGeneration
};
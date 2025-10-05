const express = require('express');
const {
  agentChainHandler,
  agentChainWithRedTeamHandler,
  geminiHandler
} = require('../controllers/ModelController');
const {
  quickAIGeneration,
  secureAIGeneration,
  getAIPipelineInfo,
  endToEndAIGeneration
} = require('../services/AIService');

const router = express.Router();

// ===== END-TO-END AI PIPELINE =====

// Complete end-to-end AI generation with time estimates
router.post('/generate-complete', endToEndAIGeneration);

// ===== ENHANCED AI PIPELINE ENDPOINTS =====

// Get AI pipeline information and capabilities
router.get('/info', getAIPipelineInfo);

// Quick AI generation (Gemini → GPT-4o → Mistral → Llama) + auto file upload
router.post('/generate', quickAIGeneration);

// Secure AI generation (includes red team security testing) + auto file upload  
router.post('/generate-secure', secureAIGeneration);

// ===== DIRECT MODEL ENDPOINTS =====

// Direct access to the full agent chain (no auth required)
router.post('/agent-chain', agentChainHandler);

// Direct access to agent chain with red team testing (no auth required)
router.post('/agent-chain-redteam', agentChainWithRedTeamHandler);

// ===== LEGACY ENDPOINTS =====

// Legacy Gemini endpoint for backward compatibility (no auth required)
router.post('/gemini', geminiHandler);

module.exports = router;


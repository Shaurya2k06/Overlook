const express = require("express");
const {
  geminiHandler,
  agentChainHandler,
  agentChainWithRedTeamHandler,
} = require("../controllers/ModelController");
const { redTeamAuditMultiple } = require("../controllers/RedTeamController");

const router = express.Router();

// New 4-agent chain endpoint
router.post("/agent-chain", agentChainHandler);

// Combined agent chain + red team testing endpoint
router.post("/agent-chain-with-redteam", agentChainWithRedTeamHandler);

// Red team testing for multiple files (generated code)
router.post("/redteam-multiple", redTeamAuditMultiple);

// Legacy gemini endpoint (backward compatibility)
router.post("/gemini", geminiHandler);

module.exports = router;

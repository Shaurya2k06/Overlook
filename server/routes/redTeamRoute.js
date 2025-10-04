const express = require("express");
const {
  redTeamAudit,
  redTeamAuditMultiple,
} = require("../controllers/RedTeamController");

const router = express.Router();

// POST /api/redteam/audit - Perform security audit on single code file
router.post("/audit", redTeamAudit);

// POST /api/redteam/audit-multiple - Perform security audit on multiple files
router.post("/audit-multiple", redTeamAuditMultiple);

module.exports = router;

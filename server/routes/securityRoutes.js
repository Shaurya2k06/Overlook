const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const SecurityController = require("../controllers/SecurityController");
const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common code file types
    const allowedTypes = [
      '.js', '.jsx', '.ts', '.tsx', '.php', '.html', '.htm', '.css',
      '.json', '.xml', '.sql', '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.go', '.rb', '.vue', '.asp', '.aspx', '.txt'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed for security testing`), false);
    }
  }
});

// Middleware for request validation
const validateExploitRequest = [
  body("target").isURL().withMessage("Valid target URL is required"),
  body("options")
    .optional()
    .isObject()
    .withMessage("Options must be an object"),
];

const validateSuiteRequest = [
  body("target").isURL().withMessage("Valid target URL is required"),
  body("selectedExploits")
    .optional()
    .isArray()
    .withMessage("Selected exploits must be an array"),
  body("options")
    .optional()
    .isObject()
    .withMessage("Options must be an object"),
];

// Security dashboard endpoint
router.get("/dashboard", async (req, res) => {
  try {
    await SecurityController.getDashboard(req, res);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load security dashboard",
    });
  }
});

// Run individual exploit
router.post(
  "/exploit/:exploitName",
  validateExploitRequest,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { exploitName } = req.params;
      const { target, options = {} } = req.body;

      // Security check - only allow testing against allowed domains
      const allowedDomains = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "dvwa-test-app",
        "vulnerable-test-app",
        "webgoat",
        "testphp.vulnweb.com",
        "demo.testfire.net",
      ];

      const url = new URL(target);
      const isAllowedDomain = allowedDomains.some(
        (domain) => url.hostname === domain || url.hostname.includes(domain),
      );

      if (!isAllowedDomain && !options.bypassDomainCheck) {
        return res.status(403).json({
          success: false,
          error: "Target domain not allowed for security testing",
          allowedDomains,
          hint: "Use bypassDomainCheck option if testing is authorized",
        });
      }

      // Add exploit name to request body
      req.body.exploitName = exploitName;

      await SecurityController.runExploit(req, res);
    } catch (error) {
      console.error(`Error running ${req.params.exploitName} exploit:`, error);
      res.status(500).json({
        success: false,
        error: "Exploit execution failed",
        details: error.message,
      });
    }
  },
);

// Run comprehensive security suite
router.post("/suite", validateSuiteRequest, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { target, selectedExploits = [], options = {} } = req.body;

    // Security check - only allow testing against allowed domains
    const allowedDomains = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "dvwa-test-app",
      "vulnerable-test-app",
      "webgoat",
      "testphp.vulnweb.com",
      "demo.testfire.net",
    ];

    const url = new URL(target);
    const isAllowedDomain = allowedDomains.some(
      (domain) => url.hostname === domain || url.hostname.includes(domain),
    );

    if (!isAllowedDomain && !options.bypassDomainCheck) {
      return res.status(403).json({
        success: false,
        error: "Target domain not allowed for security testing",
        allowedDomains,
        hint: "Use bypassDomainCheck option if testing is authorized",
      });
    }

    await SecurityController.runSecuritySuite(req, res);
  } catch (error) {
    console.error("Error running security suite:", error);
    res.status(500).json({
      success: false,
      error: "Security suite execution failed",
      details: error.message,
    });
  }
});

// Get scan status
router.get("/scan/:scanId/status", async (req, res) => {
  try {
    await SecurityController.getScanStatus(req, res);
  } catch (error) {
    console.error("Error getting scan status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get scan status",
    });
  }
});

// Get scan results
router.get("/results", async (req, res) => {
  try {
    await SecurityController.getScanResults(req, res);
  } catch (error) {
    console.error("Error getting scan results:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get scan results",
    });
  }
});

// Get exploit information
router.get("/exploit/:exploitName/info", async (req, res) => {
  try {
    await SecurityController.getExploitInfo(req, res);
  } catch (error) {
    console.error("Error getting exploit info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get exploit information",
    });
  }
});

// Generate security report
router.get("/report/:scanId", async (req, res) => {
  try {
    await SecurityController.generateReport(req, res);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate report",
    });
  }
});

// Get available exploits list
router.get("/exploits", async (req, res) => {
  try {
    const exploits = SecurityController.getExploitsList();
    res.json({
      success: true,
      data: {
        exploits,
        total: exploits.length,
        categories: [...new Set(exploits.map((e) => e.category))],
      },
    });
  } catch (error) {
    console.error("Error getting exploits list:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get exploits list",
    });
  }
});

// SQL Injection specific endpoint
router.post("/sql-injection", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "sqlInjection";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("SQL injection test error:", error);
    res.status(500).json({
      success: false,
      error: "SQL injection test failed",
    });
  }
});

// XSS specific endpoint
router.post("/xss", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "xss";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("XSS test error:", error);
    res.status(500).json({
      success: false,
      error: "XSS test failed",
    });
  }
});

// CSRF specific endpoint
router.post("/csrf", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "csrf";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("CSRF test error:", error);
    res.status(500).json({
      success: false,
      error: "CSRF test failed",
    });
  }
});

// Authentication bypass specific endpoint
router.post("/auth-bypass", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "authBypass";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("Auth bypass test error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication bypass test failed",
    });
  }
});

// Directory traversal specific endpoint
router.post(
  "/directory-traversal",
  validateExploitRequest,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      req.body.exploitName = "directoryTraversal";
      await SecurityController.runExploit(req, res);
    } catch (error) {
      console.error("Directory traversal test error:", error);
      res.status(500).json({
        success: false,
        error: "Directory traversal test failed",
      });
    }
  },
);

// Command injection specific endpoint
router.post("/command-injection", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "commandInjection";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("Command injection test error:", error);
    res.status(500).json({
      success: false,
      error: "Command injection test failed",
    });
  }
});

// Network scan specific endpoint
router.post("/network-scan", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "networkScanner";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("Network scan error:", error);
    res.status(500).json({
      success: false,
      error: "Network scan failed",
    });
  }
});

// SSL/TLS analysis specific endpoint
router.post("/ssl-analysis", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "sslAnalyzer";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("SSL analysis error:", error);
    res.status(500).json({
      success: false,
      error: "SSL analysis failed",
    });
  }
});

// Web vulnerability scan specific endpoint
router.post("/web-vuln-scan", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "webVulnScanner";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("Web vulnerability scan error:", error);
    res.status(500).json({
      success: false,
      error: "Web vulnerability scan failed",
    });
  }
});

// Buffer overflow specific endpoint
router.post("/buffer-overflow", validateExploitRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    req.body.exploitName = "bufferOverflow";
    await SecurityController.runExploit(req, res);
  } catch (error) {
    console.error("Buffer overflow test error:", error);
    res.status(500).json({
      success: false,
      error: "Buffer overflow test failed",
    });
  }
});

// System health check
router.get("/health", async (req, res) => {
  try {
    const systemHealth = await SecurityController.getSystemHealth();
    res.json({
      success: true,
      data: {
        status: "healthy",
        exploits: SecurityController.getExploitsList().length,
        systemHealth,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: "Security system unhealthy",
      details: error.message,
    });
  }
});

// Get vulnerability statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      exploitsAvailable: SecurityController.getExploitsList().length,
      activeScans: SecurityController.activeScans.size,
      completedScans: Object.keys(SecurityController.scanResults).length,
      vulnerabilitySummary: SecurityController.getVulnerabilitySummary(),
      lastScanTime: SecurityController.getLastScanTime(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting security stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get security statistics",
    });
  }
});

// File upload endpoint
router.post("/upload", upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded"
      });
    }

    const uploadedFiles = req.files.map(file => ({
      id: SecurityController.generateDeterministicFileId(file.filename),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadTime: new Date()
    }));

    // Store file info in SecurityController for scanning
    SecurityController.addUploadedFiles(uploadedFiles);

    res.json({
      success: true,
      data: {
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles.map(f => ({
          id: f.id,
          name: f.originalName,
          size: f.size,
          type: f.mimetype
        })),
        totalFiles: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      error: "File upload failed",
      details: error.message
    });
  }
});

// Get uploaded files
router.get("/files", async (req, res) => {
  try {
    const files = SecurityController.getUploadedFiles();
    res.json({
      success: true,
      data: {
        files: files.map(f => ({
          id: f.id,
          name: f.originalName,
          size: f.size,
          type: f.mimetype,
          uploadTime: f.uploadTime
        })),
        totalFiles: files.length
      }
    });
  } catch (error) {
    console.error("Error getting uploaded files:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get uploaded files"
    });
  }
});

// Delete uploaded file
router.delete("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = SecurityController.removeUploadedFile(fileId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          message: "File deleted successfully",
          fileId: fileId,
          fileName: result.file.originalName
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || "File not found"
      });
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file"
    });
  }
});

// Scan uploaded files endpoint
router.post("/scan-files", async (req, res) => {
  try {
    const { selectedExploits = [], options = {} } = req.body;
    const files = SecurityController.getUploadedFiles();

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files available for scanning"
      });
    }

    if (selectedExploits.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please select at least one exploit to run"
      });
    }

    const scanId = `file_scan_${Date.now()}`;
    const results = [];

    // Clear previous results once at the start of the scan session
    SecurityController.clearPreviousResults();

    // Run selected exploits on uploaded files
    for (const exploitName of selectedExploits) {
      try {
        const result = await SecurityController.scanUploadedFiles(exploitName, files, {
          ...options,
          scanId: `${scanId}_${exploitName}`,
          clearPrevious: false
        });
        results.push(result);
      } catch (error) {
        console.error(`Error running ${exploitName} on files:`, error);
        results.push({
          exploitName,
          target: 'uploaded-files',
          vulnerabilities: [],
          error: error.message,
          scanId: `${scanId}_${exploitName}`,
          timestamp: new Date(),
          duration: 0
        });
      }
    }

    res.json({
      success: true,
      data: {
        message: `File scan completed with ${selectedExploits.length} exploits`,
        results: results,
        totalFiles: files.length,
        totalExploits: selectedExploits.length,
        suiteId: scanId,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("File scanning error:", error);
    res.status(500).json({
      success: false,
      error: "File scanning failed",
      details: error.message
    });
  }
});

// Clear all scan results endpoint
router.delete("/results", async (req, res) => {
  try {
    SecurityController.clearAllResults();
    res.json({
      success: true,
      data: {
        message: "All scan results cleared successfully",
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("Error clearing results:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear scan results"
    });
  }
});

// Clear results for specific scan session
router.delete("/results/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = SecurityController.clearSessionResults(sessionId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          message: `Results for session ${sessionId} cleared successfully`,
          clearedCount: result.count
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Session not found"
      });
    }
  } catch (error) {
    console.error("Error clearing session results:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear session results"
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: "File too large (max 10MB)"
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: "Too many files (max 10)"
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: "Unexpected file field"
      });
    }
  }

  console.error("Security route error:", error);
  res.status(500).json({
    success: false,
    error: "Security testing service error",
    details: error.message,
  });
});

module.exports = router;

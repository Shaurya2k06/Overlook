const mongoose = require('mongoose');

// Schema for individual vulnerabilities
const VulnerabilitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    index: true
  },
  location: {
    type: String,
    required: true
  },
  payload: {
    type: String,
    required: false
  },
  evidence: {
    type: String,
    required: false
  },
  line: {
    type: Number,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  recommendation: {
    type: String,
    required: false
  },
  cwe: {
    type: String,
    required: false
  },
  owasp: {
    type: String,
    required: false
  }
}, { _id: false });

// Schema for security scan results
const SecurityScanSchema = new mongoose.Schema({
  scanId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  exploitName: {
    type: String,
    required: true,
    index: true
  },
  target: {
    type: String,
    required: true,
    index: true
  },
  scanType: {
    type: String,
    required: true,
    enum: ['url', 'file', 'suite'],
    default: 'url',
    index: true
  },
  vulnerabilities: [VulnerabilitySchema],
  filesScanned: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    required: true,
    default: 0
  },
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  error: {
    type: String,
    required: false
  },
  options: {
    timeout: Number,
    maxDepth: Number,
    aggressive: Boolean,
    userAgent: String,
    custom: mongoose.Schema.Types.Mixed
  },
  metadata: {
    userIP: String,
    userAgent: String,
    sessionId: String,
    source: {
      type: String,
      default: 'web-interface'
    }
  },
  statistics: {
    totalVulnerabilities: {
      type: Number,
      default: 0
    },
    criticalCount: {
      type: Number,
      default: 0
    },
    highCount: {
      type: Number,
      default: 0
    },
    mediumCount: {
      type: Number,
      default: 0
    },
    lowCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  collection: 'security_scans'
});

// Schema for uploaded files metadata
const UploadedFileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  filePath: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  extension: {
    type: String,
    required: true,
    index: true
  },
  checksum: {
    type: String,
    required: false
  },
  scanStatus: {
    type: String,
    enum: ['pending', 'scanning', 'completed', 'error'],
    default: 'pending',
    index: true
  },
  scanResults: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecurityScan'
  }],
  metadata: {
    language: String,
    framework: String,
    linesOfCode: Number,
    fileType: String,
    encoding: String
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  collection: 'uploaded_files'
});

// Schema for audit logs
const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'debug'],
    default: 'info',
    index: true
  },
  source: {
    type: String,
    required: true,
    default: 'SecurityController'
  },
  userId: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  relatedS
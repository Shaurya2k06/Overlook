const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

// Import individual exploit modules
const SQLInjectionExploit = require('../security/exploits/SQLInjectionExploit');
const XSSExploit = require('../security/exploits/XSSExploit');
const CSRFExploit = require('../security/exploits/CSRFExploit');
const AuthBypassExploit = require('../security/exploits/AuthBypassExploit');
const DirectoryTraversalExploit = require('../security/exploits/DirectoryTraversalExploit');
const CommandInjectionExploit = require('../security/exploits/CommandInjectionExploit');
const NetworkScannerExploit = require('../security/exploits/NetworkScannerExploit');
const SSLAnalyzerExploit = require('../security/exploits/SSLAnalyzerExploit');
const WebVulnScannerExploit = require('../security/exploits/WebVulnScannerExploit');
const BufferOverflowExploit = require('../security/exploits/BufferOverflowExploit');

const execAsync = util.promisify(exec);

class SecurityController {
    constructor() {
        this.exploits = {
            sqlInjection: new SQLInjectionExploit(),
            xss: new XSSExploit(),
            csrf: new CSRFExploit(),
            authBypass: new AuthBypassExploit(),
            directoryTraversal: new DirectoryTraversalExploit(),
            commandInjection: new CommandInjectionExploit(),
            networkScanner: new NetworkScannerExploit(),
            sslAnalyzer: new SSLAnalyzerExploit(),
            webVulnScanner: new WebVulnScannerExploit(),
            bufferOverflow: new BufferOverflowExploit()
        };

        this.auditLogs = [];
        this.scanResults = {};
        this.activeScans = new Map();
        this.uploadedFiles = [];

        // Auto-populate uploaded files from uploads directory on startup
        this.loadUploadedFilesFromDisk();
    }

    // File management methods
    addUploadedFiles(files) {
        this.uploadedFiles.push(...files);
        this.logAudit('FILE_UPLOAD', `Added ${files.length} files for security testing`);
    }

    getUploadedFiles() {
        return this.uploadedFiles;
    }

    removeUploadedFile(fileId) {
        try {
            const fileIndex = this.uploadedFiles.findIndex(f => f.id === fileId);
            if (fileIndex !== -1) {
                const removedFile = this.uploadedFiles.splice(fileIndex, 1)[0];

                // Try to delete the physical file
                try {
                    if (removedFile.path && fs.existsSync(removedFile.path)) {
                        fs.unlinkSync(removedFile.path);
                        this.logAudit('FILE_DELETE', `Successfully deleted file: ${removedFile.originalName} (${removedFile.path})`);
                    } else {
                        this.logAudit('FILE_DELETE', `File not found on disk: ${removedFile.originalName} (${removedFile.path})`);
                    }
                } catch (physicalDeleteError) {
                    console.error('Error deleting physical file:', physicalDeleteError);
                    this.logAudit('FILE_DELETE_ERROR', `Failed to delete physical file: ${removedFile.originalName} - ${physicalDeleteError.message}`);
                    // Continue with logical removal even if physical deletion fails
                }

                return { success: true, file: removedFile };
            }

            this.logAudit('FILE_DELETE_ERROR', `File not found in memory: ${fileId}`);
            return { success: false, error: 'File not found in uploaded files list' };

        } catch (error) {
            console.error('Error in removeUploadedFile:', error);
            this.logError('File Removal Error', error);
            return { success: false, error: error.message };
        }
    }

    loadUploadedFilesFromDisk() {
        try {
            const uploadsDir = path.join(__dirname, '..', 'uploads');

            // Check if uploads directory exists
            if (!fs.existsSync(uploadsDir)) {
                console.log('Uploads directory does not exist, creating it...');
                fs.mkdirSync(uploadsDir, { recursive: true });
                return;
            }

            // Read all files from uploads directory
            const files = fs.readdirSync(uploadsDir);

            if (files.length === 0) {
                console.log('No uploaded files found in uploads directory');
                return;
            }

            // Convert physical files to uploadedFiles format
            const loadedFiles = [];
            for (const filename of files) {
                const filePath = path.join(uploadsDir, filename);
                const stats = fs.statSync(filePath);

                // Extract original name from filename format: timestamp-random-originalname
                const parts = filename.split('-');
                let originalName = filename;
                if (parts.length >= 3) {
                    originalName = parts.slice(2).join('-');
                }

                const fileInfo = {
                    id: this.generateDeterministicFileId(filename),
                    originalName: originalName,
                    filename: filename,
                    path: filePath,
                    size: stats.size,
                    mimetype: this.getMimeType(originalName),
                    uploadTime: stats.birthtime || stats.ctime
                };

                loadedFiles.push(fileInfo);
            }

            this.uploadedFiles = loadedFiles;
            console.log(`✅ Loaded ${loadedFiles.length} files from uploads directory for security scanning`);
            this.logAudit('SYSTEM_STARTUP', `Auto-loaded ${loadedFiles.length} uploaded files from disk`);

        } catch (error) {
            console.error('Error loading uploaded files from disk:', error);
            this.logError('File Loading Error', error);
        }
    }

    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.js': 'application/javascript',
            '.php': 'application/x-php',
            '.py': 'text/x-python',
            '.c': 'text/x-c',
            '.cpp': 'text/x-c++',
            '.java': 'text/x-java',
            '.html': 'text/html',
            '.css': 'text/css',
            '.txt': 'text/plain',
            '.sql': 'application/sql',
            '.xml': 'application/xml',
            '.json': 'application/json'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    generateDeterministicFileId(filename) {
        // Create a deterministic ID based on filename hash
        // This ensures the same file always gets the same ID across server restarts
        const hash = crypto.createHash('md5').update(filename).digest('hex');
        return `file_${hash.substring(0, 16)}`;
    }

    async scanUploadedFiles(exploitName, files, options = {}) {
        const scanId = options.scanId || `file_scan_${Date.now()}`;
        const vulnerabilities = [];
        const startTime = Date.now();

        try {
            // Clear previous results only for single exploit scans, not multi-exploit sessions
            if (options.clearPrevious !== false) {
                this.clearPreviousResults();
            }
            this.logAudit('FILE_SCAN_START', `Starting ${exploitName} scan on ${files.length} files`);

            for (const file of files) {
                try {
                    const fileContent = fs.readFileSync(file.path, 'utf8');
                    const fileVulns = await this.analyzeFileContent(exploitName, file, fileContent);
                    vulnerabilities.push(...fileVulns);
                } catch (error) {
                    console.error(`Error scanning file ${file.originalName}:`, error);
                    // Continue with other files
                }
            }

            const result = {
                exploitName,
                target: 'uploaded-files',
                vulnerabilities,
                scanId,
                timestamp: new Date(),
                duration: Date.now() - startTime,
                filesScanned: files.length
            };

            // Store result
            this.scanResults[scanId] = result;
            this.logAudit('FILE_SCAN_COMPLETE', `${exploitName} scan completed - ${vulnerabilities.length} vulnerabilities found`);

            return result;
        } catch (error) {
            this.logAudit('FILE_SCAN_ERROR', `${exploitName} scan failed: ${error.message}`);
            throw error;
        }
    }

    async analyzeFileContent(exploitName, file, content) {
        const vulnerabilities = [];
        const fileName = file.originalName;
        const fileExt = path.extname(fileName).toLowerCase();

        switch (exploitName) {
            case 'sqlInjection':
                vulnerabilities.push(...this.detectSQLInjection(content, fileName));
                break;
            case 'xss':
                vulnerabilities.push(...this.detectXSS(content, fileName));
                break;
            case 'commandInjection':
                vulnerabilities.push(...this.detectCommandInjection(content, fileName));
                break;
            case 'directoryTraversal':
                vulnerabilities.push(...this.detectDirectoryTraversal(content, fileName));
                break;
            case 'csrf':
                vulnerabilities.push(...this.detectCSRF(content, fileName));
                break;
            case 'authBypass':
                vulnerabilities.push(...this.detectAuthBypass(content, fileName));
                break;
            default:
                // Generic pattern matching for other exploits
                vulnerabilities.push(...this.detectGenericVulnerabilities(content, fileName, exploitName));
        }

        return vulnerabilities;
    }

    detectSQLInjection(content, fileName) {
        const vulnerabilities = [];
        const patterns = [
            /\$_[GET|POST|REQUEST]\[.*?\].*?(?:mysql_query|mysqli_query|query)\(/gi,
            /SELECT.*?FROM.*?\$_[GET|POST|REQUEST]/gi,
            /WHERE.*?=.*?\$_[GET|POST|REQUEST]/gi,
            /execute\(.*?\$_[GET|POST|REQUEST]/gi,
            /\bUNION\b.*?\bSELECT\b/gi,
            /\'\s*OR\s*\'1\'\s*=\s*\'1/gi
        ];

        patterns.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    vulnerabilities.push({
                        type: 'SQL Injection',
                        severity: 'high',
                        location: fileName,
                        payload: match.substring(0, 100),
                        evidence: `Potential SQL injection vulnerability detected`,
                        line: this.getLineNumber(content, match)
                    });
                });
            }
        });

        return vulnerabilities;
    }

    detectXSS(content, fileName) {
        const vulnerabilities = [];
        const patterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=\s*[\"'][^\"']*[\"']/gi,
            /\$_[GET|POST|REQUEST]\[.*?\].*?echo/gi,
            /document\.write\(/gi,
            /innerHTML\s*=\s*.*?\$_[GET|POST|REQUEST]/gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    vulnerabilities.push({
                        type: 'Cross-Site Scripting (XSS)',
                        severity: 'medium',
                        location: fileName,
                        payload: match.substring(0, 100),
                        evidence: `Potential XSS vulnerability detected`,
                        line: this.getLineNumber(content, match)
                    });
                });
            }
        });

        return vulnerabilities;
    }

    detectCommandInjection(content, fileName) {
        const vulnerabilities = [];
        const patterns = [
            /exec\(.*?\$_[GET|POST|REQUEST]/gi,
            /system\(.*?\$_[GET|POST|REQUEST]/gi,
            /shell_exec\(.*?\$_[GET|POST|REQUEST]/gi,
            /passthru\(.*?\$_[GET|POST|REQUEST]/gi,
            /eval\(.*?\$_[GET|POST|REQUEST]/gi,
            /Runtime\.getRuntime\(\)\.exec\(/gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    vulnerabilities.push({
                        type: 'Command Injection',
                        severity: 'critical',
                        location: fileName,
                        payload: match.substring(0, 100),
                        evidence: `Potential command injection vulnerability detected`,
                        line: this.getLineNumber(content, match)
                    });
                });
            }
        });

        return vulnerabilities;
    }

    detectDirectoryTraversal(content, fileName) {
        const vulnerabilities = [];
        const patterns = [
            /\.\.[\/\\]/g,
            /\$_[GET|POST|REQUEST]\[.*?\].*?include/gi,
            /\$_[GET|POST|REQUEST]\[.*?\].*?require/gi,
            /file_get_contents\(.*?\$_[GET|POST|REQUEST]/gi,
            /fopen\(.*?\$_[GET|POST|REQUEST]/gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    vulnerabilities.push({
                        type: 'Directory Traversal',
                        severity: 'high',
                        location: fileName,
                        payload: match.substring(0, 100),
                        evidence: `Potential directory traversal vulnerability detected`,
                        line: this.getLineNumber(content, match)
                    });
                });
            }
        });

        return vulnerabilities;
    }

    detectCSRF(content, fileName) {
        const vulnerabilities = [];

        // Check for forms without CSRF protection
        const formPattern = /<form[^>]*>/gi;
        const tokenPattern = /csrf_token|_token|authenticity_token/gi;

        const forms = content.match(formPattern);
        if (forms) {
            forms.forEach(form => {
                if (!tokenPattern.test(content)) {
                    vulnerabilities.push({
                        type: 'Cross-Site Request Forgery (CSRF)',
                        severity: 'medium',
                        location: fileName,
                        payload: form.substring(0, 100),
                        evidence: `Form found without CSRF protection`,
                        line: this.getLineNumber(content, form)
                    });
                }
            });
        }

        return vulnerabilities;
    }

    detectAuthBypass(content, fileName) {
        const vulnerabilities = [];
        const patterns = [
            /if\s*\(\s*\$_[GET|POST|REQUEST]\[.*?\]\s*==\s*[\"']admin[\"']\s*\)/gi,
            /if\s*\(\s*\$password\s*==\s*[\"'][^\"']*[\"']\s*\)/gi,
            /login\s*=\s*true/gi,
            /authenticated\s*=\s*true/gi,
            /admin\s*=\s*1/gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    vulnerabilities.push({
                        type: 'Authentication Bypass',
                        severity: 'critical',
                        location: fileName,
                        payload: match.substring(0, 100),
                        evidence: `Potential authentication bypass detected`,
                        line: this.getLineNumber(content, match)
                    });
                });
            }
        });

        return vulnerabilities;
    }

    detectGenericVulnerabilities(content, fileName, exploitType) {
        const vulnerabilities = [];

        // Generic security patterns
        const patterns = {
            'bufferOverflow': [/strcpy\(/gi, /strcat\(/gi, /sprintf\(/gi],
            'webVulnScanner': [/\$_[GET|POST|REQUEST]/gi, /<script/gi, /eval\(/gi],
            'networkScanner': [/socket\(/gi, /connect\(/gi, /bind\(/gi],
            'sslAnalyzer': [/ssl/gi, /tls/gi, /https/gi]
        };

        const typePatterns = patterns[exploitType] || [];
        typePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    vulnerabilities.push({
                        type: `${exploitType} vulnerability`,
                        severity: 'low',
                        location: fileName,
                        payload: match.substring(0, 100),
                        evidence: `Potential ${exploitType} issue detected`,
                        line: this.getLineNumber(content, match)
                    });
                });
            }
        });

        return vulnerabilities;
    }

    getLineNumber(content, searchText) {
        const lines = content.substring(0, content.indexOf(searchText)).split('\n');
        return lines.length;
    }

    // Main security dashboard endpoint
    async getDashboard(req, res) {
        try {
            const dashboard = {
                overview: {
                    totalExploits: Object.keys(this.exploits).length,
                    activeScans: this.activeScans.size,
                    completedScans: Object.keys(this.scanResults).length,
                    criticalVulnerabilities: this.getCriticalVulnerabilityCount(),
                    lastScanTime: this.getLastScanTime()
                },
                exploits: this.getExploitsList(),
                recentScans: this.getRecentScans(),
                vulnerabilitySummary: this.getVulnerabilitySummary(),
                systemHealth: await this.getSystemHealth()
            };

            res.json({
                success: true,
                data: dashboard
            });
        } catch (error) {
            this.logError('Dashboard Error', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load security dashboard'
            });
        }
    }

    // Run individual exploit
    async runExploit(req, res) {
        try {
            const { exploitName, target, options = {} } = req.body;

            if (!this.exploits[exploitName]) {
                return res.status(400).json({
                    success: false,
                    error: `Exploit '${exploitName}' not found`
                });
            }

            // Clear previous results before starting new exploit
            this.clearPreviousResults();

            const scanId = this.generateScanId();
            this.activeScans.set(scanId, {
                exploitName,
                target,
                startTime: new Date(),
                status: 'running'
            });

            // Run exploit asynchronously
            this.executeExploit(scanId, exploitName, target, options)
                .then(result => {
                    this.scanResults[scanId] = result;
                    this.activeScans.delete(scanId);
                    this.logAudit('exploit_completed', { scanId, exploitName, target });
                })
                .catch(error => {
                    this.scanResults[scanId] = {
                        success: false,
                        error: error.message,
                        exploitName,
                        target,
                        timestamp: new Date()
                    };
                    this.activeScans.delete(scanId);
                    this.logError('Exploit Error', error);
                });

            res.json({
                success: true,
                scanId,
                message: `Exploit '${exploitName}' started`,
                estimatedTime: this.getEstimatedTime(exploitName)
            });

        } catch (error) {
            this.logError('Run Exploit Error', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start exploit'
            });
        }
    }

    // Run comprehensive security suite
    async runSecuritySuite(req, res) {
        try {
            const { target, selectedExploits = [], options = {} } = req.body;

            if (selectedExploits.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No exploits selected for testing'
                });
            }

            // Clear previous results before starting new suite
            this.clearPreviousResults();

            const suiteId = this.generateScanId();
            const exploitsToRun = selectedExploits.length > 0 ?
                selectedExploits : Object.keys(this.exploits);

            this.activeScans.set(suiteId, {
                type: 'suite',
                target,
                exploits: exploitsToRun,
                startTime: new Date(),
                status: 'running',
                progress: 0
            });

            // Run security suite asynchronously
            this.executeSecuritySuite(suiteId, target, exploitsToRun, options)
                .then(results => {
                    this.scanResults[suiteId] = {
                        success: true,
                        type: 'suite',
                        target,
                        results,
                        summary: this.generateSuiteSummary(results),
                        timestamp: new Date()
                    };
                    this.activeScans.delete(suiteId);
                    this.logAudit('security_suite_completed', { suiteId, target });
                })
                .catch(error => {
                    this.scanResults[suiteId] = {
                        success: false,
                        error: error.message,
                        target,
                        timestamp: new Date()
                    };
                    this.activeScans.delete(suiteId);
                    this.logError('Security Suite Error', error);
                });

            res.json({
                success: true,
                suiteId,
                message: 'Security suite started',
                exploitsCount: exploitsToRun.length,
                estimatedTime: this.getEstimatedSuiteTime(exploitsToRun)
            });

        } catch (error) {
            this.logError('Run Security Suite Error', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start security suite'
            });
        }
    }

    // Get scan status
    async getScanStatus(req, res) {
        try {
            const { scanId } = req.params;

            // Check if scan is active
            if (this.activeScans.has(scanId)) {
                const activeScan = this.activeScans.get(scanId);
                return res.json({
                    success: true,
                    status: 'running',
                    data: activeScan
                });
            }

            // Check if scan is completed
            if (this.scanResults[scanId]) {
                return res.json({
                    success: true,
                    status: 'completed',
                    data: this.scanResults[scanId]
                });
            }

            res.status(404).json({
                success: false,
                error: 'Scan not found'
            });

        } catch (error) {
            this.logError('Get Scan Status Error', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get scan status'
            });
        }
    }

    // Get all scan results
    async getScanResults(req, res) {
        try {
            const { limit = 50, offset = 0, type } = req.query;

            let results = Object.entries(this.scanResults).map(([id, result]) => ({
                id,
                ...result
            }));

            if (type) {
                results = results.filter(result => result.type === type);
            }

            results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            const paginatedResults = results.slice(offset, offset + parseInt(limit));

            res.json({
                success: true,
                data: {
                    results: paginatedResults,
                    total: results.length,
                    offset: parseInt(offset),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            this.logError('Get Scan Results Error', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get scan results'
            });
        }
    }

    // Get exploit information
    async getExploitInfo(req, res) {
        try {
            const { exploitName } = req.params;

            if (!this.exploits[exploitName]) {
                return res.status(404).json({
                    success: false,
                    error: `Exploit '${exploitName}' not found`
                });
            }

            const exploitInfo = await this.exploits[exploitName].getInfo();

            res.json({
                success: true,
                data: exploitInfo
            });

        } catch (error) {
            this.logError('Get Exploit Info Error', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get exploit information'
            });
        }
    }

    // Generate security report
    async generateReport(req, res) {
        try {
            const { scanId, format = 'json' } = req.params;

            if (!this.scanResults[scanId]) {
                return res.status(404).json({
                    success: false,
                    error: 'Scan results not found'
                });
            }

            const result = this.scanResults[scanId];
            const report = this.generateDetailedReport(result);

            if (format === 'pdf') {
                // Generate PDF report
                const pdfBuffer = await this.generatePDFReport(report);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="security-report-${scanId}.pdf"`);
                res.send(pdfBuffer);
            } else if (format === 'html') {
                // Generate HTML report
                const htmlReport = this.generateHTMLReport(report);
                res.setHeader('Content-Type', 'text/html');
                res.send(htmlReport);
            } else {
                // JSON report (default)
                res.json({
                    success: true,
                    data: report
                });
            }

        } catch (error) {
            this.logError('Generate Report Error', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate report'
            });
        }
    }

    // Execute individual exploit
    async executeExploit(scanId, exploitName, target, options) {
        try {
            const exploit = this.exploits[exploitName];
            const result = await exploit.execute(target, options);

            return {
                success: true,
                scanId,
                exploitName,
                target,
                result,
                timestamp: new Date(),
                executionTime: this.calculateExecutionTime(scanId)
            };
        } catch (error) {
            throw new Error(`Exploit execution failed: ${error.message}`);
        }
    }

    // Execute security suite
    async executeSecuritySuite(suiteId, target, exploits, options) {
        const results = {};
        const totalExploits = exploits.length;

        for (let i = 0; i < exploits.length; i++) {
            const exploitName = exploits[i];

            try {
                // Update progress
                const progress = Math.round(((i + 1) / totalExploits) * 100);
                this.updateScanProgress(suiteId, progress);

                const result = await this.exploits[exploitName].execute(target, options);
                results[exploitName] = {
                    success: true,
                    result,
                    timestamp: new Date()
                };

                this.logAudit('exploit_completed_in_suite', {
                    suiteId,
                    exploitName,
                    target
                });

            } catch (error) {
                results[exploitName] = {
                    success: false,
                    error: error.message,
                    timestamp: new Date()
                };

                this.logError('Suite Exploit Error', error);
            }
        }

        return results;
    }

    // Helper methods
    generateScanId() {
        return `scan_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    updateScanProgress(scanId, progress) {
        if (this.activeScans.has(scanId)) {
            const scan = this.activeScans.get(scanId);
            scan.progress = progress;
            this.activeScans.set(scanId, scan);
        }
    }

    getExploitsList() {
        return Object.keys(this.exploits).map(name => ({
            name,
            displayName: this.exploits[name].displayName || name,
            description: this.exploits[name].description || 'No description available',
            severity: this.exploits[name].severity || 'medium',
            category: this.exploits[name].category || 'general'
        }));
    }

    getRecentScans() {
        return Object.entries(this.scanResults)
            .slice(-10)
            .map(([id, result]) => ({
                id,
                target: result.target,
                type: result.type || 'single',
                timestamp: result.timestamp,
                success: result.success
            }));
    }

    getVulnerabilitySummary() {
        const summary = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
        };

        Object.values(this.scanResults).forEach(result => {
            if (result.success && result.result && result.result.vulnerabilities) {
                result.result.vulnerabilities.forEach(vuln => {
                    if (summary[vuln.severity]) {
                        summary[vuln.severity]++;
                    }
                });
            }
        });

        return summary;
    }

    getCriticalVulnerabilityCount() {
        let count = 0;
        Object.values(this.scanResults).forEach(result => {
            if (result.success && result.result && result.result.vulnerabilities) {
                count += result.result.vulnerabilities.filter(v => v.severity === 'critical').length;
            }
        });
        return count;
    }

    getLastScanTime() {
        const times = Object.values(this.scanResults).map(r => new Date(r.timestamp));
        return times.length > 0 ? new Date(Math.max(...times)) : null;
    }

    // Clear all scan results
    clearAllResults() {
        const resultCount = Object.keys(this.scanResults).length;
        this.scanResults = {};
        this.logAudit('CLEAR_ALL_RESULTS', `Cleared ${resultCount} scan results`);
        return { success: true, count: resultCount };
    }

    // Clear results for a specific session
    clearSessionResults(sessionId) {
        let clearedCount = 0;
        const keysToDelete = [];

        for (const [key, result] of Object.entries(this.scanResults)) {
            if (key.includes(sessionId) || result.suiteId === sessionId) {
                keysToDelete.push(key);
                clearedCount++;
            }
        }

        keysToDelete.forEach(key => delete this.scanResults[key]);

        if (clearedCount > 0) {
            this.logAudit('CLEAR_SESSION_RESULTS', `Cleared ${clearedCount} results for session ${sessionId}`);
            return { success: true, count: clearedCount };
        }

        return { success: false, count: 0 };
    }

    // Clear results before starting new scan (called automatically)
    clearPreviousResults() {
        const resultCount = Object.keys(this.scanResults).length;
        if (resultCount > 0) {
            this.scanResults = {};
            this.logAudit('AUTO_CLEAR_RESULTS', `Auto-cleared ${resultCount} previous results before new scan`);
            return resultCount;
        }
        return 0;
    }

    async getSystemHealth() {
        try {
            // Basic system health checks
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();

            return {
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memoryUsage.external / 1024 / 1024)
                },
                uptime: Math.round(uptime),
                activeScans: this.activeScans.size,
                status: 'healthy'
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    getEstimatedTime(exploitName) {
        const timings = {
            sqlInjection: 30,
            xss: 20,
            csrf: 15,
            authBypass: 25,
            directoryTraversal: 20,
            commandInjection: 30,
            networkScanner: 60,
            sslAnalyzer: 40,
            webVulnScanner: 120,
            bufferOverflow: 45
        };

        return timings[exploitName] || 30;
    }

    getEstimatedSuiteTime(exploits) {
        return exploits.reduce((total, exploit) => {
            return total + this.getEstimatedTime(exploit);
        }, 0);
    }

    calculateExecutionTime(scanId) {
        if (this.activeScans.has(scanId)) {
            const scan = this.activeScans.get(scanId);
            return Date.now() - scan.startTime.getTime();
        }
        return 0;
    }

    generateSuiteSummary(results) {
        const summary = {
            totalExploits: Object.keys(results).length,
            successful: 0,
            failed: 0,
            vulnerabilities: [],
            recommendations: []
        };

        Object.entries(results).forEach(([exploit, result]) => {
            if (result.success) {
                summary.successful++;
                if (result.result && result.result.vulnerabilities) {
                    summary.vulnerabilities.push(...result.result.vulnerabilities);
                }
            } else {
                summary.failed++;
            }
        });

        return summary;
    }

    generateDetailedReport(scanResult) {
        return {
            metadata: {
                scanId: scanResult.scanId,
                target: scanResult.target,
                timestamp: scanResult.timestamp,
                type: scanResult.type || 'single'
            },
            executive_summary: this.generateExecutiveSummary(scanResult),
            findings: this.generateFindings(scanResult),
            recommendations: this.generateRecommendations(scanResult),
            technical_details: scanResult.result || scanResult.results
        };
    }

    generateExecutiveSummary(scanResult) {
        // Generate executive summary based on scan results
        return {
            overview: `Security assessment completed for ${scanResult.target}`,
            risk_level: this.calculateOverallRisk(scanResult),
            key_findings: this.extractKeyFindings(scanResult)
        };
    }

    generateFindings(scanResult) {
        // Extract and format findings from scan results
        const findings = [];

        if (scanResult.type === 'suite' && scanResult.results) {
            Object.entries(scanResult.results).forEach(([exploit, result]) => {
                if (result.success && result.result && result.result.vulnerabilities) {
                    findings.push(...result.result.vulnerabilities);
                }
            });
        } else if (scanResult.result && scanResult.result.vulnerabilities) {
            findings.push(...scanResult.result.vulnerabilities);
        }

        return findings;
    }

    generateRecommendations(scanResult) {
        // Generate security recommendations based on findings
        return [
            'Implement input validation and sanitization',
            'Use parameterized queries to prevent SQL injection',
            'Enable Content Security Policy (CSP)',
            'Implement proper authentication and authorization',
            'Regular security updates and patches',
            'Network segmentation and firewall rules',
            'SSL/TLS configuration hardening'
        ];
    }

    calculateOverallRisk(scanResult) {
        // Calculate overall risk level based on findings
        let riskScore = 0;
        const findings = this.generateFindings(scanResult);

        findings.forEach(finding => {
            switch (finding.severity) {
                case 'critical': riskScore += 10; break;
                case 'high': riskScore += 7; break;
                case 'medium': riskScore += 4; break;
                case 'low': riskScore += 2; break;
                case 'info': riskScore += 1; break;
            }
        });

        if (riskScore >= 50) return 'critical';
        if (riskScore >= 30) return 'high';
        if (riskScore >= 15) return 'medium';
        if (riskScore >= 5) return 'low';
        return 'info';
    }

    extractKeyFindings(scanResult) {
        const findings = this.generateFindings(scanResult);
        return findings
            .filter(f => ['critical', 'high'].includes(f.severity))
            .slice(0, 5)
            .map(f => f.title || f.description);
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Security Assessment Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; }
        .section { margin: 20px 0; }
        .critical { color: #e74c3c; }
        .high { color: #f39c12; }
        .medium { color: #f1c40f; }
        .low { color: #27ae60; }
        .info { color: #3498db; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Assessment Report</h1>
        <p>Target: ${report.metadata.target}</p>
        <p>Date: ${new Date(report.metadata.timestamp).toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <p>${report.executive_summary.overview}</p>
        <p>Overall Risk Level: <span class="${report.executive_summary.risk_level}">${report.executive_summary.risk_level.toUpperCase()}</span></p>
    </div>

    <div class="section">
        <h2>Key Findings</h2>
        <ul>
            ${report.executive_summary.key_findings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
    }

    logAudit(action, details) {
        const logEntry = {
            timestamp: new Date(),
            action,
            details,
            source: 'SecurityController'
        };

        this.auditLogs.push(logEntry);
        console.log(`[SECURITY AUDIT] ${action}:`, details);
    }

    logError(context, error) {
        const errorLog = {
            timestamp: new Date(),
            context,
            error: error.message,
            stack: error.stack
        };

        console.error(`[SECURITY ERROR] ${context}:`, error);
    }
}

module.exports = new SecurityController();

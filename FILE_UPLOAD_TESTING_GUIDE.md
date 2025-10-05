# 🚀 Overlook Security Suite - File Upload Testing Guide

## 📋 Overview

This guide demonstrates how to use the **file upload functionality** integrated with your Overlook Security Suite. Users can now upload code files directly to the platform and run comprehensive security tests against them.

## 🔧 Setup & Access

### 1. Start the Backend Server
```bash
cd Overlook/server
npm start
```
**Expected Output:** `Server running on port 3003`

### 2. Start the Frontend Application
```bash
cd Overlook/client
npm run dev
```
**Expected Output:** Frontend available at `http://localhost:5173`

### 3. Navigate to Security Testing
Open your browser and go to:
```
http://localhost:5173/security-testing
```

## 🎯 File Upload Features

### **Supported File Types**
- **Web Technologies:** `.html`, `.htm`, `.css`, `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`
- **Backend Languages:** `.php`, `.py`, `.java`, `.cpp`, `.c`, `.cs`, `.go`, `.rb`
- **Data Formats:** `.json`, `.xml`, `.sql`
- **Server Technologies:** `.asp`, `.aspx`
- **General:** `.txt`, `.h`

### **Upload Limits**
- **Maximum File Size:** 10MB per file
- **Maximum Files:** 10 files per upload session
- **Total Storage:** Unlimited (files stored temporarily)

## 🖱️ How to Upload Files

### **Method 1: Drag & Drop**
1. Navigate to the **FILE_UPLOAD** tab
2. Drag your files from your computer
3. Drop them into the upload zone
4. Files will be automatically processed

### **Method 2: Browse Files**
1. Click **[BROWSE_FILES]** button
2. Select multiple files using Ctrl+Click (Windows) or Cmd+Click (Mac)
3. Click **Open**
4. Files will be uploaded instantly

### **Method 3: API Upload (Advanced)**
```bash
curl -X POST http://localhost:3003/api/security/upload \
  -F "files=@vulnerable-login.php" \
  -F "files=@vulnerable-app.js"
```

## 🧪 Testing Your Uploaded Files

### **Step 1: Upload Test Files**
Use the provided sample files in `Overlook/test-files/`:
- `vulnerable-login.php` - Contains SQL injection, XSS, CSRF vulnerabilities
- `vulnerable-app.js` - Node.js app with command injection, auth bypass
- `vulnerable-page.html` - Frontend with XSS, clickjacking issues

### **Step 2: Select Security Exploits**
1. Go to the **EXPLOITS** tab
2. Select the tests you want to run:
   - ✅ **SQL Injection** - Database security
   - ✅ **XSS** - Cross-site scripting
   - ✅ **Command Injection** - Code execution
   - ✅ **Directory Traversal** - File access
   - ✅ **CSRF** - Request forgery
   - ✅ **Auth Bypass** - Authentication flaws

### **Step 3: Run File Security Scan**
1. Return to **FILE_UPLOAD** tab
2. Click **[TEST_FILES]** button
3. Watch the progress in the terminal
4. View results in **RESULTS** tab

## 🔍 Understanding Results

### **Vulnerability Levels**
- 🔴 **Critical** - Immediate security risk (Command injection, Auth bypass)
- 🟠 **High** - Serious vulnerability (SQL injection, Directory traversal)
- 🟡 **Medium** - Moderate risk (XSS, CSRF)
- 🟢 **Low** - Minor issue (Information disclosure)

### **Result Details**
Each vulnerability shows:
```json
{
  "type": "SQL Injection",
  "severity": "high",
  "location": "vulnerable-login.php",
  "payload": "$_POST['username']",
  "evidence": "Potential SQL injection vulnerability detected",
  "line": 12
}
```

## 💡 Example Testing Workflow

### **Upload & Test PHP File**
```bash
# 1. Create a test PHP file
echo '<?php $user = $_GET["user"]; mysql_query("SELECT * FROM users WHERE name = \"$user\""); ?>' > test.php

# 2. Upload via API
curl -X POST http://localhost:3003/api/security/upload -F "files=@test.php"

# 3. Run SQL injection test
curl -X POST http://localhost:3003/api/security/scan-files \
  -H "Content-Type: application/json" \
  -d '{"selectedExploits": ["sqlInjection"]}'
```

### **Expected Result**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "exploitName": "sqlInjection",
        "vulnerabilities": [
          {
            "type": "SQL Injection",
            "severity": "high",
            "location": "test.php",
            "line": 1
          }
        ]
      }
    ]
  }
}
```

## 🛡️ Security Features

### **File Validation**
- **Type Checking:** Only allows code/text files
- **Size Limits:** Prevents large file uploads
- **Content Scanning:** Files are analyzed, not executed
- **Temporary Storage:** Files are deleted after testing

### **Domain Restrictions**
- **Safe Testing:** Only approved domains for URL testing
- **File Analysis:** Local file scanning is isolated
- **No Execution:** Code is analyzed statically, never run

### **Audit Logging**
All activities are logged:
- File uploads
- Security scans
- Vulnerability discoveries
- User actions

## 📊 Dashboard Integration

### **Real-time Metrics**
- **Upload Count:** Number of files uploaded
- **Scan Progress:** Active security tests
- **Vulnerability Stats:** Critical/High/Medium/Low counts
- **File Types:** Distribution of uploaded file types

### **Export Options**
- **CSV Export:** Download scan results
- **JSON Reports:** API-friendly format
- **Vulnerability Details:** Comprehensive security reports

## 🔧 Advanced Configuration

### **Custom Scan Settings**
```javascript
const scanConfig = {
  timeout: 10000,      // Max scan time (ms)
  maxDepth: 2,         // Code analysis depth
  aggressive: false    // Intensive scanning
};
```

### **File Management API**
```bash
# List uploaded files
curl http://localhost:3003/api/security/files

# Delete specific file
curl -X DELETE http://localhost:3003/api/security/files/{fileId}

# Get file scan history
curl http://localhost:3003/api/security/results?fileId={fileId}
```

## 🚀 Quick Test Commands

### **Test 1: Upload Sample Files**
```bash
cd Overlook/test-files
curl -X POST http://localhost:3003/api/security/upload \
  -F "files=@vulnerable-login.php" \
  -F "files=@vulnerable-app.js" \
  -F "files=@vulnerable-page.html"
```

### **Test 2: Run Comprehensive Scan**
```bash
curl -X POST http://localhost:3003/api/security/scan-files \
  -H "Content-Type: application/json" \
  -d '{
    "selectedExploits": ["sqlInjection", "xss", "commandInjection", "csrf"],
    "options": {"timeout": 15000, "aggressive": true}
  }'
```

### **Test 3: View Results**
```bash
curl http://localhost:3003/api/security/results | jq '.'
```

## 🎯 Best Practices

### **For Developers**
1. **Test Early:** Upload code during development
2. **Regular Scans:** Run tests before commits
3. **Fix Critical:** Address high-severity issues first
4. **Document:** Keep track of known vulnerabilities

### **For Security Teams**
1. **Batch Testing:** Upload multiple files at once
2. **Comprehensive Scans:** Use all available exploits
3. **Trend Analysis:** Monitor vulnerability patterns
4. **Report Generation:** Export results for compliance

### **For Educators**
1. **Demo Files:** Use provided vulnerable samples
2. **Learning Path:** Start with basic XSS, progress to complex
3. **Interactive Testing:** Show live vulnerability detection
4. **Comparison:** Test before/after code fixes

## 🔍 Troubleshooting

### **Common Issues**

**File Upload Fails**
```bash
# Check file size (max 10MB)
ls -lh yourfile.php

# Verify file type
file yourfile.php
```

**No Vulnerabilities Found**
- ✅ Check if file contains actual code
- ✅ Verify exploit selection
- ✅ Try different file types
- ✅ Review scan configuration

**API Connection Error**
```bash
# Test backend connectivity
curl http://localhost:3003/api/security/health

# Check server logs
cd Overlook/server && tail -f server.log
```

## 📚 Educational Resources

### **Sample Vulnerable Code**
Located in `Overlook/test-files/`:
- **PHP Vulnerabilities:** SQL injection, XSS, file inclusion
- **JavaScript Issues:** DOM XSS, eval() usage, weak validation
- **HTML Problems:** Missing CSRF tokens, clickjacking

### **Learning Objectives**
1. **Identify** common web vulnerabilities
2. **Understand** attack vectors and payloads
3. **Practice** secure coding techniques
4. **Implement** proper input validation

## 🎉 Success Indicators

Your file upload integration is working correctly when:

- ✅ Files upload without errors
- ✅ Security scans complete successfully  
- ✅ Vulnerabilities are detected in test files
- ✅ Results appear in the dashboard
- ✅ Export functionality works
- ✅ File management operations succeed

## 🔗 API Endpoints

### **File Operations**
- `POST /api/security/upload` - Upload files
- `GET /api/security/files` - List uploaded files
- `DELETE /api/security/files/:id` - Delete file
- `POST /api/security/scan-files` - Scan uploaded files

### **Security Testing**
- `GET /api/security/exploits` - Available tests
- `POST /api/security/suite` - Run multiple tests
- `GET /api/security/results` - View scan results
- `GET /api/security/stats` - Security statistics

---

## 🎯 Ready to Test!

Your Overlook Security Suite now supports:
- ✅ **File Upload** via drag & drop or browse
- ✅ **Multi-file Testing** with 10+ exploit types
- ✅ **Real-time Results** with detailed vulnerability reports
- ✅ **Export Capabilities** for compliance and reporting
- ✅ **Educational Resources** with sample vulnerable files

**Start testing now:** Navigate to `http://localhost:5173/security-testing` and upload your first file!

---

*Created for Overlook Security Suite - Making security testing accessible to everyone* 🛡️
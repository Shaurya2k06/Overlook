// Vulnerable Node.js application for security testing
// WARNING: This file contains intentional vulnerabilities for educational purposes only
// NEVER use this code in production

const express = require('express');
const mysql = require('mysql');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vulnerable database connection with hardcoded credentials
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'vulnerable_app'
});

// SQL Injection vulnerability - direct query construction
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Vulnerable: Direct string concatenation
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.query(query, (err, results) => {
        if (err) {
            // Information disclosure - showing SQL errors
            res.status(500).send(`Database error: ${err.message}`);
            return;
        }

        if (results.length > 0) {
            // Insecure session management
            res.cookie('auth', username, { httpOnly: false });
            res.json({ success: true, user: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// XSS vulnerability - reflecting user input without sanitization
app.get('/search', (req, res) => {
    const searchTerm = req.query.q;

    // Vulnerable: Direct output of user input
    res.send(`
        <html>
            <body>
                <h1>Search Results</h1>
                <p>You searched for: ${searchTerm}</p>
                <script>
                    // Vulnerable: User input in script context
                    var searchQuery = "${searchTerm}";
                    console.log("Search: " + searchQuery);
                </script>
            </body>
        </html>
    `);
});

// Command Injection vulnerability
app.post('/ping', (req, res) => {
    const host = req.body.host;

    // Vulnerable: Direct command execution with user input
    exec(`ping -c 4 ${host}`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).send(`Error: ${error.message}`);
            return;
        }
        res.send(`<pre>${stdout}</pre>`);
    });
});

// Directory Traversal vulnerability
app.get('/file', (req, res) => {
    const filename = req.query.name;

    // Vulnerable: No path validation
    const filepath = path.join(__dirname, 'files', filename);

    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('File not found');
            return;
        }
        res.send(data);
    });
});

// CSRF vulnerability - no token protection
app.post('/delete-user', (req, res) => {
    const userId = req.body.userId;

    // Vulnerable: No CSRF protection
    const query = `DELETE FROM users WHERE id = ${userId}`;

    db.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json({ success: true, message: 'User deleted' });
    });
});

// Authentication Bypass vulnerability
app.post('/admin', (req, res) => {
    const { username, secret } = req.body;

    // Vulnerable: Weak authentication logic
    if (username === 'admin' || secret === 'backdoor123') {
        res.json({ admin: true, message: 'Admin access granted' });
    } else {
        res.status(403).json({ admin: false, message: 'Access denied' });
    }
});

// Code Injection vulnerability
app.post('/eval', (req, res) => {
    const code = req.body.code;

    try {
        // Vulnerable: Direct code evaluation
        const result = eval(code);
        res.json({ result: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NoSQL Injection vulnerability (if using MongoDB)
app.post('/user-profile', (req, res) => {
    const userId = req.body.userId;

    // Vulnerable: Direct object injection
    const query = { _id: userId };

    // This would be vulnerable in MongoDB context
    res.json({ query: query, message: 'Profile query constructed' });
});

// Insecure Direct Object Reference
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;

    // Vulnerable: No authorization check
    const query = `SELECT * FROM users WHERE id = ${userId}`;

    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }

        if (results.length > 0) {
            // Information disclosure - returning sensitive data
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});

// Weak cryptography
const crypto = require('crypto');

app.post('/encrypt', (req, res) => {
    const data = req.body.data;

    // Vulnerable: Weak encryption algorithm
    const cipher = crypto.createCipher('des', 'weak-key');
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    res.json({ encrypted: encrypted });
});

// Information disclosure
app.get('/debug', (req, res) => {
    // Vulnerable: Exposing sensitive information
    res.json({
        environment: process.env,
        config: {
            db_password: 'password123',
            api_key: 'secret-api-key-12345'
        },
        memory: process.memoryUsage(),
        version: process.version
    });
});

// File upload without validation
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    // Vulnerable: No file type validation
    const file = req.file;

    if (!file) {
        res.status(400).send('No file uploaded');
        return;
    }

    // Vulnerable: Trusting user-provided filename
    const newPath = path.join(__dirname, 'uploads', file.originalname);
    fs.renameSync(file.path, newPath);

    res.json({
        message: 'File uploaded successfully',
        filename: file.originalname,
        path: newPath
    });
});

// Server-Side Request Forgery (SSRF)
app.post('/fetch-url', (req, res) => {
    const url = req.body.url;

    // Vulnerable: No URL validation
    const http = require('http');

    http.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            res.send(data);
        });
    }).on('error', (err) => {
        res.status(500).send(err.message);
    });
});

// Race condition vulnerability
let counter = 0;

app.post('/increment', (req, res) => {
    // Vulnerable: Race condition
    const current = counter;

    setTimeout(() => {
        counter = current + 1;
        res.json({ counter: counter });
    }, 100);
});

// Insecure random token generation
app.get('/token', (req, res) => {
    // Vulnerable: Predictable random generation
    const token = Math.random().toString(36).substring(2);

    res.json({ token: token });
});

// Error handling that leaks information
app.use((err, req, res, next) => {
    // Vulnerable: Exposing stack traces
    res.status(500).json({
        error: err.message,
        stack: err.stack,
        details: err
    });
});

// Hardcoded secrets
const JWT_SECRET = 'hardcoded-jwt-secret-123';
const API_KEY = 'api-key-12345-secret';
const ENCRYPTION_KEY = 'my-secret-key';

// Vulnerable middleware - no rate limiting
app.use((req, res, next) => {
    // No rate limiting - vulnerable to DoS
    next();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Vulnerable app running on port ${PORT}`);
    console.log('WARNING: This application contains intentional security vulnerabilities!');
});

module.exports = app;

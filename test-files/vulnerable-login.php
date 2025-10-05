<?php
// Vulnerable login script for security testing
// WARNING: This file contains intentional vulnerabilities for educational purposes only
// NEVER use this code in production

// SQL Injection vulnerability - no input sanitization
$username = $_POST['username'];
$password = $_POST['password'];

// Direct concatenation without prepared statements
$query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysql_query($query);

// XSS vulnerability - echoing user input without escaping
if (isset($_GET['error'])) {
    echo "<div class='error'>" . $_GET['error'] . "</div>";
}

// Command Injection vulnerability
if (isset($_POST['debug'])) {
    $command = "ping " . $_POST['host'];
    exec($command, $output);
    echo "<pre>" . implode("\n", $output) . "</pre>";
}

// Directory Traversal vulnerability
if (isset($_GET['file'])) {
    $filename = $_GET['file'];
    include($filename);
}

// Authentication Bypass vulnerability
if ($_POST['username'] == 'admin' && $_POST['bypass'] == '1') {
    $_SESSION['admin'] = true;
    header('Location: admin.php');
}

// Weak password check
if ($password == 'password123') {
    $_SESSION['logged_in'] = true;
}

// CSRF vulnerability - no token protection
if ($_POST['action'] == 'delete_user') {
    $user_id = $_POST['user_id'];
    mysql_query("DELETE FROM users WHERE id = $user_id");
}

// File upload vulnerability
if (isset($_FILES['upload'])) {
    $target = "uploads/" . $_FILES['upload']['name'];
    move_uploaded_file($_FILES['upload']['tmp_name'], $target);
}

// Information disclosure
if ($_GET['debug'] == '1') {
    phpinfo();
    print_r($_SERVER);
}

// Hardcoded credentials
$admin_user = 'admin';
$admin_pass = 'secret123';

// Weak session management
session_start();
if ($_POST['login']) {
    if ($username && $password) {
        $_SESSION['user'] = $username;
        setcookie('auth', base64_encode($username), time() + 3600);
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Vulnerable Login System</title>
    <script>
        // XSS vulnerability in JavaScript
        function showMessage() {
            var msg = "<?php echo $_GET['msg']; ?>";
            document.getElementById('message').innerHTML = msg;
        }

        // Insecure random number generation
        function generateToken() {
            return Math.random().toString();
        }
    </script>
</head>
<body onload="showMessage()">
    <h1>Login System</h1>

    <!-- CSRF vulnerable form -->
    <form method="POST" action="login.php">
        <input type="text" name="username" placeholder="Username" value="<?php echo $_POST['username']; ?>">
        <input type="password" name="password" placeholder="Password">
        <input type="hidden" name="bypass" value="0">
        <input type="submit" name="login" value="Login">
    </form>

    <!-- File upload without validation -->
    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="upload">
        <input type="submit" value="Upload File">
    </form>

    <!-- Debug form with command injection -->
    <form method="POST">
        <input type="text" name="host" placeholder="Host to ping">
        <input type="hidden" name="debug" value="1">
        <input type="submit" value="Debug Ping">
    </form>

    <div id="message"></div>

    <!-- SQL injection in URL parameter -->
    <a href="?file=../../../etc/passwd">View Config</a>

    <?php
    // More SQL injection opportunities
    if (isset($_GET['search'])) {
        $search = $_GET['search'];
        $sql = "SELECT * FROM products WHERE name LIKE '%$search%'";
        echo "<!-- Debug: $sql -->";
    }

    // Eval vulnerability
    if (isset($_POST['code'])) {
        eval($_POST['code']);
    }

    // Weak encryption
    function encrypt_password($pass) {
        return md5($pass);
    }

    // Path traversal in include
    if ($_GET['page']) {
        include($_GET['page'] . '.php');
    }
    ?>
</body>
</html>

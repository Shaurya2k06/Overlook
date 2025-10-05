const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Test the deterministic file ID generation
function generateDeterministicFileId(filename) {
    // Create a deterministic ID based on filename hash
    // This ensures the same file always gets the same ID across server restarts
    const hash = crypto.createHash('md5').update(filename).digest('hex');
    return `file_${hash.substring(0, 16)}`;
}

console.log('🧪 Testing Deterministic File ID Generation');
console.log('='.repeat(50));

// Test with sample filenames from uploads directory
const uploadsDir = path.join(__dirname, 'server', 'uploads');

if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);

    console.log(`\n📁 Found ${files.length} files in uploads directory:`);
    console.log('-'.repeat(50));

    files.forEach((filename, index) => {
        const id1 = generateDeterministicFileId(filename);
        const id2 = generateDeterministicFileId(filename); // Generate again to test consistency

        // Extract original name from filename format: timestamp-random-originalname
        const parts = filename.split('-');
        let originalName = filename;
        if (parts.length >= 3) {
            originalName = parts.slice(2).join('-');
        }

        console.log(`${index + 1}. File: ${originalName}`);
        console.log(`   Stored as: ${filename}`);
        console.log(`   ID (1st): ${id1}`);
        console.log(`   ID (2nd): ${id2}`);
        console.log(`   Consistent: ${id1 === id2 ? '✅ YES' : '❌ NO'}`);
        console.log('');
    });

    // Test ID uniqueness
    const allIds = files.map(generateDeterministicFileId);
    const uniqueIds = [...new Set(allIds)];

    console.log('\n🔍 ID Uniqueness Test:');
    console.log('-'.repeat(30));
    console.log(`Total files: ${files.length}`);
    console.log(`Unique IDs: ${uniqueIds.length}`);
    console.log(`All unique: ${files.length === uniqueIds.length ? '✅ YES' : '❌ NO'}`);

    if (files.length !== uniqueIds.length) {
        console.log('\n⚠️  DUPLICATE IDs DETECTED:');
        const duplicates = allIds.filter((id, index, arr) => arr.indexOf(id) !== index);
        duplicates.forEach(dupId => {
            const dupFiles = files.filter(f => generateDeterministicFileId(f) === dupId);
            console.log(`   ID ${dupId}: ${dupFiles.join(', ')}`);
        });
    }

} else {
    console.log('\n❌ Uploads directory not found');
    console.log('   Expected location:', uploadsDir);
}

// Test with common filename patterns
console.log('\n🧪 Testing Common Filename Patterns:');
console.log('-'.repeat(40));

const testFiles = [
    'script.js',
    'index.php',
    'app.py',
    'main.c',
    'test-file.txt',
    'vulnerable-login.php',
    'red_team_exploits.js'
];

testFiles.forEach(filename => {
    const id = generateDeterministicFileId(filename);
    console.log(`${filename.padEnd(25)} → ${id}`);
});

console.log('\n✅ File ID generation test completed!');

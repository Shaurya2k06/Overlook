const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3003/api/security';
const TEST_TIMEOUT = 30000; // 30 seconds

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
    console.log('🔄 Waiting for server to start...');
    for (let i = 0; i < 30; i++) {
        try {
            const response = await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
            if (response.status === 200) {
                console.log('✅ Server is ready!');
                return true;
            }
        } catch (error) {
            // Server not ready yet
        }
        await sleep(1000);
    }
    throw new Error('Server failed to start within timeout');
}

async function testFileDeletion() {
    console.log('🧪 Testing File Deletion Functionality');
    console.log('='.repeat(50));

    try {
        // Wait for server to be ready
        await waitForServer();

        // 1. Get list of uploaded files
        console.log('\n📋 Step 1: Getting list of uploaded files...');
        const filesResponse = await axios.get(`${BASE_URL}/files`);

        if (!filesResponse.data.success) {
            throw new Error('Failed to get files list');
        }

        const files = filesResponse.data.data.files;
        console.log(`   Found ${files.length} files`);

        if (files.length === 0) {
            console.log('⚠️  No files available for testing deletion');
            return;
        }

        // Display first few files with their IDs
        console.log('\n📁 Available files:');
        files.slice(0, 5).forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.name} (ID: ${file.id})`);
        });

        // 2. Test deleting the first file
        const fileToDelete = files[0];
        console.log(`\n🗑️  Step 2: Testing deletion of "${fileToDelete.name}"...`);
        console.log(`   File ID: ${fileToDelete.id}`);

        // Check if physical file exists before deletion
        const uploadsDir = path.join(__dirname, 'server', 'uploads');
        const potentialPaths = fs.readdirSync(uploadsDir).filter(f => f.includes(fileToDelete.name));
        console.log(`   Physical files before deletion: ${potentialPaths.length}`);

        // Attempt deletion
        try {
            const deleteResponse = await axios.delete(`${BASE_URL}/files/${fileToDelete.id}`);

            if (deleteResponse.data.success) {
                console.log('✅ File deletion request successful');
                console.log(`   Server response: ${deleteResponse.data.data.message}`);
                console.log(`   Deleted file: ${deleteResponse.data.data.fileName}`);
            } else {
                console.log('❌ File deletion failed');
                console.log(`   Error: ${deleteResponse.data.error}`);
                return;
            }
        } catch (deleteError) {
            if (deleteError.response) {
                console.log('❌ File deletion failed with HTTP error');
                console.log(`   Status: ${deleteError.response.status}`);
                console.log(`   Error: ${deleteError.response.data.error}`);
            } else {
                console.log('❌ File deletion failed with network error');
                console.log(`   Error: ${deleteError.message}`);
            }
            return;
        }

        // 3. Verify file is removed from the list
        console.log('\n🔍 Step 3: Verifying file removal from list...');
        await sleep(1000); // Brief pause to ensure changes are reflected

        const updatedFilesResponse = await axios.get(`${BASE_URL}/files`);
        const updatedFiles = updatedFilesResponse.data.data.files;

        const fileStillExists = updatedFiles.some(f => f.id === fileToDelete.id);

        if (fileStillExists) {
            console.log('❌ File still exists in the list');
        } else {
            console.log('✅ File successfully removed from list');
            console.log(`   Files before: ${files.length}, Files after: ${updatedFiles.length}`);
        }

        // 4. Check if physical file was deleted
        console.log('\n💾 Step 4: Checking physical file deletion...');
        const remainingFiles = fs.readdirSync(uploadsDir).filter(f => f.includes(fileToDelete.name));

        if (remainingFiles.length === 0) {
            console.log('✅ Physical file successfully deleted from disk');
        } else {
            console.log('⚠️  Physical file may still exist on disk');
            console.log(`   Remaining files: ${remainingFiles.join(', ')}`);
        }

        // 5. Test deleting non-existent file
        console.log('\n🚫 Step 5: Testing deletion of non-existent file...');
        const fakeFileId = 'file_nonexistent123';

        try {
            const fakeDeleteResponse = await axios.delete(`${BASE_URL}/files/${fakeFileId}`);
            console.log('❌ Expected error but deletion succeeded');
        } catch (fakeDeleteError) {
            if (fakeDeleteError.response && fakeDeleteError.response.status === 404) {
                console.log('✅ Correctly returned 404 for non-existent file');
                console.log(`   Error message: ${fakeDeleteError.response.data.error}`);
            } else {
                console.log('⚠️  Unexpected error response');
                console.log(`   Status: ${fakeDeleteError.response?.status || 'No status'}`);
                console.log(`   Error: ${fakeDeleteError.response?.data?.error || fakeDeleteError.message}`);
            }
        }

        console.log('\n✅ File deletion testing completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
        process.exit(1);
    }
}

async function main() {
    try {
        await testFileDeletion();
        console.log('\n🎉 All tests completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Testing failed:', error.message);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Test interrupted by user');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test terminated');
    process.exit(1);
});

// Run the test
if (require.main === module) {
    main();
}

module.exports = { testFileDeletion };

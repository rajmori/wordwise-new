import fetch from 'node-fetch';
import FormData from 'form-data';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000/api';
const ZIP_FILE = 'test-bulk-upload.zip';

const createTestZip = () => {
    console.log('📦 Creating Test ZIP...');
    const zip = new AdmZip();

    // 1. Create CSV
    const csvContent = `word1,word2,category,description,tags,imageFilename
Accept,Except,Confusing Words,"Accept means to receive, Except means to exclude",verb,image1.png
Advice,Advise,Confusing Words,"Advice is a noun, Advise is a verb",noun/verb,image2.png`;

    zip.addFile('data.csv', Buffer.from(csvContent));

    // 2. Add Dummy Images
    const dummyImage = Buffer.from('fake image content');
    zip.addFile('image1.png', dummyImage);
    zip.addFile('image2.png', dummyImage);

    zip.writeZip(ZIP_FILE);
    console.log(`✅ ZIP created: ${ZIP_FILE}`);
};

const runTest = async () => {
    try {
        createTestZip();

        // Login
        console.log('\n🔑 Logging in Admin...');
        const loginRes = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testadmin@wordwise.com',
                password: 'admin123'
            })
        });

        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error('Login Failed');
        const token = loginData.token;
        console.log('✅ Login Successful');

        // Upload
        console.log('\n📤 Uploading ZIP...');
        const form = new FormData();
        form.append('file', fs.createReadStream(ZIP_FILE));

        const res = await fetch(`${BASE_URL}/flash-cards/bulk-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));

        // Cleanup
        if (fs.existsSync(ZIP_FILE)) {
            fs.unlinkSync(ZIP_FILE);
            console.log('\n🧹 Cleaned up ZIP file');
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
};

runTest();

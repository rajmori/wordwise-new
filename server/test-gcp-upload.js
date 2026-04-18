// Test GCP Upload Functionality
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

async function testGCPUpload() {
    try {
        console.log('🧪 Testing GCP Upload...\n');

        // 1. Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@wordwise.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        if (!loginData.success) {
            console.log('❌ Login failed');
            return;
        }

        const token = loginData.token;
        console.log('✅ Login successful\n');

        // 2. Create a test image (1x1 pixel PNG)
        console.log('2️⃣ Creating test image...');
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        // Save temporarily
        fs.writeFileSync('./test-image.png', testImageBuffer);
        console.log('✅ Test image created\n');

        // 3. Upload to GCP
        console.log('3️⃣ Uploading to GCP bucket...');
        const formData = new FormData();
        formData.append('image', fs.createReadStream('./test-image.png'), {
            filename: 'test-image.png',
            contentType: 'image/png'
        });

        const uploadResponse = await fetch('http://localhost:5000/api/upload/image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        const uploadData = await uploadResponse.json();

        // 4. Check result
        if (uploadData.success) {
            console.log('✅ GCP UPLOAD SUCCESSFUL!\n');
            console.log('📁 File Details:');
            console.log('   - Filename:', uploadData.data.filename);
            console.log('   - URL:', uploadData.data.url);
            console.log('   - Size:', uploadData.data.size, 'bytes');
            console.log('\n🎉 GCP Storage is working perfectly!');
        } else {
            console.log('❌ Upload failed:', uploadData.message);
            if (uploadData.error) {
                console.log('   Error:', uploadData.error);
            }
        }

        // Cleanup
        fs.unlinkSync('./test-image.png');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 This might mean:');
        console.log('   - GCP credentials are not configured');
        console.log('   - Service account key file is missing');
        console.log('   - Bucket permissions are incorrect');
    }
}

testGCPUpload();

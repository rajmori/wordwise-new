const API_BASE_URL = 'http://localhost:3000/api';
let adminToken = '';

// Helper to get admin token
async function getAdminToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@wordwise.com',
                password: 'admin123'
            })
        });
        const data = await response.json();
        return data.token;
    } catch (e) {
        console.error('Login error:', e.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Starting Course Management Tests...');

    try {
        adminToken = await getAdminToken();
        if (!adminToken) {
            console.error('❌ Failed to get admin token. Please ensure admin user exists with correct credentials.');
            return;
        }
        console.log('✅ Admin authenticated.');

        // 1. Test File Type Rejection (.sh file)
        console.log('\n🧪 Testing File Type Rejection (.sh file)...');
        const shFormData = new FormData();
        const shBlob = new Blob(['echo "hello"'], { type: 'text/x-sh' });
        shFormData.append('video', shBlob, 'test.sh');
        
        const shResponse = await fetch(`${API_BASE_URL}/upload/video`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: shFormData
        });
        const shData = await shResponse.json();
        if (shResponse.status >= 400) {
            console.log('✅ Correctly rejected .sh file. Status:', shResponse.status, 'Message:', shData.message);
        } else {
            console.error('❌ Failed to reject .sh file!', shData);
        }

        // 2. Test Large File Rejection (101MB video)
        console.log('\n🧪 Testing File Size Rejection (101MB video)...');
        const largeBlob = new Blob([new Uint8Array(101 * 1024 * 1024)], { type: 'video/mp4' });
        const largeFormData = new FormData();
        largeFormData.append('video', largeBlob, 'large.mp4');

        const largeResponse = await fetch(`${API_BASE_URL}/upload/video`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: largeFormData
        });
        const largeData = await largeResponse.json();
        if (largeResponse.status === 413 || largeResponse.status >= 400) {
             console.log('✅ Correctly rejected large file. Status:', largeResponse.status, 'Message:', largeData.message);
        } else {
            console.error('❌ Failed to reject large file (101MB)! Status:', largeResponse.status);
        }

        // 3. Test PDF Upload
        console.log('\n🧪 Testing Valid PDF Upload...');
        const pdfFormData = new FormData();
        const pdfBlob = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });
        pdfFormData.append('document', pdfBlob, 'test.pdf');
        pdfFormData.append('courseId', 'TEST-CRS-001');

        const pdfResponse = await fetch(`${API_BASE_URL}/upload/document`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: pdfFormData
        });
        const pdfData = await pdfResponse.json();
        if (pdfData.success) {
            console.log('✅ PDF uploaded successfully:', pdfData.data.url);
            if (pdfData.data.url.includes('/courses/TEST-CRS-001/documents/')) {
                console.log('✅ Correct GCP path structure.');
            } else {
                console.warn('⚠️ Path structure mismatch:', pdfData.data.url);
            }
        } else {
            console.error('❌ PDF upload failed!', pdfData);
        }

        // 4. Test Course Persistence
        console.log('\n🧪 Testing Course Creation with Metadata...');
        const coursePayload = {
            title: 'Test Course ' + Date.now(),
            description: 'This is a test course.',
            difficultyLevel: 'Beginner',
            estimatedDuration: { value: 5, unit: 'days' },
            category: 'Testing',
            price: 100,
            thumbnailUrl: 'https://example.com/thumb.jpg',
            modules: [
                {
                    title: 'Module 1',
                    lessons: [
                        {
                            title: 'Lesson 1',
                            contentType: 'document',
                            documentUrl: pdfData.data?.url || 'https://storage.googleapis.com/mock/test.pdf'
                        }
                    ]
                }
            ]
        };

        const createResponse = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(coursePayload)
        });
        const createData = await createResponse.json();
        if (createData.success) {
            console.log('✅ Course created successfully ID:', createData.data._id);
        } else {
            console.error('❌ Course creation failed!', createData);
        }

    } catch (error) {
        console.error('❌ Test execution error:', error.stack);
    }
}

runTests();

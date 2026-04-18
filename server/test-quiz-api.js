import fetch from 'node-fetch';

const ADMIN_EMAIL = 'admin@wordwise.com'; // Adjust if needed
const ADMIN_PASSWORD = 'admin123'; // Using default or mock
const BASE_URL = 'http://localhost:3000/api';

async function testQuizFlow() {
    console.log('🧪 Starting Quiz API Tests...');

    // 1. Login as Admin
    console.log('\nPlease ensure server has admin user seeded. Attempting login...');
    // Note: Assuming there is an admin login flow or we can mock auth.
    // For this test, we might struggle if we don't know exact admin creds.
    // Let's try to hit the public /health first

    // In dev environment, we might need a token.
    // Let's try to fake a token or assuming the seeded admin creds from previous context.
    // If login fails, we can't test much. 

    let token = '';

    try {
        const loginRes = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@wordwise.com', password: 'admin123' })
        });

        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error('❌ Admin login failed:', loginData.message);
            console.log('Skipping API tests due to auth failure.');
            return;
        }

        token = loginData.token;
        console.log('✅ Admin login successful');

    } catch (e) {
        console.error('❌ Login error:', e.message);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Create a Quiz
    console.log('\n📝 Creating a Quiz (Z-99)...');
    const quizData = {
        alphabet: 'Z',
        sequence: 90,
        questions: [
            {
                text: 'What is the last letter?',
                options: ['A', 'B', 'Y', 'Z'],
                correctOption: 3,
                hint: 'It is Z'
            }
        ],
        status: 'draft'
    };

    const createRes = await fetch(`${BASE_URL}/quizzes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(quizData)
    });

    const createResult = await createRes.json();

    if (createResult.success) {
        console.log('✅ Quiz created:', createResult.quiz.title);
    } else {
        console.error('❌ Quiz creation failed:', createResult.message);
        // If it failed because it exists, let's try to delete it first?
    }

    // 3. List Quizzes
    console.log('\n📋 Listing Quizzes...');
    const listRes = await fetch(`${BASE_URL}/quizzes?alphabet=Z`, { headers });
    const listResult = await listRes.json();

    if (listResult.success && listResult.quizzes.length > 0) {
        console.log(`✅ Found ${listResult.count} quizzes for alphabet Z`);
    } else {
        console.error('❌ No quizzes found or list failed');
    }

    // 4. Delete Quiz
    if (createResult.success) {
        console.log(`\n🗑️ Deleting Quiz ${createResult.quiz.id}...`);
        const deleteRes = await fetch(`${BASE_URL}/quizzes/${createResult.quiz.id}`, {
            method: 'DELETE',
            headers
        });
        const deleteResult = await deleteRes.json();
        if (deleteResult.success) {
            console.log('✅ Quiz deleted successfully');
        } else {
            console.error('❌ Delete failed:', deleteResult.message);
        }
    }
}

testQuizFlow();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'http://localhost:3000/api';

const SAMPLE_CSV_PATH = path.join(__dirname, 'test_quizzes.csv');

// Sample Data
const CSV_CONTENT = `Alphabet,Sequence,Question Text,Option A,Option B,Option C,Option D,Correct Option (A/B/C/D),Hint
Z,90,Test Question 1,Opt A,Opt B,Opt C,Opt D,A,Hint for 1
Z,90,Test Question 2,Blue,Green,Red,Yellow,C,Color hint
`;

async function runTest() {
    console.log('🚀 Starting Quiz Import Cycle Test...');

    try {
        // 1. Create CSV File
        fs.writeFileSync(SAMPLE_CSV_PATH, CSV_CONTENT);
        console.log('✅ Created sample CSV file:', SAMPLE_CSV_PATH);

        // 2. Login as Admin
        console.log('\n🔑 Logging in as Admin...');
        const loginRes = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@wordwise.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) throw new Error('Login failed: ' + loginData.message);
        const token = loginData.token;
        console.log('✅ Login successful. Token obtained.');

        // 3. Import CSV
        console.log('\n📥 Importing CSV...');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(SAMPLE_CSV_PATH));

        const importRes = await fetch(`${API_URL}/quizzes/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        const importData = await importRes.json();
        console.log('Import Response:', importData);

        if (!importData.success) throw new Error('Import failed: ' + importData.message);
        console.log('✅ Import successful.');

        // 4. Verify Data (Get Quizzes)
        console.log('\n🔍 Verifying Import (Fetching Quizzes)...');
        const getRes = await fetch(`${API_URL}/quizzes?alphabet=Z&status=draft`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const getData = await getRes.json();

        const importedQuiz = getData.quizzes.find(q => q.alphabet === 'Z' && q.sequence === 90);

        if (!importedQuiz) throw new Error('Imported quiz Z-90 not found!');
        console.log(`✅ Found Quiz: ${importedQuiz.title} (ID: ${importedQuiz.id})`);

        if (importedQuiz.questions.length !== 2) {
            throw new Error(`Expected 2 questions, found ${importedQuiz.questions.length}`);
        }
        console.log(`✅ Quiz has correct number of questions (2).`);
        console.log(`   Q1: ${importedQuiz.questions[0].text}`);
        console.log(`   Q2: ${importedQuiz.questions[1].text}`);

        // 5. Edit Quiz (Add a question)
        console.log('\n✏️  Testing Edit (Update Quiz)...');
        const updatedQuestions = [
            ...importedQuiz.questions,
            {
                text: 'Added via Edit',
                options: ['1', '2', '3', '4'],
                correctOption: 1,
                hint: 'New hint'
            }
        ];

        const updateRes = await fetch(`${API_URL}/quizzes/${importedQuiz.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                alphabet: 'Z',
                sequence: 90,
                questions: updatedQuestions,
                status: 'published' // Try publishing too
            })
        });
        const updateData = await updateRes.json();

        if (!updateData.success) throw new Error('Update failed: ' + updateData.message);
        if (updateData.quiz.questions.length !== 3) throw new Error('Update verification failed: Expected 3 questions');
        if (updateData.quiz.status !== 'published') throw new Error('Update status failed: Expected published');

        console.log('✅ Quiz updated successfully (Added question & Published).');

        // 6. Delete Quiz
        console.log('\n🗑️  Testing Delete Quiz...');
        const deleteRes = await fetch(`${API_URL}/quizzes/${importedQuiz.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const deleteData = await deleteRes.json();

        if (!deleteData.success) throw new Error('Delete failed: ' + deleteData.message);
        console.log('✅ Quiz deleted successfully.');

        // Verify Deletion
        const verifyDeleteRes = await fetch(`${API_URL}/quizzes/${importedQuiz.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (verifyDeleteRes.status === 404) {
            console.log('✅ Deletion verified (Quiz not found).');
        } else {
            console.error('⚠️  Quiz still exists after deletion!');
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
        }
    } finally {
        // Cleanup CSV
        if (fs.existsSync(SAMPLE_CSV_PATH)) {
            fs.unlinkSync(SAMPLE_CSV_PATH);
            console.log('\n🧹 Cleaned up test file.');
        }
    }
}

runTest();

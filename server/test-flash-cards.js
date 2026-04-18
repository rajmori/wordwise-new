import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let flashCardId = '';

const loginAdmin = async () => {
    console.log('\n🔑 Logging in Admin...');
    const res = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'testadmin@wordwise.com',
            password: 'admin123'
        })
    });

    const data = await res.json();
    if (data.success) {
        token = data.token;
        console.log('✅ Login Successful');
    } else {
        console.error('❌ Login Failed:', data.message);
        process.exit(1);
    }
};

const createFlashCard = async () => {
    console.log('\n📝 Creating Flash Card...');

    // Create a dummy image buffer
    const buffer = Buffer.from('fake image content');

    const form = new FormData();
    form.append('word1', 'Affect');
    form.append('word2', 'Effect');
    form.append('category', 'Grammar');
    form.append('description', 'Affect is a verb, Effect is a noun.');
    form.append('tags', 'grammar, confusing, verbs');
    form.append('image', buffer, {
        filename: 'test-image.png',
        contentType: 'image/png'
    });

    try {
        const res = await fetch(`${BASE_URL}/flash-cards`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // FormData headers are set automatically by form-data lib
            },
            body: form
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);

        if (data.success) {
            console.log('✅ Flash Card Created');
            console.log('ID:', data.data._id);
            console.log('Image URL:', data.data.imageUrl);
            flashCardId = data.data._id;
        } else {
            console.error('❌ Creation Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Creation Error:', error.message);
    }
};

const getFlashCards = async () => {
    console.log('\n📚 Fetching Flash Cards...');
    try {
        const res = await fetch(`${BASE_URL}/flash-cards?search=Affect`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            console.log(`✅ Fetched ${data.count} cards`);
            // console.log(data.data);
        } else {
            console.error('❌ Fetch Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Fetch Error:', error.message);
    }
};

const updateFlashCard = async () => {
    if (!flashCardId) return;
    console.log('\n✏️ Updating Flash Card...');

    const form = new FormData();
    form.append('description', 'Updated description: Affect = Action.');

    try {
        const res = await fetch(`${BASE_URL}/flash-cards/${flashCardId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        const data = await res.json();
        if (data.success) {
            console.log('✅ Flash Card Updated');
            console.log('New Description:', data.data.description);
        } else {
            console.error('❌ Update Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Update Error:', error.message);
    }
};

const archiveFlashCard = async () => {
    if (!flashCardId) return;
    console.log('\n📦 Archiving Flash Card...');

    try {
        const res = await fetch(`${BASE_URL}/flash-cards/${flashCardId}/archive`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            console.log(`✅ Flash Card ${data.data.isArchived ? 'Archived' : 'Unarchived'}`);
        } else {
            console.error('❌ Archive Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Archive Error:', error.message);
    }
};

const deleteFlashCard = async () => {
    if (!flashCardId) return;
    console.log('\n🗑️ Deleting Flash Card...');

    try {
        const res = await fetch(`${BASE_URL}/flash-cards/${flashCardId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            console.log('✅ Flash Card Deleted');
        } else {
            console.error('❌ Delete Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Delete Error:', error.message);
    }
};

const runTests = async () => {
    try {
        await loginAdmin();
        await createFlashCard();
        await getFlashCards();
        await updateFlashCard();
        await archiveFlashCard();
        await deleteFlashCard();
    } catch (error) {
        console.error('Test Suite Error:', error);
    }
};

runTests();

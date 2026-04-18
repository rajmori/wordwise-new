import { API_BASE_URL } from '../config.js';
import { requireAuth, getAdminToken, clearAdminSession, logout } from './auth-utils.js';

// Require Auth
// Require Auth
requireAuth(true);

// Logout Logic
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logout();
});

// State
let allCards = [];
let filteredCards = [];

// API Helper
const apiCall = async (endpoint, options = {}) => {
    const token = getAdminToken();
    if (!token) {
        clearAdminSession();
        window.location.href = './login.html';
        return;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
};

// Fetch Cards
const fetchCards = async () => {
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');
    const grid = document.getElementById('cardsGrid');

    try {
        loading.style.display = 'flex';
        grid.style.display = 'none';
        empty.style.display = 'none';

        const { data } = await apiCall('/flash-cards');
        allCards = data || [];
        filterCards();

        loading.style.display = 'none';

        if (allCards.length === 0) {
            empty.style.display = 'flex';
        } else {
            grid.style.display = 'grid';
        }
    } catch (error) {
        console.error('Error fetching cards:', error);
        loading.style.display = 'none';
        alert('Failed to load flash cards');
    }
};

// Render Cards
const renderCards = () => {
    const grid = document.getElementById('cardsGrid');

    if (filteredCards.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No cards match your filter.</p>';
        return;
    }

    grid.innerHTML = filteredCards.map(card => `
        <div class="flash-card-item ${card.isArchived ? 'archived' : ''}" style="${card.isArchived ? 'opacity: 0.6;' : ''}">
            <img src="${card.imageUrl}" alt="${card.word1} vs ${card.word2}" class="flash-card-image">
            <div class="flash-card-content">
                <div class="flash-card-words">${card.word1} <span style="font-weight:400; font-size: 0.9em; color:#888;">vs</span> ${card.word2}</div>
                <span class="flash-card-category">${card.category}</span>
                <p class="flash-card-desc">${card.description || ''}</p>
                <div class="flash-card-tags">
                    ${card.tags.map(tag => `<span class="flash-card-tag">#${tag}</span>`).join('')}
                </div>
            </div>
            <div class="flash-card-actions">
                <button class="btn-icon" onclick="editCard('${card._id}')" title="Edit">✏️</button>
                <button class="btn-icon" onclick="toggleArchive('${card._id}')" title="${card.isArchived ? 'Unarchive' : 'Archive'}">
                    ${card.isArchived ? '📤' : '📦'}
                </button>
                <button class="btn-icon delete" onclick="confirmDelete('${card._id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
};

// Filter Logic
const filterCards = () => {
    const search = document.getElementById('searchCards').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;

    filteredCards = allCards.filter(card => {
        const matchesSearch =
            card.word1.toLowerCase().includes(search) ||
            card.word2.toLowerCase().includes(search) ||
            (card.tags && card.tags.some(t => t.toLowerCase().includes(search)));

        const matchesCategory = !category || card.category === category;

        return matchesSearch && matchesCategory;
    });

    renderCards();
};

// Listeners
document.getElementById('searchCards').addEventListener('input', filterCards);
document.getElementById('filterCategory').addEventListener('change', filterCards);

// Modal Logic
window.editCard = (id) => {
    const card = allCards.find(c => c._id === id);
    if (!card) return;

    document.getElementById('modalTitle').textContent = 'Edit Flash Card';
    document.getElementById('cardId').value = card._id;
    document.getElementById('word1').value = card.word1;
    document.getElementById('word2').value = card.word2;
    document.getElementById('category').value = card.category;
    document.getElementById('description').value = card.description || '';
    document.getElementById('tags').value = card.tags.join(', ');

    // Image preview
    const preview = document.getElementById('imagePreview');
    preview.src = card.imageUrl;
    preview.classList.add('active');

    // Reset file input (cannot set value)
    document.getElementById('image').value = '';
    // Make image optional for edit
    document.getElementById('image').removeAttribute('required');

    document.getElementById('cardModal').classList.add('active');
};

document.getElementById('addCardBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add Flash Card';
    document.getElementById('cardForm').reset();
    document.getElementById('cardId').value = '';
    document.getElementById('imagePreview').classList.remove('active');
    document.getElementById('image').setAttribute('required', 'required');
    document.getElementById('cardModal').classList.add('active');
});

// Form Submit
document.getElementById('cardForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveCardBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const id = document.getElementById('cardId').value;
        const formData = new FormData();
        formData.append('word1', document.getElementById('word1').value);
        formData.append('word2', document.getElementById('word2').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('tags', document.getElementById('tags').value); // Backend handles split

        const fileInput = document.getElementById('image');
        if (fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
        }

        const url = id ? `/flash-cards/${id}` : '/flash-cards';
        const method = id ? 'PUT' : 'POST';

        // Cannot use apiCall helper because we need to send FormData without Content-Type header (browser sets it)
        const token = getAdminToken();
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        window.closeModal('cardModal');
        fetchCards();
        alert('Card saved successfully!');
    } catch (error) {
        alert(error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Archive
window.toggleArchive = async (id) => {
    try {
        await apiCall(`/flash-cards/${id}/archive`, { method: 'PATCH' });
        fetchCards();
    } catch (error) {
        alert(error.message);
    }
};

// Delete
window.confirmDelete = (id) => {
    document.getElementById('deleteCardId').value = id;
    document.getElementById('deleteCardModal').classList.add('active');
};

window.confirmDeleteCard = async () => {
    const id = document.getElementById('deleteCardId').value;
    try {
        await apiCall(`/flash-cards/${id}`, { method: 'DELETE' });
        window.closeModal('deleteCardModal');
        fetchCards();
    } catch (error) {
        alert(error.message);
    }
};

// Image Preview
document.getElementById('image').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.classList.add('active');
        }
        reader.readAsDataURL(file);
    }
});

// Bulk Upload Logic
document.getElementById('bulkUploadBtn').addEventListener('click', () => {
    document.getElementById('bulkUploadForm').reset();
    document.getElementById('zipFileName').textContent = 'Click to select ZIP file';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('uploadResults').style.display = 'none';
    document.getElementById('startUploadBtn').disabled = false;
    document.getElementById('bulkUploadModal').classList.add('active');
});

document.getElementById('zipFile').addEventListener('change', function (e) {
    if (e.target.files[0]) {
        document.getElementById('zipFileName').textContent = e.target.files[0].name;
    }
});

document.getElementById('bulkUploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('startUploadBtn');
    const fileInput = document.getElementById('zipFile');
    const progress = document.getElementById('uploadProgress');
    const resultsDiv = document.getElementById('uploadResults');

    if (!fileInput.files[0]) return alert('Please select a ZIP file');

    btn.disabled = true;
    progress.style.display = 'block';
    resultsDiv.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const token = getAdminToken();
        const response = await fetch(`${API_BASE_URL}/flash-cards/bulk-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        progress.style.display = 'none';
        resultsDiv.style.display = 'block';

        if (data.success) {
            document.getElementById('resultSummary').textContent = data.message;
            const errorList = document.getElementById('errorList');
            errorList.innerHTML = '';

            if (data.results.errors.length > 0) {
                data.results.errors.forEach(err => {
                    const li = document.createElement('li');
                    li.textContent = `Row ${err.row} (${err.word}): ${err.error}`;
                    errorList.appendChild(li);
                });
            }
            fetchCards(); // Refresh list
        } else {
            document.getElementById('resultSummary').textContent = data.message;
            document.getElementById('resultSummary').style.color = 'red';
        }

    } catch (error) {
        progress.style.display = 'none';
        alert('Upload failed: ' + error.message);
        btn.disabled = false;
    }
});

// Close Modal Helper
window.closeModal = (id) => {
    document.getElementById(id).classList.remove('active');
};

// Start
fetchCards();

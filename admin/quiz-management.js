import { requireAuth, getAdminToken } from './auth-utils.js';

// Check authentication first
requireAuth(true);

function getHeaders() {
    const token = getAdminToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// State
let quizzes = [];
let questionCounter = 0;

// DOM Elements
const quizzesTableBody = document.getElementById('quizzesTableBody');
const searchInput = document.getElementById('searchQuizzes');
const filterAlphabet = document.getElementById('filterAlphabet');
const filterStatus = document.getElementById('filterStatus');
const createQuizBtn = document.getElementById('createQuizBtn');
const importQuizBtn = document.getElementById('importQuizBtn');
const quizModal = document.getElementById('quizModal');
const importModal = document.getElementById('importModal');
const quizForm = document.getElementById('quizForm');
const importForm = document.getElementById('importForm');
const questionsContainer = document.getElementById('questionsContainer');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const deleteQuizModal = document.getElementById('deleteQuizModal');
const previewQuizModal = document.getElementById('previewQuizModal');

// Constants
const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    populateAlphabets();
    loadQuizzes();
    setupEventListeners();
});

function populateAlphabets() {
    // Populate filter dropdown
    ALPHABETS.forEach(char => {
        const option = document.createElement('option');
        option.value = char;
        option.textContent = char;
        filterAlphabet.appendChild(option);
    });

    // Populate modal dropdown
    const modalSelect = document.getElementById('quizAlphabet');
    ALPHABETS.forEach(char => {
        const option = document.createElement('option');
        option.value = char;
        option.textContent = char;
        modalSelect.appendChild(option);
    });
}

function setupEventListeners() {
    // Search & Filter
    searchInput.addEventListener('input', debounce(loadQuizzes, 300));
    filterAlphabet.addEventListener('change', loadQuizzes);
    filterStatus.addEventListener('change', loadQuizzes);

    // Modal Actions
    createQuizBtn.addEventListener('click', openCreateModal);
    importQuizBtn.addEventListener('click', () => importModal.style.display = 'block');
    addQuestionBtn.addEventListener('click', () => addQuestionField());

    quizForm.addEventListener('submit', handleQuizSubmit);
    importForm.addEventListener('submit', handleImport);

    // Download Template
    document.getElementById('downloadTemplateBtn').addEventListener('click', (e) => {
        e.preventDefault();
        downloadTemplate();
    });

    // Close modals on outside click
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Delete Confirmation
    document.getElementById('confirmDeleteQuizBtn').addEventListener('click', executeDeleteQuiz);
}

// === API Interactions ===

async function loadQuizzes() {
    try {
        const alphabet = filterAlphabet.value;
        const status = filterStatus.value;
        const search = searchInput.value;

        const params = new URLSearchParams();
        if (alphabet) params.append('alphabet', alphabet);
        if (status) params.append('status', status);
        if (search) params.append('search', search);

        const response = await fetch(`http://localhost:3000/api/quizzes?${params}`, {
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            quizzes = data.quizzes;
            renderQuizzes(quizzes);
        } else {
            console.error('Failed to load quizzes:', data.message);
        }
    } catch (error) {
        console.error('Error loading quizzes:', error);
    }
}

async function handleQuizSubmit(e) {
    e.preventDefault();

    // Gather form data
    const quizId = document.getElementById('quizId').value;
    const alphabet = document.getElementById('quizAlphabet').value;
    const sequence = document.getElementById('quizSequence').value;
    const publishImmediately = document.getElementById('publishImmediately').checked;

    // Collect questions
    const questionElements = document.querySelectorAll('.question-item');
    const questions = [];

    try {
        questionElements.forEach((el, index) => {
            const text = el.querySelector('.q-text').value.trim();
            const optionInputs = el.querySelectorAll('.q-option');
            const options = Array.from(optionInputs).map(opt => opt.value.trim());

            // Find selected radio
            // Note: Radio buttons in different question blocks need unique names if done traditionally 
            // OR we check checking status explicitly within the scoped element
            let correctOption = -1;
            const radioInputs = el.querySelectorAll('.q-correct');
            radioInputs.forEach((radio, i) => {
                if (radio.checked) correctOption = i;
            });

            if (!text) throw new Error(`Question ${index + 1} text is required.`);
            if (options.some(o => !o)) throw new Error(`All options for Question ${index + 1} are required.`);
            if (correctOption === -1) throw new Error(`Please select a correct answer for Question ${index + 1}.`);

            const hint = el.querySelector('.q-hint').value.trim();

            questions.push({ text, options, correctOption, hint });
        });
    } catch (validationError) {
        alert(validationError.message);
        return;
    }

    const payload = {
        alphabet,
        sequence: parseInt(sequence),
        questions,
        status: publishImmediately ? 'published' : 'draft'
    };

    if (!payload.questions.length && payload.status === 'published') {
        alert('Cannot publish a quiz with no questions.');
        return;
    }

    try {
        const url = quizId
            ? `http://localhost:3000/api/quizzes/${quizId}`
            : 'http://localhost:3000/api/quizzes';

        const method = quizId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            closeModal('quizModal');
            loadQuizzes();
            // Show success toast/alert
        } else {
            alert(result.message || 'Operation failed');
        }
    } catch (error) {
        console.error('Error saving quiz:', error);
        alert('An error occurred while saving the quiz.');
    }
}

async function deleteQuiz(id, title) {
    document.getElementById('deleteQuizId').value = id;
    document.getElementById('deleteQuizTitle').textContent = title;
    deleteQuizModal.style.display = 'block';
}

async function executeDeleteQuiz() {
    const id = document.getElementById('deleteQuizId').value;
    try {
        const response = await fetch(`http://localhost:3000/api/quizzes/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const result = await response.json();
        if (result.success) {
            closeModal('deleteQuizModal');
            loadQuizzes();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error deleting quiz:', error);
    }
}

async function handleImport(e) {
    e.preventDefault();

    const fileInput = document.getElementById('csvFile');
    const statusDiv = document.getElementById('importStatus');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Importing...';
        statusDiv.style.display = 'none';

        // Headers object for fetch - exclude Content-Type so browser sets boundary for multipart
        const headers = getHeaders();
        delete headers['Content-Type'];

        const response = await fetch('http://localhost:3000/api/quizzes/import', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            closeModal('importModal');
            importForm.reset();
            loadQuizzes();
        } else {
            statusDiv.className = 'status-message error';
            statusDiv.textContent = result.message;
            if (result.errors) {
                statusDiv.innerHTML += '<ul style="margin-top:5px;text-align:left;">' +
                    result.errors.slice(0, 5).map(e => `<li>${e}</li>`).join('') +
                    (result.errors.length > 5 ? `<li>...and ${result.errors.length - 5} more</li>` : '') +
                    '</ul>';
            }
            statusDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Import error:', error);
        statusDiv.textContent = 'An error occurred during import.';
        statusDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload & Import';
    }
}

function downloadTemplate() {
    const headers = ['Alphabet', 'Sequence', 'Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option (A/B/C/D)', 'Hint'];
    const sampleRow = ['A', '1', 'What is the color of the sky?', 'Blue', 'Green', 'Red', 'Yellow', 'A', 'Look up'];

    const csvContent = [
        headers.join(','),
        sampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// === UI Rendering ===

function renderQuizzes(list) {
    quizzesTableBody.innerHTML = '';

    if (list.length === 0) {
        quizzesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No quizzes found</td></tr>`;
        return;
    }

    list.forEach(quiz => {
        const row = document.createElement('tr');
        const badgeClass = quiz.status === 'published' ? 'badge-success' : 'badge-warning';

        row.innerHTML = `
            <td>
                <div class="user-info">
                    <div class="user-details">
                        <span class="user-name">${quiz.title || (quiz.alphabet + '-' + quiz.sequence)}</span>
                    </div>
                </div>
            </td>
            <td>${quiz.questions.length}</td>
            <td><span class="status-badge ${badgeClass}">${capitalize(quiz.status)}</span></td>
            <td>Admin</td>
            <td>${new Date(quiz.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="window.editQuiz('${quiz.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="window.previewQuiz('${quiz.id}')" title="Preview">👁️</button>
                    ${quiz.status !== 'published' ? `<button class="btn-icon delete-btn" onclick="window.requestDelete('${quiz.id}', '${quiz.title}')" title="Delete">🗑️</button>` : ''}
                </div>
            </td>
        `;
        quizzesTableBody.appendChild(row);
    });
}

function openCreateModal() {
    document.getElementById('quizForm').reset();
    document.getElementById('quizId').value = '';
    document.getElementById('quizModalTitle').innerText = 'Create New Quiz';
    questionsContainer.innerHTML = '';
    questionCounter = 0;

    // Add one empty question by default
    addQuestionField();

    quizModal.style.display = 'block';
}

async function editQuiz(id) {
    const quiz = quizzes.find(q => q.id === id);
    if (!quiz) return;

    document.getElementById('quizId').value = quiz.id;
    document.getElementById('quizAlphabet').value = quiz.alphabet;
    document.getElementById('quizSequence').value = quiz.sequence;
    document.getElementById('publishImmediately').checked = quiz.status === 'published';
    document.getElementById('quizModalTitle').innerText = 'Edit Quiz: ' + quiz.title;

    questionsContainer.innerHTML = '';
    questionCounter = 0;

    quiz.questions.forEach(q => {
        addQuestionField(q);
    });

    quizModal.style.display = 'block';
}

function addQuestionField(data = null) {
    const template = document.getElementById('questionTemplate');
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.question-item');

    questionCounter++;
    item.querySelector('.q-number').innerText = questionCounter;

    // Unique name for radio buttons in this group
    const radioName = `correct-${Date.now()}-${Math.random()}`;
    item.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.name = radioName;
    });

    if (data) {
        item.querySelector('.q-text').value = data.text;
        const options = item.querySelectorAll('.q-option');
        data.options.forEach((opt, i) => options[i].value = opt);

        const radios = item.querySelectorAll('.q-correct');
        if (radios[data.correctOption]) {
            radios[data.correctOption].checked = true;
        }

        item.querySelector('.q-hint').value = data.hint || '';
    }

    // Delete button logic
    item.querySelector('.delete-q-btn').addEventListener('click', function () {
        item.remove();
        updateQuestionNumbers();
    });

    questionsContainer.appendChild(item);
}

function updateQuestionNumbers() {
    const items = questionsContainer.querySelectorAll('.question-item');
    items.forEach((item, index) => {
        item.querySelector('.q-number').innerText = index + 1;
    });
    questionCounter = items.length;
}

function previewQuiz(id) {
    const quiz = quizzes.find(q => q.id === id);
    if (!quiz) return;

    const container = document.getElementById('previewContainer');
    document.getElementById('previewTitle').innerText = quiz.title;

    let html = '';
    quiz.questions.forEach((q, idx) => {
        html += `
            <div class="preview-question">
                <h4>${idx + 1}. ${q.text}</h4>
                <div class="preview-options">
                    ${q.options.map((opt, i) => `
                        <div class="preview-option ${i === q.correctOption ? 'correct-answer' : ''}">
                            <span class="opt-label">${String.fromCharCode(65 + i)}</span>
                            ${opt}
                            ${i === q.correctOption ? '✅' : ''}
                        </div>
                    `).join('')}
                </div>
                ${q.hint ? `<p class="preview-hint">💡 Hint: ${q.hint}</p>` : ''}
            </div>
            <hr>
        `;
    });

    container.innerHTML = html;
    previewQuizModal.style.display = 'block';
}

// Utils
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Expose functions to window for onclick handlers
window.editQuiz = editQuiz;
window.previewQuiz = previewQuiz;
window.requestDelete = deleteQuiz;

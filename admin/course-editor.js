// Course Editor JavaScript
import { API_BASE_URL } from '../config.js';
import { requireAuth, getAdminToken, clearAdminSession } from './auth-utils.js';

// Require authentication on page load
requireAuth(true);

// Get course ID from URL if editing
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');
const isEditMode = !!courseId;

// State
let courseData = {
    title: '',
    description: '',
    learningOutcomes: [],
    difficultyLevel: '',
    estimatedDuration: { value: 1, unit: 'days' },
    targetAudience: [],
    modules: [],
    instructor: '',
    category: '',
    price: 0,
    thumbnailUrl: '',
    status: 'draft'
};

let currentLessonData = {
    title: '',
    description: '',
    contentType: 'text',
    textContent: '',
    imageUrl: '',
    videoUrl: '',
    documentUrl: '',
    interactiveExamples: [],
    tags: [],
    duration: 0
};

// API Helper with automatic session validation
const apiCall = async (endpoint, options = {}) => {
    try {
        // Re-check auth before each API call
        const currentToken = getAdminToken();
        if (!currentToken) {
            clearAdminSession();
            alert('Your session has expired. Please login again.');
            window.location.href = './login.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle 401 Unauthorized (token expired on server)
            if (response.status === 401) {
                clearAdminSession();
                alert('Your session has expired. Please login again.');
                window.location.href = './login.html';
                // Add a small delay to ensure alert is seen (optional) or just return null
                return null;
            }
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Initialize
if (isEditMode) {
    document.getElementById('editorTitle').textContent = 'Edit Course';
    loadCourse();
} else {
    document.getElementById('editorTitle').textContent = 'Create New Course';
}

// Load course data for editing
async function loadCourse() {
    try {
        const response = await apiCall(`/courses/${courseId}/admin`);
        if (!response) return; // Stop if redirecting
        const { data } = response;
        courseData = data;

        // Populate form
        document.getElementById('courseTitle').value = courseData.title || '';
        document.getElementById('courseDescription').value = courseData.description || '';
        document.getElementById('difficultyLevel').value = courseData.difficultyLevel || '';
        document.getElementById('instructor').value = courseData.instructor || '';
        document.getElementById('durationValue').value = courseData.estimatedDuration?.value || 1;
        document.getElementById('durationUnit').value = courseData.estimatedDuration?.unit || 'days';
        document.getElementById('category').value = courseData.category || '';
        document.getElementById('coursePrice').value = courseData.price || 0;

        // Populate Thumbnail
        if (courseData.thumbnailUrl) {
            document.getElementById('thumbnailUrl').value = courseData.thumbnailUrl;
            document.getElementById('thumbnailPreviewImg').src = courseData.thumbnailUrl;
            const placeholder = document.querySelector('#thumbnailUploadArea .upload-placeholder');
            if (placeholder) placeholder.style.display = 'none';
            const preview = document.getElementById('thumbnailPreview');
            if (preview) preview.style.display = 'block';
        }

        // Show Course ID if exists
        const idDisplay = document.getElementById('courseIdDisplay');
        if (idDisplay) {
            idDisplay.textContent = (courseData.courseId || 'Will be generated on save');
        }

        // Render arrays
        renderLearningOutcomes();
        renderTargetAudience();
        renderModules();
    } catch (error) {
        alert('Failed to load course: ' + error.message);
        window.location.href = './courses.html';
    }
}

// Learning Outcomes
function renderLearningOutcomes() {
    const list = document.getElementById('learningOutcomesList');
    list.innerHTML = courseData.learningOutcomes.map((outcome, index) => `
        <div class="tag-item">
            <span>${outcome}</span>
            <button type="button" class="tag-remove" onclick="removeLearningOutcome(${index})">×</button>
        </div>
    `).join('');
}

document.getElementById('addLearningOutcome').addEventListener('click', () => {
    const input = document.getElementById('learningOutcomeInput');
    const value = input.value.trim();

    if (value) {
        courseData.learningOutcomes.push(value);
        renderLearningOutcomes();
        input.value = '';
    }
});

window.removeLearningOutcome = (index) => {
    courseData.learningOutcomes.splice(index, 1);
    renderLearningOutcomes();
};

// Target Audience
function renderTargetAudience() {
    const list = document.getElementById('targetAudienceList');
    list.innerHTML = courseData.targetAudience.map((audience, index) => `
        <div class="tag-item">
            <span>${audience}</span>
            <button type="button" class="tag-remove" onclick="removeTargetAudience(${index})">×</button>
        </div>
    `).join('');
}

document.getElementById('addTargetAudience').addEventListener('click', () => {
    const input = document.getElementById('targetAudienceInput');
    const value = input.value.trim();

    if (value) {
        courseData.targetAudience.push(value);
        renderTargetAudience();
        input.value = '';
    }
});

window.removeTargetAudience = (index) => {
    courseData.targetAudience.splice(index, 1);
    renderTargetAudience();
};

// Modules
function renderModules() {
    const container = document.getElementById('modulesContainer');

    if (courseData.modules.length === 0) {
        container.innerHTML = '<p class="empty-message">No modules yet. Click "Add Module" to get started.</p>';
        return;
    }

    container.innerHTML = courseData.modules.map((module, index) => `
        <div class="module-card">
            <div class="module-header">
                <div class="module-info">
                    <h3>${module.title}</h3>
                    <p>${module.description || 'No description'}</p>
                </div>
                <div class="module-actions">
                    <button type="button" class="btn-icon" onclick="editModule(${index})" title="Edit Module">✏️</button>
                    <button type="button" class="btn-icon" onclick="deleteModule(${index})" title="Delete Module">🗑️</button>
                </div>
            </div>
            <div class="module-lessons">
                <div class="lessons-header">
                    <h4>Lessons (${module.lessons?.length || 0})</h4>
                    <button type="button" class="btn-secondary-admin btn-sm" onclick="addLesson('${module._id || index}')">+ Add Lesson</button>
                </div>
                <div class="lessons-list" id="lessons-${index}">
                    ${renderModuleLessons(module, index)}
                </div>
            </div>
        </div>
    `).join('');
}

function renderModuleLessons(module, moduleIndex) {
    if (!module.lessons || module.lessons.length === 0) {
        return '<p class="empty-message-small">No lessons yet</p>';
    }

    return module.lessons.map((lesson, lessonIndex) => `
        <div class="lesson-item">
            <div class="lesson-info">
                <span class="lesson-number">${lessonIndex + 1}</span>
                <div>
                    <h5>${lesson.title || 'Untitled Lesson'}</h5>
                    <span class="lesson-meta">${lesson.contentType} • ${lesson.duration || 0} min</span>
                </div>
            </div>
            <div class="lesson-actions">
                <button type="button" class="btn-icon-small" onclick="editLesson('${module._id || moduleIndex}', ${lessonIndex})" title="Edit">✏️</button>
                <button type="button" class="btn-icon-small" onclick="deleteLesson(${moduleIndex}, ${lessonIndex})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Add Module
document.getElementById('addModuleBtn').addEventListener('click', () => {
    document.getElementById('moduleModalTitle').textContent = 'Add Module';
    document.getElementById('editModuleIndex').value = '';
    document.getElementById('moduleTitle').value = '';
    document.getElementById('moduleDescription').value = '';
    document.getElementById('moduleModal').classList.add('active');
});

// Edit Module
window.editModule = (index) => {
    const module = courseData.modules[index];
    document.getElementById('moduleModalTitle').textContent = 'Edit Module';
    document.getElementById('editModuleIndex').value = index;
    document.getElementById('moduleTitle').value = module.title;
    document.getElementById('moduleDescription').value = module.description || '';
    document.getElementById('moduleModal').classList.add('active');
};

// Save Module
document.getElementById('saveModuleBtn').addEventListener('click', () => {
    const title = document.getElementById('moduleTitle').value.trim();
    const description = document.getElementById('moduleDescription').value.trim();
    const editIndex = document.getElementById('editModuleIndex').value;

    if (!title) {
        alert('Module title is required');
        return;
    }

    const moduleData = {
        title,
        description,
        order: editIndex !== '' ? courseData.modules[editIndex].order : courseData.modules.length,
        lessons: editIndex !== '' ? courseData.modules[editIndex].lessons : []
    };

    if (editIndex !== '') {
        // Edit existing module
        courseData.modules[editIndex] = { ...courseData.modules[editIndex], ...moduleData };
    } else {
        // Add new module
        courseData.modules.push(moduleData);
    }

    renderModules();
    closeModal('moduleModal');
});

// Delete Module
window.deleteModule = (index) => {
    if (confirm('Are you sure you want to delete this module and all its lessons?')) {
        courseData.modules.splice(index, 1);
        renderModules();
    }
};

// Add Lesson
window.addLesson = (moduleId) => {
    document.getElementById('lessonModalTitle').textContent = 'Add Lesson';
    document.getElementById('lessonModuleId').value = moduleId;
    document.getElementById('editLessonId').value = '';

    // Reset form
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonDescription').value = '';
    document.getElementById('contentType').value = 'text';
    document.getElementById('lessonDuration').value = '';
    document.getElementById('textContent').value = '';
    document.getElementById('imageUrl').value = '';
    document.getElementById('videoUrl').value = '';

    currentLessonData = {
        title: '',
        description: '',
        contentType: 'text',
        textContent: '',
        imageUrl: '',
        videoUrl: '',
        interactiveExamples: [],
        tags: [],
        duration: 0
    };

    renderLessonTags();
    renderInteractiveExamples();
    updateContentSections();

    document.getElementById('lessonModal').classList.add('active');
};

// Edit Lesson
window.editLesson = (moduleId, lessonIndex) => {
    const moduleIndex = courseData.modules.findIndex(m => (m._id || courseData.modules.indexOf(m)) == moduleId);
    const lesson = courseData.modules[moduleIndex].lessons[lessonIndex];

    document.getElementById('lessonModalTitle').textContent = 'Edit Lesson';
    document.getElementById('lessonModuleId').value = moduleId;
    document.getElementById('editLessonId').value = lessonIndex;

    // Populate form
    document.getElementById('lessonTitle').value = lesson.title || '';
    document.getElementById('lessonDescription').value = lesson.description || '';
    document.getElementById('contentType').value = lesson.contentType || 'text';
    document.getElementById('lessonDuration').value = lesson.duration || '';
    document.getElementById('textContent').value = lesson.textContent || '';
    document.getElementById('imageUrl').value = lesson.imageUrl || '';
    document.getElementById('videoUrl').value = lesson.videoUrl || '';
    document.getElementById('documentUrl').value = lesson.documentUrl || '';

    // Document Preview
    if (lesson.documentUrl) {
        document.getElementById('documentName').textContent = lesson.documentUrl.split('/').pop();
        document.querySelector('#documentUploadArea .upload-placeholder').style.display = 'none';
        document.getElementById('documentPreview').style.display = 'block';
    } else {
        document.querySelector('#documentUploadArea .upload-placeholder').style.display = 'flex';
        document.getElementById('documentPreview').style.display = 'none';
    }

    currentLessonData = { ...lesson };

    renderLessonTags();
    renderInteractiveExamples();
    updateContentSections();

    document.getElementById('lessonModal').classList.add('active');
};

// Delete Lesson
window.deleteLesson = (moduleIndex, lessonIndex) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
        courseData.modules[moduleIndex].lessons.splice(lessonIndex, 1);
        renderModules();
    }
};

// Content Type Change
document.getElementById('contentType').addEventListener('change', updateContentSections);

function updateContentSections() {
    const contentType = document.getElementById('contentType').value;

    document.getElementById('textContentSection').style.display =
        (contentType === 'text' || contentType === 'mixed') ? 'block' : 'none';
    document.getElementById('imageContentSection').style.display =
        (contentType === 'image' || contentType === 'mixed') ? 'block' : 'none';
    document.getElementById('videoContentSection').style.display =
        (contentType === 'video' || contentType === 'mixed') ? 'block' : 'none';
    document.getElementById('documentContentSection').style.display =
        (contentType === 'document' || contentType === 'mixed') ? 'block' : 'none';
    document.getElementById('interactiveContentSection').style.display =
        (contentType === 'interactive' || contentType === 'mixed') ? 'block' : 'none';
}

// Thumbnail Upload
document.getElementById('thumbnailUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload .jpg, .jpeg, .png, or .svg');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Max size is 5MB');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('thumbnail', file);
        if (courseId) formData.append('courseId', courseId);

        const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('thumbnailUrl').value = data.data.url;
            document.getElementById('thumbnailPreviewImg').src = data.data.url;
            document.querySelector('#thumbnailUploadArea .upload-placeholder').style.display = 'none';
            document.getElementById('thumbnailPreview').style.display = 'block';
            courseData.thumbnailUrl = data.data.url;
        } else {
            alert('Thumbnail upload failed: ' + data.message);
        }
    } catch (error) {
        alert('Thumbnail upload failed: ' + error.message);
    }
});

window.removeThumbnail = () => {
    document.getElementById('thumbnailUrl').value = '';
    document.getElementById('thumbnailUpload').value = '';
    document.querySelector('#thumbnailUploadArea .upload-placeholder').style.display = 'flex';
    document.getElementById('thumbnailPreview').style.display = 'none';
    courseData.thumbnailUrl = '';
};

// Image Upload (Lesson)
document.getElementById('imageUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const formData = new FormData();
        formData.append('image', file);
        if (courseId) formData.append('courseId', courseId);

        const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('imageUrl').value = data.data.url;
            document.getElementById('imagePreviewImg').src = data.data.url;
            document.querySelector('#imageUploadArea .upload-placeholder').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'block';
        } else {
            alert('Image upload failed: ' + data.message);
        }
    } catch (error) {
        alert('Image upload failed: ' + error.message);
    }
});

window.removeImage = () => {
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageUpload').value = '';
    document.querySelector('#imageUploadArea .upload-placeholder').style.display = 'flex';
    document.getElementById('imagePreview').style.display = 'none';
};

// Video Upload
document.getElementById('videoUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
        alert('Invalid file format. Please upload .mp4 or .webm');
        return;
    }

    if (file.size > 100 * 1024 * 1024) {
        alert('Video is too large. Max size is 100MB');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('video', file);
        if (courseId) formData.append('courseId', courseId);

        // Show progress
        document.querySelector('#videoUploadArea .upload-placeholder').style.display = 'none';
        document.getElementById('uploadProgress').style.display = 'block';

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                document.getElementById('progressFill').style.width = percentComplete + '%';
                document.getElementById('progressText').textContent = `Uploading... ${Math.round(percentComplete)}%`;
            }
        });

        xhr.addEventListener('load', () => {
            const data = JSON.parse(xhr.responseText);

            if (data.success) {
                document.getElementById('videoUrl').value = data.data.url;
                document.getElementById('videoPreviewVideo').src = data.data.url;
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('videoPreview').style.display = 'block';
            } else {
                alert('Video upload failed: ' + data.message);
                document.getElementById('uploadProgress').style.display = 'none';
                document.querySelector('#videoUploadArea .upload-placeholder').style.display = 'flex';
            }
        });

        xhr.open('POST', `${API_BASE_URL}/upload/video`);
        xhr.setRequestHeader('Authorization', `Bearer ${getAdminToken()}`);
        xhr.send(formData);

    } catch (error) {
        alert('Video upload failed: ' + error.message);
        document.getElementById('uploadProgress').style.display = 'none';
        document.querySelector('#videoUploadArea .upload-placeholder').style.display = 'flex';
    }
});

window.removeVideo = () => {
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoUpload').value = '';
    document.querySelector('#videoUploadArea .upload-placeholder').style.display = 'flex';
    document.getElementById('videoPreview').style.display = 'none';
};

// Document Upload
document.getElementById('documentUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (file.type !== 'application/pdf') {
        alert('Only .pdf files are allowed');
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        alert('Document is too large. Max size is 20MB');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('document', file);
        if (courseId) formData.append('courseId', courseId);

        // Show progress
        document.querySelector('#documentUploadArea .upload-placeholder').style.display = 'none';
        document.getElementById('docUploadProgress').style.display = 'block';

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                document.getElementById('docProgressFill').style.width = percentComplete + '%';
                document.getElementById('docProgressText').textContent = `Uploading... ${Math.round(percentComplete)}%`;
            }
        });

        xhr.addEventListener('load', () => {
            const data = JSON.parse(xhr.responseText);

            if (data.success) {
                document.getElementById('documentUrl').value = data.data.url;
                document.getElementById('documentName').textContent = file.name;
                document.getElementById('docUploadProgress').style.display = 'none';
                document.getElementById('documentPreview').style.display = 'block';
            } else {
                alert('Document upload failed: ' + data.message);
                document.getElementById('docUploadProgress').style.display = 'none';
                document.querySelector('#documentUploadArea .upload-placeholder').style.display = 'flex';
            }
        });

        xhr.open('POST', `${API_BASE_URL}/upload/document`);
        xhr.setRequestHeader('Authorization', `Bearer ${getAdminToken()}`);
        xhr.send(formData);

    } catch (error) {
        alert('Document upload failed: ' + error.message);
        document.getElementById('docUploadProgress').style.display = 'none';
        document.querySelector('#documentUploadArea .upload-placeholder').style.display = 'flex';
    }
});

window.removeDocument = () => {
    document.getElementById('documentUrl').value = '';
    document.getElementById('documentUpload').value = '';
    document.querySelector('#documentUploadArea .upload-placeholder').style.display = 'flex';
    document.getElementById('documentPreview').style.display = 'none';
};

// Interactive Examples
function renderInteractiveExamples() {
    const list = document.getElementById('interactiveExamplesList');

    if (!currentLessonData.interactiveExamples || currentLessonData.interactiveExamples.length === 0) {
        list.innerHTML = '<p class="empty-message-small">No examples yet</p>';
        return;
    }

    list.innerHTML = currentLessonData.interactiveExamples.map((example, index) => `
        <div class="example-item">
            <div class="example-info">
                <span class="example-type">${example.type}</span>
                <p>${example.question}</p>
            </div>
            <button type="button" class="btn-icon-small" onclick="removeExample(${index})">🗑️</button>
        </div>
    `).join('');
}

document.getElementById('addInteractiveExample').addEventListener('click', () => {
    document.getElementById('exampleType').value = 'fill-in-blank';
    document.getElementById('exampleQuestion').value = '';
    document.getElementById('exampleAnswer').value = '';
    document.getElementById('exampleExplanation').value = '';
    document.getElementById('exampleModal').classList.add('active');
});

document.getElementById('saveExampleBtn').addEventListener('click', () => {
    const example = {
        type: document.getElementById('exampleType').value,
        question: document.getElementById('exampleQuestion').value.trim(),
        answer: document.getElementById('exampleAnswer').value.trim(),
        explanation: document.getElementById('exampleExplanation').value.trim()
    };

    if (!example.question || !example.answer) {
        alert('Question and answer are required');
        return;
    }

    if (!currentLessonData.interactiveExamples) {
        currentLessonData.interactiveExamples = [];
    }

    currentLessonData.interactiveExamples.push(example);
    renderInteractiveExamples();
    closeModal('exampleModal');
});

window.removeExample = (index) => {
    currentLessonData.interactiveExamples.splice(index, 1);
    renderInteractiveExamples();
};

// Lesson Tags
function renderLessonTags() {
    const list = document.getElementById('lessonTagsList');

    if (!currentLessonData.tags || currentLessonData.tags.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = currentLessonData.tags.map((tag, index) => `
        <div class="tag-item">
            <span>${tag}</span>
            <button type="button" class="tag-remove" onclick="removeLessonTag(${index})">×</button>
        </div>
    `).join('');
}

document.getElementById('addLessonTag').addEventListener('click', () => {
    const input = document.getElementById('lessonTagInput');
    const value = input.value.trim();

    if (value) {
        if (!currentLessonData.tags) {
            currentLessonData.tags = [];
        }
        currentLessonData.tags.push(value);
        renderLessonTags();
        input.value = '';
    }
});

window.removeLessonTag = (index) => {
    currentLessonData.tags.splice(index, 1);
    renderLessonTags();
};

// Save Lesson
document.getElementById('saveLessonBtn').addEventListener('click', () => {
    const moduleId = document.getElementById('lessonModuleId').value;
    const editLessonId = document.getElementById('editLessonId').value;

    const lessonData = {
        _id: currentLessonData._id, // Preserve ID if editing
        title: document.getElementById('lessonTitle').value.trim(),
        description: document.getElementById('lessonDescription').value.trim(),
        contentType: document.getElementById('contentType').value,
        duration: parseInt(document.getElementById('lessonDuration').value) || 0,
        textContent: document.getElementById('textContent').value.trim(),
        imageUrl: document.getElementById('imageUrl').value.trim(),
        videoUrl: document.getElementById('videoUrl').value.trim(),
        documentUrl: document.getElementById('documentUrl').value.trim(),
        interactiveExamples: currentLessonData.interactiveExamples || [],
        tags: currentLessonData.tags || []
    };

    if (!lessonData.title) {
        alert('Lesson title is required');
        return;
    }

    const moduleIndex = courseData.modules.findIndex(m => (m._id || courseData.modules.indexOf(m)) == moduleId);

    if (!courseData.modules[moduleIndex].lessons) {
        courseData.modules[moduleIndex].lessons = [];
    }

    if (editLessonId !== '') {
        // Edit existing lesson
        courseData.modules[moduleIndex].lessons[editLessonId] = lessonData;
    } else {
        // Add new lesson
        courseData.modules[moduleIndex].lessons.push(lessonData);
    }

    renderModules();
    closeModal('lessonModal');
});

// Save Course
async function saveCourse(status = 'draft') {
    try {
        // Gather form data
        const formData = {
            title: document.getElementById('courseTitle').value.trim(),
            description: document.getElementById('courseDescription').value.trim(),
            thumbnailUrl: document.getElementById('thumbnailUrl').value.trim(),
            difficultyLevel: document.getElementById('difficultyLevel').value,
            estimatedDuration: {
                value: parseInt(document.getElementById('durationValue').value),
                unit: document.getElementById('durationUnit').value
            },
            instructor: document.getElementById('instructor').value.trim(),
            category: document.getElementById('category').value.trim(),
            price: parseInt(document.getElementById('coursePrice').value) || 0,
            learningOutcomes: courseData.learningOutcomes,
            targetAudience: courseData.targetAudience,
            // Include lessons in modules
            modules: courseData.modules.map(module => ({
                ...module,
                lessons: (module.lessons || []).map(lesson => ({
                    ...lesson,
                    // Ensure numeric values
                    duration: parseInt(lesson.duration) || 0
                }))
            })),
            status: status
        };

        // Validate
        if (!formData.title || !formData.description || !formData.difficultyLevel) {
            alert('Please fill in all required fields');
            return;
        }

        let result;
        if (isEditMode) {
            result = await apiCall(`/courses/${courseId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            result = await apiCall('/courses', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }

        alert(`Course ${status === 'published' ? 'published' : 'saved as draft'} successfully!`);
        window.location.href = './courses.html';

    } catch (error) {
        alert('Failed to save course: ' + error.message);
    }
}

// Save as Draft
document.getElementById('saveDraftBtn').addEventListener('click', () => {
    saveCourse('draft');
});

// Publish Course
document.getElementById('publishBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to publish this course? It will be visible to all users.')) {
        saveCourse('published');
    }
});

// Close Modal
window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.remove('active');
};

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Course Management JavaScript
import { API_BASE_URL } from '../config.js';
import { requireAuth, getAdminToken, clearAdminSession, logout } from './auth-utils.js';

// Require authentication on page load
requireAuth(true);

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
                return;
            }
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// State
let allCourses = [];
let filteredCourses = [];

// Fetch and display statistics
const fetchStats = async () => {
    try {
        const { data } = await apiCall('/courses/stats');

        document.getElementById('totalCourses').textContent = data.totalCourses || 0;
        document.getElementById('publishedCourses').textContent = data.publishedCourses || 0;
        document.getElementById('draftCourses').textContent = data.draftCourses || 0;
        document.getElementById('totalEnrollments').textContent = data.totalEnrollments || 0;
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

// Fetch all courses
const fetchCourses = async () => {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const coursesGrid = document.getElementById('coursesGrid');

    try {
        loadingState.style.display = 'flex';
        coursesGrid.style.display = 'none';
        emptyState.style.display = 'none';

        const { data } = await apiCall('/courses?limit=100');
        allCourses = data || [];
        filteredCourses = [...allCourses];

        loadingState.style.display = 'none';

        if (allCourses.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            coursesGrid.style.display = 'grid';
            renderCourses();
        }
    } catch (error) {
        loadingState.style.display = 'none';
        console.error('Error fetching courses:', error);
        alert('Failed to load courses. Please check if the backend server is running.');
    }
};

// Render courses grid
const renderCourses = () => {
    const coursesGrid = document.getElementById('coursesGrid');

    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🔍</div>
                <h3>No courses found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }

    coursesGrid.innerHTML = filteredCourses.map(course => `
        <div class="course-card">
            <div class="course-card-header">
                <span class="status-badge ${course.status}">${course.status}</span>
                <span class="course-id-label">${course.courseId || 'NO ID'}</span>
                <span class="difficulty-badge ${course.difficultyLevel.toLowerCase()}">${course.difficultyLevel}</span>
            </div>
            <h3 class="course-title">${course.title}</h3>
            <p class="course-description">${course.description.substring(0, 120)}${course.description.length > 120 ? '...' : ''}</p>
            <div class="course-meta">
                <div class="meta-item">
                    <span class="meta-icon" title="Number of Modules">📖</span>
                    <span>${course.modules?.length || 0} modules</span>
                </div>
                <div class="meta-item">
                    <span class="meta-icon" title="Estimated Duration">⏱️</span>
                    <span>${course.estimatedDuration.value} ${course.estimatedDuration.unit}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-icon" title="Enrolled Students">👥</span>
                    <span>${course.enrollmentCount || 0} enrolled</span>
                </div>
                <div class="meta-item">
                    <span class="meta-icon" title="Course Price">💰</span>
                    <span>₹${course.price || 0}</span>
                </div>
            </div>
            <div class="course-actions">
                <button class="btn-icon-text" onclick="editCourse('${course._id}')" title="Edit Course">
                    ✏️ Edit
                </button>
                <button class="btn-icon-text ${course.status === 'published' ? 'published' : ''}" 
                        onclick="togglePublish('${course._id}', '${course.status}')" 
                        title="${course.status === 'published' ? 'Unpublish' : 'Publish'}">
                    ${course.status === 'published' ? '📤 Unpublish' : '📢 Publish'}
                </button>
                <button class="btn-icon-text danger" onclick="confirmDelete('${course._id}', '${course.title}')" title="Delete Course">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
};

// Search functionality
document.getElementById('searchCourses').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterCourses();
});

// Filter by status
document.getElementById('filterStatus').addEventListener('change', filterCourses);

// Filter by difficulty
document.getElementById('filterDifficulty').addEventListener('change', filterCourses);

// Filter courses
function filterCourses() {
    const searchTerm = document.getElementById('searchCourses').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const difficultyFilter = document.getElementById('filterDifficulty').value;

    filteredCourses = allCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || course.status === statusFilter;
        const matchesDifficulty = !difficultyFilter || course.difficultyLevel === difficultyFilter;

        return matchesSearch && matchesStatus && matchesDifficulty;
    });

    renderCourses();
}

// Edit course
window.editCourse = (courseId) => {
    window.location.href = `./course-editor.html?id=${courseId}`;
};

// Toggle publish status
window.togglePublish = async (courseId, currentStatus) => {
    try {
        const action = currentStatus === 'published' ? 'unpublish' : 'publish';
        if (!confirm(`Are you sure you want to ${action} this course?`)) {
            return;
        }

        await apiCall(`/courses/${courseId}/publish`, { method: 'PATCH' });

        // Refresh courses
        await fetchCourses();
        await fetchStats();

        alert(`Course ${action}ed successfully!`);
    } catch (error) {
        alert(`Failed to ${currentStatus === 'published' ? 'unpublish' : 'publish'} course: ${error.message}`);
    }
};

// Confirm delete
window.confirmDelete = (courseId, courseName) => {
    document.getElementById('deleteCourseId').value = courseId;
    document.getElementById('deleteCourseName').textContent = courseName;
    document.getElementById('deleteCourseModal').classList.add('active');
};

// Delete course
window.confirmDeleteCourse = async () => {
    const courseId = document.getElementById('deleteCourseId').value;

    try {
        await apiCall(`/courses/${courseId}`, { method: 'DELETE' });

        closeModal('deleteCourseModal');
        await fetchCourses();
        await fetchStats();

        alert('Course deleted successfully!');
    } catch (error) {
        alert(`Failed to delete course: ${error.message}`);
    }
};

// Close modal
window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.remove('active');
};

// Create course button
document.getElementById('createCourseBtn').addEventListener('click', () => {
    window.location.href = './course-editor.html';
});

// Logout
// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logout();
});

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Initialize
fetchStats();
fetchCourses();

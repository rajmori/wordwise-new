// Admin Panel JavaScript
import {
    isAdminAuthenticated,
    clearAdminSession,
    logout,
    saveLoginSession,
} from './auth-utils.js';
import { ADMIN_API_BASE_URL } from '../config.js';

const API_BASE = ADMIN_API_BASE_URL;

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken() {
    return localStorage.getItem('wordwise_admin_token');
}

async function apiRequest(method, path, body) {
    const opts = {
        method,
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);

    if (res.status === 401) {
        clearAdminSession();
        window.location.href = './login.html';
        return null;
    }

    return res.json();
}

// ── Utility ───────────────────────────────────────────────────────────────────

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toInputDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

// ── Toast notifications ───────────────────────────────────────────────────────

function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position:fixed;bottom:24px;right:24px;z-index:9999;
            display:flex;flex-direction:column;gap:10px;`;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        padding:12px 20px;border-radius:10px;color:#fff;font-size:14px;
        font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.3);
        opacity:0;transform:translateY(10px);
        transition:opacity .25s,transform .25s;
        background:${type === 'success' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#b91c1c)'};
        max-width:320px;`;
    toast.textContent = type === 'success' ? `✅ ${message}` : `❌ ${message}`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Admin Login Page ──────────────────────────────────────────────────────────

if (window.location.pathname.includes('admin/login.html')) {
    if (isAdminAuthenticated()) {
        window.location.href = './dashboard.html';
    }

    const loginForm = document.getElementById('adminLoginForm');
    const errorMessage = document.getElementById('adminErrorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const email    = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const loginBtn = document.getElementById('adminLoginBtn');
        const btnText  = loginBtn.querySelector('.btn-text');
        const loader   = loginBtn.querySelector('.loader');

        document.querySelectorAll('.error-msg').forEach(m => m.style.display = 'none');
        document.querySelectorAll('input').forEach(i => i.classList.remove('error'));

        let isValid = true;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('admin-email').classList.add('error');
            isValid = false;
        }
        if (!password) {
            document.getElementById('admin-password').classList.add('error');
            isValid = false;
        }
        if (!isValid) return;

        btnText.style.display = 'none';
        loader.style.display  = 'inline-block';
        loginBtn.disabled     = true;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success && (data.token || data.accessToken)) {
                saveLoginSession(data.token || data.accessToken, data.admin || data.user);
                window.location.href = './dashboard.html';
            } else {
                throw new Error(data.message || 'Invalid credentials');
            }
        } catch (error) {
            errorMessage.textContent = error.message || 'An error occurred during login.';
            errorMessage.style.display = 'block';
        } finally {
            btnText.style.display = 'inline-block';
            loader.style.display  = 'none';
            loginBtn.disabled     = false;
        }
    });
}

// ── Admin Dashboard Page ──────────────────────────────────────────────────────

if (window.location.pathname.includes('admin/dashboard.html')) {
    if (!isAdminAuthenticated()) {
        window.location.href = './login.html';
    }

    // Pagination state
    let currentPage  = 1;
    const PAGE_LIMIT = 10;
    let totalPages   = 1;
    let totalUsers   = 0;

    // Current search / filter values
    let searchTerm   = '';
    let statusFilter = 'all';

    // In-memory user cache for the current page (used by view/edit)
    let currentUsers = [];

    // ── API helpers ─────────────────────────────────────────────────────────

    async function fetchUsersPage(page, search, status) {
        const params = new URLSearchParams({ page, limit: PAGE_LIMIT });
        if (search) params.append('search', search);
        if (status && status !== 'all') params.append('status', status === 'Active' ? 'active' : 'inactive');
        return apiRequest('GET', `/users?${params}`);
    }

    async function fetchUserDetail(id) {
        return apiRequest('GET', `/users/${id}`);
    }

    // ── Load & render ────────────────────────────────────────────────────────

    async function loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">Loading…</td></tr>`;

        const data = await fetchUsersPage(currentPage, searchTerm, statusFilter);
        if (!data?.success) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#ef4444">Failed to load users</td></tr>`;
            return;
        }

        currentUsers = data.users;
        totalPages   = data.pagination.pages;
        totalUsers   = data.pagination.total;

        renderStats(data.pagination.total);
        renderUsersTable(currentUsers);
        renderPagination();
    }

    // ── Statistics ───────────────────────────────────────────────────────────

    function renderStats(total) {
        const activeCount   = currentUsers.filter(u => u.isActive).length;
        const subscribedCount = currentUsers.filter(u => u.isSubscribed).length;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount   = currentUsers.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

        document.getElementById('totalUsers').textContent    = total;
        document.getElementById('activeUsers').textContent   = activeCount;
        document.getElementById('totalRevenue').textContent  = subscribedCount + ' subscribed';
        document.getElementById('recentSignups').textContent = recentCount;
    }

    // ── Users table ─────────────────────────────────────────────────────────

    function renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');

        if (!users.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:3rem;">
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <h3>No users found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const uid      = user.id?.toString() || '';
            const isActive = user.isActive;
            const statusClass = isActive ? 'active' : 'inactive';
            const statusLabel = isActive ? 'Active' : 'Inactive';
            const plan = user.subscriptionPlan || 'free';

            return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;">
                            ${user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span>${escHtml(user.name)}</span>
                    </div>
                </td>
                <td>${escHtml(user.email)}</td>
                <td><span class="plan-badge">${escHtml(plan)}</span></td>
                <td>${user.isSubscribed ? '<span class="status-badge active">Yes</span>' : '<span class="status-badge inactive">No</span>'}</td>
                <td>${formatDate(user.lastLogin)}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewUser('${uid}')" title="View Details">👁️</button>
                        <button class="btn-icon" onclick="openEditUser('${uid}')" title="Edit User">✏️</button>
                        <button class="btn-icon ${isActive ? 'delete' : ''}" onclick="openStatusModal('${uid}','${!isActive}')" title="${isActive ? 'Deactivate' : 'Activate'}">
                            ${isActive ? '🚫' : '✅'}
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // ── Pagination ───────────────────────────────────────────────────────────

    function renderPagination() {
        const bar = document.getElementById('paginationBar');
        if (totalPages <= 1) { bar.style.display = 'none'; return; }
        bar.style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages} (${totalUsers} users)`;
        document.getElementById('prevPageBtn').disabled = currentPage <= 1;
        document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;
    }

    window.changePage = function(delta) {
        const next = currentPage + delta;
        if (next < 1 || next > totalPages) return;
        currentPage = next;
        loadUsers();
    };

    // ── Search & filter ──────────────────────────────────────────────────────

    let searchDebounce;
    document.getElementById('searchUsers').addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            searchTerm  = e.target.value.trim();
            currentPage = 1;
            loadUsers();
        }, 350);
    });

    document.getElementById('filterStatus').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        currentPage  = 1;
        loadUsers();
    });

    // ── View modal ───────────────────────────────────────────────────────────

    window.viewUser = async function(id) {
        const data = await fetchUserDetail(id);
        if (!data?.success) { showToast('Failed to load user details', 'error'); return; }
        const u = data.user;

        document.getElementById('viewUserName').textContent       = u.name;
        document.getElementById('viewUserEmail').textContent      = u.email;
        document.getElementById('viewUserPhone').textContent      = u.phone || 'N/A';
        document.getElementById('viewUserStatus').innerHTML       = `<span class="status-badge ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Active' : 'Inactive'}</span>`;
        document.getElementById('viewUserPlan').textContent       = u.subscription?.plan || 'free';
        document.getElementById('viewUserSubStatus').textContent  = u.subscription?.status || 'N/A';
        document.getElementById('viewUserStartDate').textContent  = formatDate(u.subscription?.startDate);
        document.getElementById('viewUserEndDate').textContent    = formatDate(u.subscription?.endDate);
        document.getElementById('viewUserCourses').textContent    = u.enrolledCourses?.length || 0;
        document.getElementById('viewUserLastLogin').textContent  = formatDate(u.lastLogin);
        document.getElementById('viewUserLoginCount').textContent = u.loginCount ?? 0;
        document.getElementById('viewUserCreated').textContent    = formatDate(u.createdAt);

        document.getElementById('viewUserEditBtn').onclick = () => {
            closeModal('viewUserModal');
            openEditUser(id);
        };

        document.getElementById('viewUserModal').classList.add('active');
    };

    // ── Edit user modal ──────────────────────────────────────────────────────

    window.openEditUser = async function(id) {
        const data = await fetchUserDetail(id);
        if (!data?.success) { showToast('Failed to load user', 'error'); return; }
        const u = data.user;

        document.getElementById('editUserId').value        = u.id;
        document.getElementById('editUserName').value      = u.name;
        document.getElementById('editUserEmail').value     = u.email;
        document.getElementById('editUserPhone').value     = u.phone || '';
        document.getElementById('editUserActive').value    = u.isActive ? 'true' : 'false';

        document.getElementById('editUserModal').classList.add('active');
    };

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id       = document.getElementById('editUserId').value;
        const saveBtn  = document.getElementById('editUserSaveBtn');
        saveBtn.disabled    = true;
        saveBtn.textContent = 'Saving…';

        const data = await apiRequest('PUT', `/users/${id}`, {
            name:     document.getElementById('editUserName').value.trim(),
            email:    document.getElementById('editUserEmail').value.trim(),
            phone:    document.getElementById('editUserPhone').value.trim() || undefined,
            isActive: document.getElementById('editUserActive').value === 'true'
        });

        saveBtn.disabled    = false;
        saveBtn.textContent = 'Save Changes';

        if (data?.success) {
            showToast('User updated successfully');
            closeModal('editUserModal');
            loadUsers();
        } else {
            showToast(data?.message || 'Failed to update user', 'error');
        }
    });

    // ── Status toggle modal ──────────────────────────────────────────────────

    window.openStatusModal = function(id, activate) {
        const user = currentUsers.find(u => u.id?.toString() === id);
        const isActivating = activate === 'true' || activate === true;
        document.getElementById('statusUserId').value         = id;
        document.getElementById('statusUserTarget').value     = isActivating ? 'true' : 'false';
        document.getElementById('statusModalIcon').textContent = isActivating ? '✅' : '🚫';
        document.getElementById('statusModalTitle').textContent = isActivating ? 'Activate Account?' : 'Deactivate Account?';
        document.getElementById('statusModalAction').textContent = isActivating ? 'activate' : 'deactivate';
        document.getElementById('statusModalUserName').textContent = user?.name || id;
        document.getElementById('statusModal').classList.add('active');
    };

    window.confirmStatusChange = async function() {
        const id       = document.getElementById('statusUserId').value;
        const isActive = document.getElementById('statusUserTarget').value === 'true';
        const btn      = document.getElementById('confirmStatusBtn');
        btn.disabled    = true;
        btn.textContent = 'Updating…';

        const data = await apiRequest('PATCH', `/users/${id}/status`, { isActive });

        btn.disabled    = false;
        btn.textContent = 'Confirm';

        if (data?.success) {
            showToast(data.message);
            closeModal('statusModal');
            loadUsers();
        } else {
            showToast(data?.message || 'Failed to update status', 'error');
        }
    };

    // ── Modal helpers ────────────────────────────────────────────────────────

    window.closeModal = function(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    };

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // ── XSS guard ────────────────────────────────────────────────────────────

    function escHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, c =>
            ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // ── Boot ─────────────────────────────────────────────────────────────────
    loadUsers();
}

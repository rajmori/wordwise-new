// Admin Panel JavaScript
import {
    isAdminAuthenticated,
    clearAdminSession,
    logout,
    saveLoginSession,
} from './auth-utils.js';

const API_BASE = 'http://localhost:3000/api/admin';

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
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success && data.token) {
                saveLoginSession(data.token, data.admin);
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

    let currentUsers = [];   // flat user-level rows (for stats / search / filter)
    let filteredUsers = [];
    // Map: userId → subscriptionId (used by edit/delete)
    let userSubMap = {};

    // ── Data loading ────────────────────────────────────────────────────────

    async function fetchUsers() {
        const data = await apiRequest('GET', '/users');
        return data?.success ? data.users : [];
    }

    async function loadUsers() {
        currentUsers = await fetchUsers();
        filteredUsers = [...currentUsers];
        renderStats();
        renderUsersTable();
    }

    // ── Statistics ───────────────────────────────────────────────────────────

    function calculateStats() {
        const totalUsers   = currentUsers.length;
        const activeUsers  = currentUsers.filter(u => u.status === 'Active').length;
        const totalRevenue = currentUsers.reduce((s, u) => s + (u.paymentAmount || 0), 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSignups = currentUsers.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;
        return { totalUsers, activeUsers, totalRevenue, recentSignups };
    }

    function renderStats() {
        const s = calculateStats();
        document.getElementById('totalUsers').textContent    = s.totalUsers;
        document.getElementById('activeUsers').textContent   = s.activeUsers;
        document.getElementById('totalRevenue').textContent  = formatCurrency(s.totalRevenue);
        document.getElementById('recentSignups').textContent = s.recentSignups;
    }

    // ── Users table ─────────────────────────────────────────────────────────

    function renderUsersTable(users = filteredUsers) {
        const tbody = document.getElementById('usersTableBody');
        userSubMap  = {};

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
            const uid   = user.id ? user.id.toString() : '';
            const subId = user.subscriptionId || '';
            if (uid) userSubMap[uid] = subId;

            return `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="plan-badge">${user.subscriptionPlan}</span></td>
                <td>${formatDate(user.subscriptionStartDate)}</td>
                <td>${formatDate(user.subscriptionEndDate)}</td>
                <td>${formatCurrency(user.paymentAmount)}</td>
                <td><span class="status-badge ${user.status.toLowerCase()}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewUser('${uid}')" title="View Details">👁️</button>
                        <button class="btn-icon" onclick="editSubscription('${uid}','${subId}')" title="Edit Subscription" ${!subId ? 'disabled' : ''}>✏️</button>
                        <button class="btn-icon delete" onclick="confirmDeleteSub('${uid}','${subId}')" title="Delete Subscription" ${!subId ? 'disabled' : ''}>🗑️</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // ── Search & filter ──────────────────────────────────────────────────────

    document.getElementById('searchUsers').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filteredUsers = currentUsers.filter(u =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.subscriptionPlan.toLowerCase().includes(term)
        );
        renderUsersTable(filteredUsers);
    });

    document.getElementById('filterStatus').addEventListener('change', (e) => {
        const status = e.target.value;
        filteredUsers = status === 'all'
            ? [...currentUsers]
            : currentUsers.filter(u => u.status === status);
        renderUsersTable(filteredUsers);
    });

    // ── View modal ───────────────────────────────────────────────────────────

    window.viewUser = function(id) {
        const user = currentUsers.find(u => u.id?.toString() === id);
        if (!user) return;

        document.getElementById('viewUserName').textContent         = user.name;
        document.getElementById('viewUserEmail').textContent        = user.email;
        document.getElementById('viewUserPlan').textContent         = user.subscriptionPlan;
        document.getElementById('viewUserStatus').innerHTML         = `<span class="status-badge ${user.status.toLowerCase()}">${user.status}</span>`;
        document.getElementById('viewUserStartDate').textContent    = formatDate(user.subscriptionStartDate);
        document.getElementById('viewUserEndDate').textContent      = formatDate(user.subscriptionEndDate);
        document.getElementById('viewUserPayment').textContent      = formatCurrency(user.paymentAmount);
        document.getElementById('viewUserPaymentMethod').textContent = user.paymentMethod;
        document.getElementById('viewUserLastPayment').textContent  = formatDate(user.lastPaymentDate);
        document.getElementById('viewUserCreated').textContent      = formatDate(user.createdAt);

        document.getElementById('viewUserModal').classList.add('active');
    };

    // ── Edit subscription modal ──────────────────────────────────────────────

    window.editSubscription = async function(userId, subId) {
        if (!subId) { showToast('No subscription to edit', 'error'); return; }

        // Fetch latest subscription data from backend
        const data = await apiRequest('GET', `/subscriptions/${subId}`);
        if (!data?.success) { showToast(data?.message || 'Failed to load subscription', 'error'); return; }

        const sub = data.subscription;

        document.getElementById('editSubId').value              = sub._id;
        document.getElementById('editSubPlan').value            = sub.planName || '';
        document.getElementById('editSubStatus').value          = sub.status || 'active';
        document.getElementById('editSubStartDate').value       = toInputDate(sub.currentPeriodStart);
        document.getElementById('editSubEndDate').value         = toInputDate(sub.currentPeriodEnd);
        document.getElementById('editSubAmount').value          = sub.amount != null ? (sub.amount / 100).toFixed(0) : '';
        document.getElementById('editSubCancelEnd').checked     = !!sub.cancelAtPeriodEnd;

        // Show user context
        document.getElementById('editSubUserName').textContent  = sub.userId?.name  || userId;
        document.getElementById('editSubUserEmail').textContent = sub.userId?.email || '';

        document.getElementById('editSubModal').classList.add('active');
    };

    // Edit form submit
    document.getElementById('editSubForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const subId          = document.getElementById('editSubId').value;
        const planName       = document.getElementById('editSubPlan').value.trim();
        const status         = document.getElementById('editSubStatus').value;
        const startDate      = document.getElementById('editSubStartDate').value;
        const endDate        = document.getElementById('editSubEndDate').value;
        const amountRupees   = parseFloat(document.getElementById('editSubAmount').value);
        const cancelAtPeriodEnd = document.getElementById('editSubCancelEnd').checked;

        const saveBtn = document.getElementById('editSubSaveBtn');
        saveBtn.disabled     = true;
        saveBtn.textContent  = 'Saving…';

        const data = await apiRequest('PUT', `/subscriptions/${subId}`, {
            planName,
            status,
            currentPeriodStart: startDate ? new Date(startDate).toISOString() : undefined,
            currentPeriodEnd:   endDate   ? new Date(endDate).toISOString()   : undefined,
            amount: isNaN(amountRupees) ? undefined : amountRupees * 100, // store in paise
            cancelAtPeriodEnd
        });

        saveBtn.disabled    = false;
        saveBtn.textContent = 'Save Changes';

        if (data?.success) {
            showToast('Subscription updated successfully');
            closeModal('editSubModal');
            await loadUsers(); // refresh table
        } else {
            showToast(data?.message || 'Failed to update subscription', 'error');
        }
    });

    // ── Delete modal ─────────────────────────────────────────────────────────

    window.confirmDeleteSub = function(userId, subId) {
        if (!subId) { showToast('No subscription to delete', 'error'); return; }
        const user = currentUsers.find(u => u.id?.toString() === userId);
        document.getElementById('deleteSubId').value           = subId;
        document.getElementById('deleteSubUserName').textContent = user?.name || userId;
        document.getElementById('deleteSubModal').classList.add('active');
    };

    window.confirmDeleteSubscription = async function() {
        const subId   = document.getElementById('deleteSubId').value;
        const delBtn  = document.getElementById('confirmDeleteBtn');
        delBtn.disabled    = true;
        delBtn.textContent = 'Deleting…';

        const data = await apiRequest('DELETE', `/subscriptions/${subId}`);

        delBtn.disabled    = false;
        delBtn.textContent = 'Delete Subscription';

        if (data?.success) {
            showToast('Subscription deleted successfully');
            closeModal('deleteSubModal');
            await loadUsers();
        } else {
            showToast(data?.message || 'Failed to delete subscription', 'error');
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

    // ── Logout ───────────────────────────────────────────────────────────────

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // ── Boot ─────────────────────────────────────────────────────────────────
    loadUsers();
}

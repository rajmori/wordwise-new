import { API_BASE_URL } from '../config.js';
import { authService } from '../auth-service.js';

// Auth State
let token = authService.getBackendToken();
let allCards = [];

// DOM Elements
const grid = document.getElementById('cardsGrid');
const loading = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const modal = document.getElementById('viewerModal');

// Redirect if no token immediately (Basic check, API will confirm validity)
if (!token) {
    window.location.href = './login.html?redirect=flash-cards.html';
}

// Fetch Cards
const fetchCards = async () => {
    try {
        loading.style.display = 'block';
        grid.style.display = 'none';
        errorState.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/flash-cards/user`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            // Invalid token
            authService.logout();
            window.location.href = './login.html?redirect=flash-cards.html';
            return;
        }

        if (response.status === 403 && data.requiresSubscription) {
            // Valid user, but no subscription
            loading.style.display = 'none';
            errorState.style.display = 'block';
            return;
        }

        if (!data.success) throw new Error(data.message);

        allCards = data.data;
        renderCards(allCards);
        loading.style.display = 'none';
        grid.style.display = 'grid';

    } catch (error) {
        console.error('Error fetching cards:', error);
        loading.style.display = 'none';
        // Show generic error or keep loading hidden
        // Show generic error or keep loading hidden
        alert(`Failed to load content. Error: ${error.message || 'Unknown error'}`);
    }
};

// Render Logic
const renderCards = (cards) => {
    grid.innerHTML = cards.map(card => `
        <div class="fc-card" onclick="openCard('${card._id}')">
            <div class="fc-card-content">
                <div class="fc-card-words">
                    ${card.word1} <span class="fc-card-vs">vs</span> ${card.word2}
                </div>
                <div class="fc-card-category">${card.category}</div>
            </div>
        </div>
    `).join('');
};

// Filter Logic
const applyFilters = () => {
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const sort = sortFilter.value;

    let filtered = allCards.filter(card => {
        const matchesSearch =
            card.word1.toLowerCase().includes(search) ||
            card.word2.toLowerCase().includes(search) ||
            (card.tags && card.tags.some(t => t.toLowerCase().includes(search)));

        const matchesCategory = !category || card.category === category;

        return matchesSearch && matchesCategory;
    });

    // Sort
    if (sort === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    renderCards(filtered);
};

// Modal Logic
window.openCard = (id) => {
    const card = allCards.find(c => c._id === id);
    if (!card) return;

    document.getElementById('modalImage').src = card.imageUrl;
    document.getElementById('modalCategory').textContent = card.category;
    document.getElementById('modalWords').innerHTML = `${card.word1} <span style="font-weight:400; font-size: 0.5em; color:#999; vertical-align: middle;">vs</span> ${card.word2}`;
    document.getElementById('modalDescription').textContent = card.description || 'No description available.';

    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = card.tags.map(t => `<span class="fc-modal-tag">#${t}</span>`).join('');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
};

window.closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
};

// Close on background click
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Event Listeners
searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
sortFilter.addEventListener('change', applyFilters);

// Start
fetchCards();

/**
 * Navigation Manager
 * Consolidates navigation logic across the application based on user state:
 * - Unauthenticated
 * - Authenticated (Logged in, but no subscription/courses)
 * - Subscribed (Logged in with active subscription or enrolled courses)
 */

import { authService } from '../auth-service.js';

class NavigationManager {
    constructor() {
        this.user = null;
        this.isLoaded = false;
    }

    /**
     * Initialize navigation
     */
    async init() {
        if (this.isLoaded) return;

        console.log('🚀 NavigationManager: Initializing...');

        // Ensure auth service is initialized
        if (typeof authService.init === 'function') {
            await authService.init();
        }

        const isAuthenticated = authService.isAuthenticated();
        const hasAccess = authService.hasActiveAccess();

        // Determine state
        let state = 'unauthenticated';
        if (isAuthenticated) {
            state = hasAccess ? 'subscribed' : 'authenticated';
        }
        console.log('📊 User State:', state);

        // Update UI
        this.updateHeader(state);
        this.handleAccessControl(state);

        this.isLoaded = true;
    }

    /**
     * Determine user state
     */
    determineUserState(isAuthenticated, user) {
        if (!isAuthenticated || !user) {
            return 'unauthenticated';
        }

        const hasActiveSubscription = user.subscription &&
            user.subscription.status === 'active' &&
            new Date(user.subscription.currentPeriodEnd) > new Date();

        const hasEnrolledCourses = user.enrolledCourses && user.enrolledCourses.length > 0;
        const isSubscribedFlag = user.isSubscribed === true || user.isSubscribed === 'true';

        if (hasActiveSubscription || hasEnrolledCourses || isSubscribedFlag) {
            return 'subscribed';
        }

        return 'authenticated';
    }

    /**
     * Update header navigation links
     */
    updateHeader(state) {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        // Ensure we have the user info
        this.user = authService.getCurrentUser();

        // 1. Identify common links
        const homeLink = navLinks.querySelector('a[href="index.html"]') || navLinks.querySelector('a[href="./index.html"]');
        const coursesPricingLink = navLinks.querySelector('a[href="subscription.html"]') || navLinks.querySelector('a[href="./subscription.html"]');
        const myCoursePlayerLink = navLinks.querySelector('a[href="my-course.html"]') || navLinks.querySelector('a[href="./my-course.html"]');
        const contactLink = navLinks.querySelector('a[href="contact.html"]') || navLinks.querySelector('a[href="./contact.html"]');
        const loginLink = navLinks.querySelector('.nav-link-login');
        const getStartedBtn = navLinks.querySelector('.btn-primary.small') || navLinks.querySelector('a[href="subscription.html"].btn');

        // 2. Identify dynamic links
        let myCoursesLink = navLinks.querySelector('a[href="my-courses.html"]') || navLinks.querySelector('a[href="./my-courses.html"]');
        let dashboardLink = navLinks.querySelector('a[href="dashboard.html"]') || navLinks.querySelector('a[href="./dashboard.html"]');
        let flashCardsLink = navLinks.querySelector('a[href="flash-cards.html"]') || navLinks.querySelector('a[href="./flash-cards.html"]');

        // Features link — always visible, apply active class when on features page
        const featuresLink = navLinks.querySelector('a[href="features.html"]') || navLinks.querySelector('a[href="./features.html"]');
        if (featuresLink) {
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage === 'features.html') {
                featuresLink.classList.add('active');
            }
        }

        // 3. Apply visibility based on state
        switch (state) {
            case 'unauthenticated':
                if (coursesPricingLink) {
                    coursesPricingLink.textContent = 'Pricing';
                    coursesPricingLink.style.display = '';
                }
                if (myCoursePlayerLink) myCoursePlayerLink.style.display = 'none';
                if (flashCardsLink) flashCardsLink.style.display = 'none';
                if (myCoursesLink) myCoursesLink.style.display = 'none';
                if (dashboardLink) dashboardLink.style.display = 'none';
                if (loginLink) loginLink.style.display = '';
                if (getStartedBtn) getStartedBtn.style.display = '';
                this.removeUserProfile(navLinks);
                break;

            case 'authenticated':
                if (coursesPricingLink) {
                    coursesPricingLink.textContent = 'Pricing';
                    coursesPricingLink.style.display = '';
                }
                if (myCoursePlayerLink) myCoursePlayerLink.style.display = 'none';
                if (flashCardsLink) flashCardsLink.style.display = 'none';
                if (myCoursesLink) myCoursesLink.style.display = 'none';
                if (dashboardLink) dashboardLink.style.display = 'none';
                if (loginLink) loginLink.style.display = 'none';
                if (getStartedBtn) getStartedBtn.style.display = 'none';
                this.renderUserProfile(navLinks);
                break;

            case 'subscribed':
                if (coursesPricingLink) coursesPricingLink.style.display = 'none';
                if (myCoursePlayerLink) myCoursePlayerLink.style.display = 'none';
                if (loginLink) loginLink.style.display = 'none';
                if (getStartedBtn) getStartedBtn.style.display = 'none';

                // Hide any public courses links
                const allLinks = navLinks.querySelectorAll('a');
                allLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const text = link.textContent.toLowerCase();
                    if (href && (href.includes('subscription.html') || (href.includes('my-course.html') && !href.includes('?')))) {
                        if (text.includes('course') || text.includes('pricing')) {
                            link.style.display = 'none';
                        }
                    }
                });

                // Show/Create My Courses
                if (!myCoursesLink) {
                    myCoursesLink = this.createNavLink('My Course', 'my-courses.html');
                    this.insertLinkBeforeProfile(navLinks, myCoursesLink);
                } else {
                    myCoursesLink.style.display = '';
                }

                // Show/Create Flash Cards
                if (!flashCardsLink) {
                    flashCardsLink = this.createNavLink('Flash Cards', 'flash-cards.html');
                    this.insertLinkBeforeProfile(navLinks, flashCardsLink);
                } else {
                    flashCardsLink.style.display = '';
                }

                // Show/Create Dashboard
                if (!dashboardLink) {
                    dashboardLink = this.createNavLink('Dashboard', 'dashboard.html');
                    this.insertLinkBeforeProfile(navLinks, dashboardLink);
                } else {
                    dashboardLink.style.display = '';
                }

                this.renderUserProfile(navLinks);
                break;
        }
    }

    /**
     * Create a new nav link element
     */
    createNavLink(text, href) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        return link;
    }

    /**
     * Insert link before the user profile dropdown
     */
    insertLinkBeforeProfile(navLinks, link) {
        const profile = navLinks.querySelector('.user-profile-nav');
        if (profile) {
            navLinks.insertBefore(link, profile);
        } else {
            navLinks.appendChild(link);
        }
    }

    /**
     * Render user profile dropdown
     */
    renderUserProfile(navLinks) {
        let profileContainer = navLinks.querySelector('.user-profile-nav');

        if (!profileContainer) {
            profileContainer = document.createElement('div');
            profileContainer.className = 'user-profile-nav';
            navLinks.appendChild(profileContainer);
        }

        profileContainer.innerHTML = '';

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'avatar';

        if (this.user.picture) {
            const img = document.createElement('img');
            img.src = this.user.picture;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
            avatar.appendChild(img);
        } else {
            avatar.textContent = this.getInitials(this.user.name || this.user.email || 'U');
        }

        // Dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-menu';

        dropdown.innerHTML = `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: 600; color: white;">${this.user.name || 'User'}</div>
                <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.user.email || ''}</div>
            </div>
            <div style="padding: 0.5rem;">
                <a href="profile.html" class="dropdown-item"><span>📂</span> Profile Details</a>
                <div class="dropdown-divider"></div>
                <a href="#" id="nav-logout-btn" class="dropdown-item" style="color: #ef4444;"><span>🚪</span> Logout</a>
            </div>
        `;

        profileContainer.appendChild(avatar);
        profileContainer.appendChild(dropdown);

        // Events
        profileContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        const logoutBtn = dropdown.querySelector('#nav-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                authService.logout();
                window.location.href = 'index.html';
            });
        }
    }

    /**
     * Remove user profile from nav
     */
    removeUserProfile(navLinks) {
        const profile = navLinks.querySelector('.user-profile-nav');
        if (profile) profile.remove();
    }

    /**
     * Get initials
     */
    getInitials(name) {
        if (!name) return 'U';
        return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    /**
     * Handle page access control
     */
    handleAccessControl(state) {
        const path = window.location.pathname;
        const page = path.split('/').pop();

        const restrictedPages = ['dashboard.html', 'flash-cards.html', 'my-courses.html', 'profile.html'];
        const subscriberOnlyPages = ['dashboard.html', 'flash-cards.html', 'my-courses.html'];

        if (restrictedPages.includes(page) && state === 'unauthenticated') {
            window.location.href = 'login.html';
        }

        if (subscriberOnlyPages.includes(page) && state === 'authenticated') {
            // User is logged in but not subscribed
            // Redirect to pricing/courses
            window.location.href = 'subscription.html';
        }
    }
}

export const navigationManager = new NavigationManager();

// Auto-init
document.addEventListener('DOMContentLoaded', () => navigationManager.init());

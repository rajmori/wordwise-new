// Main JavaScript
import './style.css';
import { initPPTViewer } from './ppt-viewer.js';
import { authService } from './auth-service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize PPT Viewer
    initPPTViewer();

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.flexDirection = 'column';
                navLinks.style.background = 'rgba(15, 23, 42, 0.95)';
                navLinks.style.padding = '2rem';
                navLinks.style.backdropFilter = 'blur(10px)';
            }
        });
    }

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;

            try {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                    // Close mobile menu if open
                    if (window.innerWidth <= 768 && navLinks.style.display === 'flex') {
                        navLinks.style.display = 'none';
                    }
                }
            } catch (err) {
                // Ignore invalid selectors
                console.warn('Invalid scroll target:', href);
            }
        });
    });

    // Demo Section Animation (Simple Highlight Cycle)
    const demoItems = document.querySelectorAll('.demo-explanation li');
    let currentItem = 0;

    if (demoItems.length > 0) {
        setInterval(() => {
            demoItems.forEach(item => item.classList.remove('active'));
            demoItems[currentItem].classList.add('active');
            currentItem = (currentItem + 1) % demoItems.length;
        }, 3000);
    }

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply fade-in to cards
    const cards = document.querySelectorAll('.feature-card, .reason-item, .demo-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(card);
    });

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const resetBtn = document.getElementById('resetBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Reset states
            errorMessage.style.display = 'none';
            let isValid = true;
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            // Basic Validation
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            const honeypot = document.getElementById('honeypot');

            // Reset errors
            [nameInput, emailInput, messageInput].forEach(input => input.classList.remove('error'));

            if (!data.name.trim()) {
                nameInput.classList.add('error');
                isValid = false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                emailInput.classList.add('error');
                isValid = false;
            }

            if (!data.message.trim()) {
                messageInput.classList.add('error');
                isValid = false;
            }

            // Bot check
            if (honeypot.value) {
                console.log('Bot detected');
                return;
            }

            if (!isValid) return;

            // Mock Submission
            const btnText = submitBtn.querySelector('.btn-text');
            const loader = submitBtn.querySelector('.loader');

            btnText.style.display = 'none';
            loader.style.display = 'inline-block';
            submitBtn.disabled = true;

            try {
                // Import contact service dynamically
                const { contactService } = await import('./contact-service.js');

                // Send contact form to backend
                await contactService.sendContactForm(data);

                // Success
                contactForm.style.display = 'none';
                successMessage.style.display = 'block';
                contactForm.reset();
            } catch (error) {
                console.error('Error sending message:', error);
                errorMessage.style.display = 'block';

                // Show error message with details
                const errorText = errorMessage.querySelector('p');
                if (errorText) {
                    errorText.textContent = error.message || 'Sorry, something went wrong. Please try again later.';
                }
            } finally {
                btnText.style.display = 'inline-block';
                loader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                successMessage.style.display = 'none';
                contactForm.style.display = 'block';
            });
        }
    }

    // Auth Page Logic
    const authTabs = document.querySelectorAll('.auth-tab');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authErrorMessage = document.getElementById('authErrorMessage');
    const googleBtns = document.querySelectorAll('.btn-google');

    // Tab Switching
    if (authTabs.length > 0) {
        const switchTab = (tabId) => {
            authTabs.forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tabId);
            });

            if (tabId === 'signin') {
                signinForm.classList.add('active');
                signupForm.classList.remove('active');
            } else {
                signinForm.classList.remove('active');
                signupForm.classList.add('active');
            }

            // Clear errors when switching
            if (authErrorMessage) authErrorMessage.style.display = 'none';
            document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
            document.querySelectorAll('input').forEach(i => i.classList.remove('error'));
        };

        authTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        // Handle "Switch to..." links
        document.querySelectorAll('.switch-to-signup').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab('signup');
            });
        });

        document.querySelectorAll('.switch-to-signin').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab('signin');
            });
        });
    }

    // Authentication Function
    const handleAuth = async (form, btnId, isSignup) => {
        const btn = document.getElementById(btnId);
        const btnText = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.loader');

        // Reset errors
        if (authErrorMessage) authErrorMessage.style.display = 'none';
        const inputs = form.querySelectorAll('input');
        let isValid = true;

        inputs.forEach(input => {
            input.classList.remove('error');
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            }
            // Simple email validation
            if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                input.classList.add('error');
                isValid = false;
            }
            // Simple password length check
            if (input.type === 'password' && input.value.length < 6 && isSignup) {
                input.classList.add('error');
                isValid = false;
            }
        });

        // Password match check for signup
        if (isSignup) {
            const pass = form.querySelector('input[name="password"]');
            const confirm = form.querySelector('input[name="confirm-password"]');
            if (pass.value !== confirm.value) {
                confirm.classList.add('error');
                isValid = false;
            }
        }

        if (!isValid) return;

        // API Call
        btnText.style.display = 'none';
        loader.style.display = 'inline-block';
        btn.disabled = true;

        try {
            let result;
            if (isSignup) {
                const name = form.querySelector('input[name="name"]').value;
                const email = form.querySelector('input[name="email"]').value;
                const password = form.querySelector('input[name="password"]').value;
                result = await authService.signup(name, email, password);
            } else {
                const email = form.querySelector('input[name="email"]').value;
                const password = form.querySelector('input[name="password"]').value;
                result = await authService.login(email, password);
            }

            if (result.success) {
                console.log(`${isSignup ? 'Sign Up' : 'Log In'} Successful`);
                authService.handlePostLoginRedirect();
            } else {
                throw new Error(result.error || result.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth Error:', error);
            if (authErrorMessage) {
                authErrorMessage.style.display = 'block';
                const errorText = authErrorMessage.querySelector('p');
                if (errorText) errorText.textContent = error.message;
            }
        } finally {
            btnText.style.display = 'inline-block';
            loader.style.display = 'none';
            btn.disabled = false;
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAuth(loginForm, 'loginBtn', false);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAuth(registerForm, 'registerBtn', true);
        });
    }

    // Initialize Google Authentication
    if (document.getElementById('google-signin-button') || document.getElementById('google-signup-button')) {
        authService.init().then(() => {
            // Handle OAuth callback if present in URL
            const oauthResult = authService.handleOAuthCallback();
            if (oauthResult && oauthResult.success) {
                console.log('OAuth login successful:', oauthResult.user);
                authService.handlePostLoginRedirect();
                return;
            }

            // Initialize Google Sign-In buttons
            if (document.getElementById('google-signin-button')) {
                authService.initGoogleButton('google-signin-button', handleGoogleAuth);
            }

            if (document.getElementById('google-signup-button')) {
                authService.initGoogleButton('google-signup-button', handleGoogleAuth);
            }
        }).catch(error => {
            console.error('Failed to initialize Google Auth:', error);
        });
    }

    // Handle Google Authentication Response
    function handleGoogleAuth(response) {
        console.log('📨 Google auth callback received:', response);

        if (response.success) {
            console.log('✅ Google authentication successful:', response.user);
            authService.handlePostLoginRedirect();
        } else {
            console.error('❌ Google authentication failed:', response.error);
            if (authErrorMessage) {
                const errorMsg = response.error || 'Google authentication failed. Please try again.';
                authErrorMessage.querySelector('p').textContent = errorMsg;
                authErrorMessage.style.display = 'block';
            }
        }
    }
});

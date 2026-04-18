// Course Purchase Page - Display and purchase courses
import { APP_CONFIG } from '../config.js';
import { authService } from '../auth-service.js';

class CoursePurchaseService {
    constructor() {
        this.apiUrl = APP_CONFIG.apiUrl;
        this.razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    }

    /**
     * Fetch all published courses
     */
    async fetchPublishedCourses() {
        try {
            const response = await fetch(`${this.apiUrl}/courses/published`);
            const data = await response.json();

            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to fetch courses');
            }
        } catch (error) {
            console.error('❌ Error fetching courses:', error);
            throw error;
        }
    }

    /**
     * Create course order
     */
    async createCourseOrder(courseId) {
        try {
            // Check if user is authenticated
            if (!authService.isAuthenticated()) {
                console.log('❌ User not authenticated, redirecting to login');
                sessionStorage.setItem('redirect_after_login', window.location.href);
                sessionStorage.setItem('purchase_course_id', courseId);
                window.location.href = '/login.html';
                return { success: false, message: 'Please login first' };
            }

            const token = authService.getBackendToken();
            console.log('🔑 Token retrieved:', token ? 'Token exists' : 'No token');

            const response = await fetch(`${this.apiUrl}/course-orders/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ courseId })
            });

            // Handle 401 Unauthorized (token expired or invalid)
            if (response.status === 401) {
                sessionStorage.setItem('redirect_after_login', window.location.href);
                sessionStorage.setItem('purchase_course_id', courseId);
                alert('Your session has expired. Please login again.');
                window.location.href = '/login.html';
                return { success: false, message: 'Session expired' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Error creating order:', error);
            return { success: false, message: 'Failed to create order' };
        }
    }

    /**
     * Open Razorpay payment modal
     */
    async openRazorpayPayment(orderData, courseTitle) {
        return new Promise((resolve, reject) => {
            if (typeof window.Razorpay === 'undefined') {
                console.error('❌ Razorpay script not loaded');
                alert('Payment system not loaded. Please refresh the page.');
                reject(new Error('Razorpay not loaded'));
                return;
            }

            const options = {
                key: orderData.razorpayKeyId || this.razorpayKeyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'WordWise',
                description: `Course: ${courseTitle}`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    console.log('✅ Payment successful:', response);
                    const verified = await this.verifyPayment(response);

                    if (verified.success) {
                        alert('Course purchased successfully! Redirecting to course...');
                        window.location.href = `/my-course.html?id=${verified.data.courseId}`;
                        resolve(verified);
                    } else {
                        alert('Payment verification failed. Please contact support.');
                        reject(new Error('Payment verification failed'));
                    }
                },
                prefill: {
                    name: authService.getCurrentUser()?.name || '',
                    email: authService.getCurrentUser()?.email || '',
                },
                theme: {
                    color: '#6366f1'
                },
                modal: {
                    ondismiss: () => {
                        console.log('❌ Payment cancelled by user');
                        reject(new Error('Payment cancelled'));
                    }
                }
            };

            try {
                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } catch (error) {
                console.error('❌ Error opening Razorpay:', error);
                alert('Failed to open payment window. Please try again.');
                reject(error);
            }
        });
    }

    /**
     * Verify payment on backend
     */
    async verifyPayment(paymentData) {
        try {
            const token = authService.getBackendToken();
            const response = await fetch(`${this.apiUrl}/course-orders/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Error verifying payment:', error);
            return { success: false, message: 'Failed to verify payment' };
        }
    }

    /**
     * Handle purchase button click
     */
    async handlePurchaseClick(courseId, courseTitle, buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<span class="loader"></span> Processing...';

        try {
            const orderResult = await this.createCourseOrder(courseId);

            if (orderResult.success) {
                await this.openRazorpayPayment(orderResult.data, courseTitle);
            } else {
                alert(orderResult.message || 'Failed to create order');
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalText;
            }
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Something went wrong. Please try again.');
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalText;
        }
    }
}

// Initialize service
const coursePurchaseService = new CoursePurchaseService();

// Display courses on page load
document.addEventListener('DOMContentLoaded', async () => {
    const coursesGrid = document.getElementById('coursesGrid');
    const coursesLoading = document.getElementById('coursesLoading');
    const coursesEmpty = document.getElementById('coursesEmpty');

    try {
        coursesLoading.style.display = 'flex';
        const courses = await coursePurchaseService.fetchPublishedCourses();

        coursesLoading.style.display = 'none';

        if (courses.length === 0) {
            coursesEmpty.style.display = 'flex';
        } else {
            coursesGrid.innerHTML = courses.map(course => `
                <div class="pricing-card">
                    <div class="card-header">
                        <span class="difficulty-badge ${course.difficultyLevel.toLowerCase()}">${course.difficultyLevel}</span>
                        <h3>${course.title}</h3>
                        <div class="price">₹${course.price || 0}</div>
                        <p>${course.description.substring(0, 120)}${course.description.length > 120 ? '...' : ''}</p>
                    </div>
                    <ul class="features-list">
                        <li><span class="check">✓</span> ${course.modules?.length || 0} Modules</li>
                        <li><span class="check">✓</span> ${course.estimatedDuration.value} ${course.estimatedDuration.unit}</li>
                        <li><span class="check">✓</span> ${course.difficultyLevel} Level</li>
                        <li><span class="check">✓</span> ${course.enrollmentCount || 0} Students Enrolled</li>
                    </ul>
                    <button class="btn btn-primary full-width purchase-btn" data-course-id="${course._id}" data-course-title="${course.title}">
                        Purchase Course
                    </button>
                </div>
            `).join('');

            // Add event listeners to purchase buttons
            document.querySelectorAll('.purchase-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const courseId = e.target.dataset.courseId;
                    const courseTitle = e.target.dataset.courseTitle;
                    coursePurchaseService.handlePurchaseClick(courseId, courseTitle, e.target);
                });
            });
        }
    } catch (error) {
        coursesLoading.style.display = 'none';
        coursesEmpty.style.display = 'flex';
        console.error('Error loading courses:', error);
    }
});

// Check for pending purchase after login
if (sessionStorage.getItem('purchase_course_id')) {
    const courseId = sessionStorage.getItem('purchase_course_id');
    sessionStorage.removeItem('purchase_course_id');

    // Auto-trigger purchase flow
    setTimeout(() => {
        const purchaseBtn = document.querySelector(`[data-course-id="${courseId}"]`);
        if (purchaseBtn) {
            purchaseBtn.click();
        }
    }, 1000);
}

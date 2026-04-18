import CourseOrder from '../models/CourseOrder.js';
import Course from '../models/Course.js';
import User from '../models/user.model.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay order for course purchase
 */
export const createCourseOrder = async (req, res) => {
    try {
        const { courseId } = req.body;
        // User ID comes from auth middleware (req.user.id)
        const userId = req.user.id || req.user._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID missing from request'
            });
        }
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Course is not available for purchase'
            });
        }

        // Check if user already purchased this course
        const existingOrder = await CourseOrder.findOne({
            userId,
            courseId,
            status: 'paid'
        });

        if (existingOrder) {
            return res.status(400).json({
                success: false,
                message: 'You have already purchased this course'
            });
        }

        // Create Razorpay order
        const amount = course.price * 100; // Convert to paise
        const razorpayOrder = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-10)}_${Math.floor(Math.random() * 1000)}`,
            notes: {
                courseId: courseId.toString(),
                userId: userId.toString(),
                courseName: course.title
            }
        });

        // Save order to database
        const courseOrder = new CourseOrder({
            userId,
            courseId,
            razorpayOrderId: razorpayOrder.id,
            amount: course.price,
            currency: 'INR',
            status: 'created'
        });

        await courseOrder.save();

        res.json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                courseTitle: course.title
            }
        });
    } catch (error) {
        console.error('❌ Error creating course order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

/**
 * Verify payment and enroll user in course
 */
export const verifyCoursePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user.id || req.user._id;

        // Find the order
        const order = await CourseOrder.findOne({ razorpayOrderId: razorpay_order_id });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            order.status = 'failed';
            await order.save();

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Update order status
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        order.status = 'paid';
        order.paidAt = new Date();
        await order.save();

        // Enroll user in course
        const user = await User.findById(userId);
        await user.enrollInCourse(order.courseId);

        // Increment course enrollment count
        await Course.findByIdAndUpdate(order.courseId, {
            $inc: { enrollmentCount: 1 }
        });

        res.json({
            success: true,
            message: 'Payment verified and course enrolled successfully',
            data: {
                courseId: order.courseId,
                orderId: order._id
            }
        });
    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

/**
 * Get user's purchased courses
 */
export const getMyPurchases = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const purchases = await CourseOrder.find({
            userId,
            status: 'paid'
        })
            .populate('courseId', 'title description difficultyLevel estimatedDuration category price courseId')
            .sort({ paidAt: -1 })
            .exec();

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error('❌ Error fetching purchases:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching purchases',
            error: error.message
        });
    }
};

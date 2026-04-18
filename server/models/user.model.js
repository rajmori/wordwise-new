import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Google OAuth fields (optional for OAuth users)
    googleId: {
        type: String,
        unique: true,
        sparse: true,  // Allows null values while maintaining uniqueness for non-null values
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },

    // Email/Password authentication fields
    password: {
        type: String,
        // Required only for non-OAuth users
        // Will be validated in the controller
        select: false  // Don't include password in queries by default
    },

    // Contact information
    phone: {
        type: String,
        trim: true
    },

    // OAuth fields
    picture: {
        type: String,
        default: ''
    },
    emailVerified: {
        type: Boolean,
        default: false
    },

    // Subscription status (quick access field)
    isSubscribed: {
        type: Boolean,
        default: false,
        index: true
    },

    // Razorpay integration
    razorpayCustomerId: {
        type: String,
        unique: true,
        sparse: true  // Allows null values while maintaining uniqueness for non-null values
    },

    // User profile fields
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    
    // Learning progress
    enrolledCourses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        completedLessons: [{
            type: String
        }],
        lastAccessedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Subscription information
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled', 'expired'],
            default: 'active'
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        }
    },
    
    // User preferences
    preferences: {
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        }
    },
    
    // Activity tracking
    lastLogin: {
        type: Date,
        default: Date.now
    },
    loginCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    this.loginCount += 1;
    await this.save();
};

// Method to enroll in a course
userSchema.methods.enrollInCourse = async function(courseId) {
    const alreadyEnrolled = this.enrolledCourses.some(
        enrollment => enrollment.courseId.toString() === courseId.toString()
    );
    
    if (!alreadyEnrolled) {
        this.enrolledCourses.push({
            courseId,
            enrolledAt: new Date(),
            progress: 0,
            completedLessons: []
        });
        await this.save();
    }
};

// Don't return sensitive data in JSON responses
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    // Remove any sensitive fields if needed in the future
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;


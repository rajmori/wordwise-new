import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    razorpaySubscriptionId: {
        type: String,
        required: [true, 'Razorpay subscription ID is required'],
        unique: true,
        index: true
    },
    razorpayCustomerId: {
        type: String,
        // Not required for payment link subscriptions
        index: true
    },
    razorpayOrderId: {
        type: String,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        index: true
    },
    planName: {
        type: String,
        required: [true, 'Plan name is required']
    },
    amount: {
        type: Number,
        // Amount in smallest currency unit (paise for INR)
        min: 0
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['active', 'canceled', 'cancelled', 'past_due', 'expired'],
        index: true
    },
    currentPeriodStart: {
        type: Date,
        index: true
    },
    currentPeriodEnd: {
        type: Date,
        required: [true, 'Current period end date is required'],
        index: true
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },
    canceledAt: {
        type: Date
    }
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt
});

// Compound index for efficient access checks
subscriptionSchema.index({ userId: 1, status: 1 });

// Method to check if subscription is currently active and valid
subscriptionSchema.methods.isValid = function() {
    return this.status === 'active' && this.currentPeriodEnd > new Date();
};

// Static method to find active subscription for a user
subscriptionSchema.statics.findActiveForUser = async function(userId) {
    return this.findOne({
        userId,
        status: 'active',
        currentPeriodEnd: { $gt: new Date() }
    });
};

// Don't return sensitive data in JSON responses
subscriptionSchema.methods.toJSON = function() {
    const subscription = this.toObject();
    return subscription;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;


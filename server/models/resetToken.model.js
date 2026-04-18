import mongoose from 'mongoose';

const resetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 1800, // 30 minutes in seconds
    },
});

const ResetToken = mongoose.model('ResetToken', resetTokenSchema);

export default ResetToken;

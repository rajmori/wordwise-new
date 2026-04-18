import mongoose from 'mongoose';

const flashCardSchema = new mongoose.Schema({
    word1: {
        type: String,
        required: [true, 'First word is required'],
        trim: true
    },
    word2: {
        type: String,
        required: [true, 'Second word is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true,
        required: [true, 'Category is required']
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    imageUrl: {
        type: String,
        required: [true, 'Image is required']
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for search optimization
flashCardSchema.index({ word1: 'text', word2: 'text', category: 'text', tags: 'text' });
flashCardSchema.index({ category: 1 });
flashCardSchema.index({ tags: 1 });
flashCardSchema.index({ isArchived: 1 });

const FlashCard = mongoose.model('FlashCard', flashCardSchema);

export default FlashCard;

import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Module title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }]
});

const courseSchema = new mongoose.Schema({
    courseId: {
        type: String,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    learningOutcomes: [{
        type: String,
        trim: true
    }],
    difficultyLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: [true, 'Difficulty level is required'],
        default: 'Beginner'
    },
    estimatedDuration: {
        value: {
            type: Number,
            required: true,
            min: [1, 'Duration must be at least 1']
        },
        unit: {
            type: String,
            enum: ['days', 'weeks', 'months'],
            required: true,
            default: 'days'
        }
    },
    targetAudience: [{
        type: String,
        trim: true
    }],
    modules: [moduleSchema],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    instructor: {
        type: String,
        trim: true
    },
    enrollmentCount: {
        type: Number,
        default: 0,
        min: 0
    },
    thumbnailUrl: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    publishedAt: {
        type: Date
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ difficultyLevel: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ courseId: 1 }, { unique: true });

// Virtual for total lesson count
courseSchema.virtual('totalLessons').get(function () {
    if (!this.modules) return 0;
    return this.modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);
});

import Counter from './Counter.js';

// Update publishedAt when status changes to published
courseSchema.pre('save', async function (next) {
    // Generate Course ID if not exists
    if (!this.courseId) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'courseId' },
                { $inc: { value: 1 } },
                { new: true, upsert: true }
            );

            // Format: CRS{###} -> CRS001
            this.courseId = `CRS${counter.value.toString().padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating course ID:', error);
            return next(error);
        }
    }

    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;

import mongoose from 'mongoose';

const interactiveExampleSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['fill-in-blank', 'sentence-builder', 'multiple-choice', 'matching'],
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    options: [{
        type: String,
        trim: true
    }],
    explanation: {
        type: String,
        trim: true
    },
    hints: [{
        type: String,
        trim: true
    }]
});

const lessonSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Module ID is required']
    },
    title: {
        type: String,
        required: [true, 'Lesson title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    contentType: {
        type: String,
        enum: ['text', 'video', 'image', 'document', 'interactive', 'mixed'],
        required: [true, 'Content type is required'],
        default: 'text'
    },
    textContent: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        trim: true
    },
    videoUrl: {
        type: String,
        trim: true
    },
    videoThumbnail: {
        type: String,
        trim: true
    },
    interactiveExamples: [interactiveExampleSchema],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    topics: [{
        type: String,
        trim: true
    }],
    roots: [{
        type: String,
        trim: true
    }],
    partsOfSpeech: [{
        type: String,
        enum: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'],
        lowercase: true
    }],
    duration: {
        type: Number,
        default: 0,
        min: 0,
        comment: 'Duration in minutes'
    },
    isPreview: {
        type: Boolean,
        default: false,
        comment: 'Whether this lesson is available as a free preview'
    },
    resources: [{
        title: String,
        url: String,
        type: {
            type: String,
            enum: ['pdf', 'link', 'download']
        }
    }],
    completionCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
lessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });
lessonSchema.index({ tags: 1 });
lessonSchema.index({ topics: 1 });
lessonSchema.index({ roots: 1 });

// Virtual for checking if lesson has content
lessonSchema.virtual('hasContent').get(function () {
    return !!(this.textContent || this.imageUrl || this.videoUrl || this.interactiveExamples?.length > 0);
});

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;

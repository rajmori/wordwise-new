import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    text: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
    },
    options: {
        type: [String],
        validate: {
            validator: function (v) {
                return v.length === 4;
            },
            message: 'Each question must have exactly 4 options'
        }
    },
    correctOption: {
        type: Number,
        required: [true, 'Correct option index is required'],
        min: 0,
        max: 3
    },
    hint: {
        type: String,
        trim: true
    }
});

const quizSchema = new mongoose.Schema({
    alphabet: {
        type: String,
        required: [true, 'Alphabet is required'],
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    },
    sequence: {
        type: Number,
        required: [true, 'Sequence number is required'],
        min: 1,
        max: 90
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    createdBy: {
        type: String, // Storing admin name/ID for reference
        required: true
    },
    questions: [questionSchema]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for title (e.g., "A-05")
quizSchema.virtual('title').get(function () {
    return `${this.alphabet}-${this.sequence.toString().padStart(2, '0')}`;
});

// Compound unique index to prevent duplicate quizzes (e.g., A-01 can only exist once)
quizSchema.index({ alphabet: 1, sequence: 1 }, { unique: true });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;

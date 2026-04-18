import Quiz from '../models/Quiz.js';

// Create a new quiz
export const createQuiz = async (req, res) => {
    try {
        const { alphabet, sequence, questions, status, createdBy } = req.body;

        // Check for existing quiz with same Alphabet + Sequence
        const existingQuiz = await Quiz.findOne({ alphabet, sequence });
        if (existingQuiz) {
            return res.status(400).json({
                success: false,
                message: `A quiz with identifier ${alphabet}-${sequence} already exists.`
            });
        }

        const newQuiz = new Quiz({
            alphabet,
            sequence,
            questions: questions || [],
            status: status || 'draft',
            createdBy: req.body.admin ? req.body.admin.name : (createdBy || 'Admin')
        });

        await newQuiz.save();

        res.status(201).json({
            success: true,
            message: 'Quiz created successfully',
            quiz: newQuiz
        });
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating quiz'
        });
    }
};

// Get all quizzes with optional filters
export const getAllQuizzes = async (req, res) => {
    try {
        const { alphabet, status, search } = req.query;
        let query = {};

        if (alphabet) query.alphabet = alphabet;
        if (status) query.status = status;

        // Search logic might be tricky with Virtual 'title' but we can search by questions text
        // or just rely on alphabet/sequence filtering which is primary for admins
        if (search) {
            query['questions.text'] = { $regex: search, $options: 'i' };
        }

        const quizzes = await Quiz.find(query)
            .sort({ alphabet: 1, sequence: 1 });

        res.json({
            success: true,
            count: quizzes.length,
            quizzes
        });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching quizzes'
        });
    }
};

// Get single quiz by ID
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }
        res.json({
            success: true,
            quiz
        });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching quiz details'
        });
    }
};

// Update a quiz
export const updateQuiz = async (req, res) => {
    try {
        const { alphabet, sequence, questions, status } = req.body;

        // If changing alphabet/sequence, check for uniqueness again
        if (alphabet || sequence) {
            const existingQuiz = await Quiz.findOne({
                alphabet: alphabet,
                sequence: sequence,
                _id: { $ne: req.params.id }
            });

            if (existingQuiz) {
                return res.status(400).json({
                    success: false,
                    message: `A quiz with identifier ${alphabet}-${sequence} already exists.`
                });
            }
        }

        let updateData = { ...req.body };
        // Prevent accidental overwrite of createdBy or simple status update overriding logic
        delete updateData.createdBy;

        // If trying to publish, validate questions
        if (status === 'published') {
            const currentQuiz = await Quiz.findById(req.params.id);
            const questionsToCheck = questions || currentQuiz.questions;

            if (!questionsToCheck || questionsToCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot publish a quiz with no questions.'
                });
            }
        }

        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        res.json({
            success: true,
            message: 'Quiz updated successfully',
            quiz
        });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating quiz'
        });
    }
};

// Delete a quiz
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        res.json({
            success: true,
            message: 'Quiz deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting quiz'
        });
    }
};

// Publish a quiz (Shortcut)
export const publishQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        if (quiz.questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot publish a quiz with no questions.'
            });
        }

        quiz.status = 'published';
        await quiz.save();

        res.json({
            success: true,
            message: 'Quiz published successfully',
            quiz
        });
    } catch (error) {
        console.error('Error publishing quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while publishing quiz'
        });
    }
};

// Import Quizzes from CSV
import csv from 'csv-parser';
import { Readable } from 'stream';

export const importQuizzes = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const quizzesToUpsert = new Map();
    const results = [];
    const errors = [];

    try {
        await new Promise((resolve, reject) => {
            // Handle BOM if present
            const fileContent = req.file.buffer.toString().replace(/^\uFEFF/, '');
            const stream = Readable.from(fileContent);

            stream
                .pipe(csv())
                .on('data', (data) => {
                    // Normalize keys (trim spaces, lowercase, remove invisible chars)
                    const row = {};
                    Object.keys(data).forEach(key => {
                        const cleanKey = key.trim().toLowerCase().replace(/[^\x20-\x7E]/g, '');
                        row[cleanKey] = data[key]?.trim();
                    });

                    try {
                        // Extract data
                        const alphabet = row['alphabet']?.toUpperCase();
                        const sequence = parseInt(row['sequence']);
                        const text = row['question text'];
                        const options = [
                            row['option a'],
                            row['option b'],
                            row['option c'],
                            row['option d']
                        ];
                        const correctChar = row['correct option (a/b/c/d)']?.toUpperCase();
                        const hint = row['hint'];

                        // Validation
                        if (!alphabet || isNaN(sequence) || !text || !correctChar) {
                            throw new Error('Missing required fields');
                        }
                        if (options.some(opt => !opt)) {
                            throw new Error('All 4 options are required');
                        }

                        const correctOptionMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                        const correctOption = correctOptionMap[correctChar];

                        if (correctOption === undefined) {
                            throw new Error('Invalid correct option (must be A, B, C, or D)');
                        }

                        // Group by Quiz ID (Alphabet-Sequence)
                        const quizKey = `${alphabet}-${sequence}`;
                        if (!quizzesToUpsert.has(quizKey)) {
                            quizzesToUpsert.set(quizKey, {
                                alphabet,
                                sequence,
                                questions: []
                            });
                        }

                        quizzesToUpsert.get(quizKey).questions.push({
                            text,
                            options,
                            correctOption,
                            hint
                        });

                    } catch (err) {
                        errors.push(`Row error: ${err.message} (Data: ${JSON.stringify(data)})`);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (errors.length > 0) {
            console.warn('CSV Import Errors:', errors);
        }

        let updatedCount = 0;
        let createdCount = 0;

        // Process Quizzes
        for (const [key, data] of quizzesToUpsert) {
            let quiz = await Quiz.findOne({ alphabet: data.alphabet, sequence: data.sequence });

            if (quiz) {
                // Append questions
                quiz.questions.push(...data.questions);
                await quiz.save();
                updatedCount++;
            } else {
                // Create new quiz
                await Quiz.create({
                    alphabet: data.alphabet,
                    sequence: data.sequence,
                    questions: data.questions,
                    createdBy: req.user?._id || 'Import', // Assuming auth middleware adds user
                    status: 'draft'
                });
                createdCount++;
            }
        }

        res.json({
            success: true,
            message: `Import complete. Created ${createdCount} new quizzes, Updated ${updatedCount} existing quizzes.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error importing quizzes:', error);
        res.status(500).json({
            success: false,
            message: `Server error processing CSV file: ${error.message}`
        });
    }
};

import express from 'express';
import prisma from '../../../../config/db.prisma.js';
import { checkPermission } from '../../../../middleware/rbac.js';
import { logAudit } from '../../../../utils/audit.js';

const router = express.Router();

/**
 * GET / - List quizzes (paginated, with search and status/alphabet filters)
 */
router.get('/', checkPermission('quizzes:read'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status; // 'draft', 'published'
    const alphabet = req.query.alphabet;

    const skip = (page - 1) * limit;

    try {
        const whereClause = {
            AND: [
                search ? { title: { contains: search, mode: 'insensitive' } } : {},
                status ? { status } : {},
                alphabet ? { alphabet: { equals: alphabet, mode: 'insensitive' } } : {}
            ]
        };

        const [quizzes, totalCount] = await prisma.$transaction([
            prisma.quiz.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: [{ alphabet: 'asc' }, { sequence: 'asc' }],
                include: {
                    _count: {
                        select: { questions: true }
                    }
                }
            }),
            prisma.quiz.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            quizzes: quizzes.map(q => ({
                id: q.id,
                title: q.title || `${q.alphabet}-${q.sequence}`,
                alphabet: q.alphabet,
                sequence: q.sequence,
                status: q.status,
                questionCount: q._count.questions,
                createdAt: q.createdAt
            })),
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Fetch quizzes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
    }
});

/**
 * GET /:id - Retrieve single quiz details and questions for preview
 */
router.get('/:id', checkPermission('quizzes:read'), async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: req.params.id },
            include: {
                questions: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        res.json({ success: true, quiz });
    } catch (error) {
        console.error('Fetch quiz detail error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST / - Create a new quiz and load questions
 */
router.post('/', checkPermission('quizzes:write'), async (req, res) => {
    const { alphabet, sequence, status, questions } = req.body;
    if (!alphabet || !sequence) {
        return res.status(400).json({ success: false, message: 'Alphabet and sequence number are required' });
    }

    try {
        const title = `Alphabet ${alphabet.toUpperCase()} - Quiz ${sequence}`;
        
        // Atomic creation
        const quiz = await prisma.quiz.create({
            data: {
                title,
                alphabet: alphabet.toUpperCase(),
                sequence: parseInt(sequence),
                status: status || 'draft',
                createdBy: req.user.id,
                updatedBy: req.user.id,
                questions: questions && questions.length > 0 ? {
                    create: questions.map(q => ({
                        text: q.text,
                        options: q.options,
                        correctOption: parseInt(q.correctOption),
                        hint: q.hint || null
                    }))
                } : undefined
            },
            include: { questions: true }
        });

        await logAudit(req.user.id, 'quizzes:create', 'Quiz', quiz.id, { alphabet, sequence, correlationId: req.correlationId });

        res.status(201).json({ success: true, quiz });
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to create quiz' });
    }
});

/**
 * PUT /:id - Update quiz and its questions inside an atomic database transaction
 */
router.put('/:id', checkPermission('quizzes:write'), async (req, res) => {
    const { alphabet, sequence, status, questions } = req.body;

    try {
        const existing = await prisma.quiz.findUnique({
            where: { id: req.params.id }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const title = alphabet || sequence 
            ? `Alphabet ${(alphabet || existing.alphabet).toUpperCase()} - Quiz ${sequence || existing.sequence}`
            : existing.title;

        // Perform atomic update inside a transaction to prevent inconsistent states
        const updatedQuiz = await prisma.$transaction(async (tx) => {
            // Delete old questions if a new array is passed
            if (questions) {
                await tx.quizQuestion.deleteMany({
                    where: { quizId: req.params.id }
                });
            }

            return await tx.quiz.update({
                where: { id: req.params.id },
                data: {
                    title,
                    alphabet: alphabet ? alphabet.toUpperCase() : undefined,
                    sequence: sequence ? parseInt(sequence) : undefined,
                    status: status || undefined,
                    updatedBy: req.user.id,
                    questions: questions && questions.length > 0 ? {
                        create: questions.map(q => ({
                            text: q.text,
                            options: q.options,
                            correctOption: parseInt(q.correctOption),
                            hint: q.hint || null
                        }))
                    } : undefined
                },
                include: { questions: true }
            });
        });

        await logAudit(req.user.id, 'quizzes:update', 'Quiz', updatedQuiz.id, { 
            correlationId: req.correlationId,
            alphabet: updatedQuiz.alphabet,
            sequence: updatedQuiz.sequence
        });

        res.json({ success: true, quiz: updatedQuiz });
    } catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to update quiz' });
    }
});

/**
 * POST /:id/publish - Publish a quiz, checking that it contains at least 1 question
 */
router.post('/:id/publish', checkPermission('quizzes:publish'), async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { questions: true } } }
        });

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // BLOCK PUBLISHING: Validation check (At least 1 question)
        if (quiz._count.questions === 0) {
            return res.status(400).json({
                success: false,
                message: 'Publishing blocked: A quiz must contain at least one question.'
            });
        }

        const updated = await prisma.quiz.update({
            where: { id: req.params.id },
            data: {
                status: 'published',
                updatedBy: req.user.id
            }
        });

        await logAudit(req.user.id, 'quizzes:publish', 'Quiz', quiz.id, { correlationId: req.correlationId });

        res.json({ success: true, message: 'Quiz published successfully', quiz: updated });
    } catch (error) {
        console.error('Publish quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to publish quiz' });
    }
});

/**
 * DELETE /:id - Delete quiz (only allowed if quiz status is 'draft')
 */
router.delete('/:id', checkPermission('quizzes:write'), async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        if (quiz.status === 'published') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a published quiz. Revert it to draft first.'
            });
        }

        await prisma.quiz.delete({ where: { id: req.params.id } });

        await logAudit(req.user.id, 'quizzes:delete', 'Quiz', req.params.id, { correlationId: req.correlationId });

        res.json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete quiz' });
    }
});

export default router;

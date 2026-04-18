import express from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    createQuiz,
    getAllQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    publishQuiz,
    importQuizzes
} from '../controllers/quizController.js';

const router = express.Router();

// Apply admin authentication to all quiz routes
router.use(authenticateAdmin);

// Import Route
router.post('/import', upload.single('file'), importQuizzes);

// Routes
router.route('/')
    .get(getAllQuizzes)
    .post(createQuiz);

router.route('/:id')
    .get(getQuizById)
    .put(updateQuiz)
    .delete(deleteQuiz);

router.patch('/:id/publish', publishQuiz);

export default router;

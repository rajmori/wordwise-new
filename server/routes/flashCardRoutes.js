import express from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    createFlashCard,
    getFlashCards,
    getUserFlashCards,
    updateFlashCard,
    archiveFlashCard,
    deleteFlashCard
} from '../controllers/flashCardController.js';
import { bulkUploadFlashCards } from '../controllers/flashCardBulkController.js';

// Import User Auth Middleware
import { authenticateUser } from '../middleware/userAuth.js';
import { checkSubscriptionAccess } from '../middleware/checkSubscriptionAccess.js';

const router = express.Router();

// Public/User Routes (Protected by Subscription)
router.get('/user', authenticateUser, checkSubscriptionAccess, getUserFlashCards);

// Admin Routes
router.use(authenticateAdmin);

// Bulk Upload Route
router.post('/bulk-upload', upload.single('file'), bulkUploadFlashCards);

router.route('/')
    .get(getFlashCards)
    .post(upload.single('image'), createFlashCard);

router.route('/:id')
    .put(upload.single('image'), updateFlashCard)
    .delete(deleteFlashCard);

router.route('/:id/archive')
    .patch(archiveFlashCard);

export default router;

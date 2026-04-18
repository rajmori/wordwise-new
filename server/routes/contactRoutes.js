import express from 'express';
import { sendContactEmail } from '../controllers/contactController.js';

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Send contact form email to ifusetech@gmail.com
 * @access  Public
 */
router.post('/', sendContactEmail);

export default router;


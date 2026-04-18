import express from 'express';
import upload from '../middleware/upload.js';
import { authenticateAdmin } from '../middleware/auth.js';
import {
    uploadImage,
    uploadVideo,
    uploadDocument,
    deleteFile
} from '../controllers/uploadController.js';

const router = express.Router();

// All upload routes require admin authentication
router.post('/image', authenticateAdmin, upload.single('image'), uploadImage);
router.post('/video', authenticateAdmin, upload.single('video'), uploadVideo);
router.post('/document', authenticateAdmin, upload.single('document'), uploadDocument);
router.delete('/', authenticateAdmin, deleteFile);

export default router;

import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getProfile)
    .put(protect, updateProfile);

export default router;

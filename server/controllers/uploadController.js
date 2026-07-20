import { uploadToS3, deleteFromS3 } from '../utils/s3-storage.js';

/**
 * Upload image to GCP bucket
 */
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { courseId = 'general' } = req.body;
        const folder = `courses/${courseId}/images`;

        const imageUrl = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            folder
        );

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: imageUrl,
                filename: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
};

/**
 * Upload video to GCP bucket
 */
export const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { courseId = 'general' } = req.body;
        const folder = `courses/${courseId}/videos`;

        const videoUrl = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            folder
        );

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                url: videoUrl,
                filename: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('❌ Video upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading video',
            error: error.message
        });
    }
};

/**
 * Upload document/PDF to GCP bucket
 */
export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { courseId = 'general' } = req.body;
        const folder = `courses/${courseId}/documents`;

        const docUrl = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            folder
        );

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                url: docUrl,
                filename: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading document',
            error: error.message
        });
    }
};

/**
 * Delete file from GCP bucket
 */
export const deleteFile = async (req, res) => {
    try {
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'File URL is required'
            });
        }

        const deleted = await deleteFromS3(fileUrl);

        if (deleted) {
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete file'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message
        });
    }
};

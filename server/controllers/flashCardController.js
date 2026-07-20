import FlashCard from '../models/FlashCard.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3-storage.js';

// @desc    Create a new flash card
// @route   POST /api/flash-cards
// @access  Private/Admin
export const createFlashCard = async (req, res) => {
    try {
        const { word1, word2, description, category, tags } = req.body;

        // Validation
        if (!word1 || !word2 || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide word1, word2, and category'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        // Upload to S3
        // Using 'flash-cards' folder in bucket
        const imageUrl = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'flash-cards'
        );

        // Process tags
        const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [];

        const flashCard = await FlashCard.create({
            word1,
            word2,
            description,
            category,
            tags: tagsArray,
            imageUrl
        });

        res.status(201).json({
            success: true,
            data: flashCard
        });
    } catch (error) {
        console.error('Error creating flash card:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

// @desc    Get all flash cards with filtering
// @route   GET /api/flash-cards
// @access  Private/Admin
export const getFlashCards = async (req, res) => {
    try {
        const { search, category, tag, sort } = req.query;
        let query = {};

        // Search by words or description
        if (search) {
            query.$text = { $search: search };
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by tag
        if (tag) {
            query.tags = tag;
        }

        // Exclude archived by default unless asked? 
        // User didn't specify, but usually admin wants to see all or filter.
        // Let's allow filtering by archive status if needed, but default to showing all for admin management.
        if (req.query.isArchived) {
            query.isArchived = req.query.isArchived === 'true';
        }

        let dbQuery = FlashCard.find(query);

        // Sort
        if (sort === 'oldest') {
            dbQuery = dbQuery.sort({ createdAt: 1 });
        } else {
            dbQuery = dbQuery.sort({ createdAt: -1 }); // Default new to old
        }

        const flashCards = await dbQuery;

        res.status(200).json({
            success: true,
            count: flashCards.length,
            data: flashCards
        });
    } catch (error) {
        console.error('Error fetching flash cards:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get all flash cards for users (Subscribed)
// @route   GET /api/flash-cards/user
// @access  Private/Subscribed
export const getUserFlashCards = async (req, res) => {
    try {
        const { search, category, tag, sort } = req.query;
        let query = { isArchived: false }; // Always exclude archived for users

        // Search
        if (search) {
            query.$text = { $search: search };
        }

        // Filter
        if (category) query.category = category;
        if (tag) query.tags = tag;

        let dbQuery = FlashCard.find(query);

        // Sort
        if (sort === 'oldest') {
            dbQuery = dbQuery.sort({ createdAt: 1 });
        } else if (sort === 'viewed') {
            // Future: sort by views if tracked
            dbQuery = dbQuery.sort({ createdAt: -1 });
        } else {
            dbQuery = dbQuery.sort({ createdAt: -1 });
        }

        const flashCards = await dbQuery.select('-isArchived'); // Hide internal flags

        res.status(200).json({
            success: true,
            count: flashCards.length,
            data: flashCards
        });
    } catch (error) {
        console.error('Error fetching user flash cards:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update a flash card
// @route   PUT /api/flash-cards/:id
// @access  Private/Admin
export const updateFlashCard = async (req, res) => {
    try {
        let flashCard = await FlashCard.findById(req.params.id);

        if (!flashCard) {
            return res.status(404).json({
                success: false,
                message: 'Flash card not found'
            });
        }

        const { word1, word2, description, category, tags } = req.body;
        let imageUrl = flashCard.imageUrl;

        // If new image uploaded
        if (req.file) {
            try {
                // Delete old image
                await deleteFromS3(flashCard.imageUrl);
            } catch (err) {
                console.error('Failed to delete old image from S3:', err);
                // Continue with upload even if delete fails
            }

            // Upload new image
            imageUrl = await uploadToS3(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'flash-cards'
            );
        }

        // Process tags
        // If tags are sent, update them. Else keep existing? 
        // Usually PUT replaces. Let's assume sending the full object or what changed.
        let tagsArray = flashCard.tags;
        if (tags !== undefined) {
            tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
        }

        flashCard.word1 = word1 || flashCard.word1;
        flashCard.word2 = word2 || flashCard.word2;
        flashCard.description = description !== undefined ? description : flashCard.description;
        flashCard.category = category || flashCard.category;
        flashCard.tags = tagsArray;
        flashCard.imageUrl = imageUrl;

        const updatedFlashCard = await flashCard.save();

        res.status(200).json({
            success: true,
            data: updatedFlashCard
        });
    } catch (error) {
        console.error('Error updating flash card:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

// @desc    Archive/Unarchive a flash card
// @route   PATCH /api/flash-cards/:id/archive
// @access  Private/Admin
export const archiveFlashCard = async (req, res) => {
    try {
        const flashCard = await FlashCard.findById(req.params.id);

        if (!flashCard) {
            return res.status(404).json({
                success: false,
                message: 'Flash card not found'
            });
        }

        flashCard.isArchived = !flashCard.isArchived;
        await flashCard.save();

        res.status(200).json({
            success: true,
            data: flashCard,
            message: `Flash card ${flashCard.isArchived ? 'archived' : 'unarchived'}`
        });
    } catch (error) {
        console.error('Error archiving flash card:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete a flash card
// @route   DELETE /api/flash-cards/:id
// @access  Private/SuperAdmin
export const deleteFlashCard = async (req, res) => {
    try {
        const flashCard = await FlashCard.findById(req.params.id);

        if (!flashCard) {
            return res.status(404).json({
                success: false,
                message: 'Flash card not found'
            });
        }

        // Delete image from S3
        if (flashCard.imageUrl) {
            await deleteFromS3(flashCard.imageUrl);
        }

        await flashCard.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Flash card deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting flash card:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

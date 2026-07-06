import express from 'express';
import multer from 'multer';
import prisma from '../../../../config/db.prisma.js';
import { checkPermission } from '../../../../middleware/rbac.js';
import { logAudit } from '../../../../utils/audit.js';
import { getUploadSignedUrl, getDownloadSignedUrl } from '../../../../utils/gcs.js';
import { LMSMigrationAdapter } from '../../../../utils/migration-adapter.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit for archive files

/**
 * GET / - List all courses with metadata
 */
router.get('/', checkPermission('courses:read'), async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                lessons: {
                    select: { id: true }
                }
            }
        });
        res.json({ success: true, courses });
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses' });
    }
});

/**
 * POST / - Create a new course
 */
router.post('/', checkPermission('courses:write'), async (req, res) => {
    const { title, description, instructor } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, message: 'Course title is required' });
    }

    try {
        const course = await prisma.course.create({
            data: {
                title,
                description,
                instructor,
                createdBy: req.user.id,
                updatedBy: req.user.id
            }
        });

        await logAudit(req.user.id, 'courses:create', 'Course', course.id, { title, correlationId: req.correlationId });

        res.status(201).json({ success: true, course });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ success: false, message: 'Failed to create course' });
    }
});

/**
 * PUT /:id - Edit details of a course
 */
router.put('/:id', checkPermission('courses:write'), async (req, res) => {
    const { title, description, instructor } = req.body;

    try {
        const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const course = await prisma.course.update({
            where: { id: req.params.id },
            data: {
                title: title || undefined,
                description: description || undefined,
                instructor: instructor || undefined,
                updatedBy: req.user.id
            }
        });

        await logAudit(req.user.id, 'courses:update', 'Course', course.id, { 
            correlationId: req.correlationId,
            changes: { title, description, instructor }
        });

        res.json({ success: true, course });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

/**
 * POST /:id/publish - Publish course with strict validations
 */
router.post('/:id/publish', checkPermission('courses:publish'), async (req, res) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: req.params.id },
            include: {
                lessons: {
                    include: {
                        mediaAssets: true
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // BLOCK PUBLISHING: Validation Check 1 (At least 1 lesson)
        if (course.lessons.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Publishing blocked: A course must contain at least one lesson.'
            });
        }

        // BLOCK PUBLISHING: Validation Check 2 (All lessons must contain media/content assets)
        const emptyLessons = course.lessons.filter(lesson => lesson.mediaAssets.length === 0);
        if (emptyLessons.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Publishing blocked: The following lessons are missing media assets: ${emptyLessons.map(l => `"${l.title}"`).join(', ')}`
            });
        }

        const updated = await prisma.course.update({
            where: { id: req.params.id },
            data: {
                isPublished: true,
                updatedBy: req.user.id
            }
        });

        await logAudit(req.user.id, 'courses:publish', 'Course', course.id, { correlationId: req.correlationId });

        res.json({ success: true, message: 'Course published successfully', course: updated });
    } catch (error) {
        console.error('Publish course error:', error);
        res.status(500).json({ success: false, message: 'Failed to publish course' });
    }
});

/**
 * POST /:id/lessons - Add a lesson to a course
 */
router.post('/:id/lessons', checkPermission('courses:write'), async (req, res) => {
    const { title, description, sequence } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, message: 'Lesson title is required' });
    }

    try {
        const lesson = await prisma.lesson.create({
            data: {
                courseId: req.params.id,
                title,
                description,
                sequence: parseInt(sequence) || 0,
                createdBy: req.user.id,
                updatedBy: req.user.id
            }
        });

        await logAudit(req.user.id, 'lessons:create', 'Lesson', lesson.id, { title, courseId: req.params.id, correlationId: req.correlationId });

        res.status(201).json({ success: true, lesson });
    } catch (error) {
        console.error('Create lesson error:', error);
        res.status(500).json({ success: false, message: 'Failed to create lesson' });
    }
});

/**
 * POST /media/signed-upload - Generate GCS Signed URL for media asset upload
 */
router.post('/media/signed-upload', checkPermission('courses:write'), async (req, res) => {
    const { fileName, contentType, fileSize, lessonId } = req.body;
    if (!fileName || !contentType || !fileSize) {
        return res.status(400).json({ success: false, message: 'fileName, contentType, and fileSize are required' });
    }

    try {
        const fileKey = `courses/media/${Date.now()}-${fileName}`;
        const uploadUrl = await getUploadSignedUrl(fileKey, contentType);

        // Record pending media asset in PostgreSQL
        const mediaAsset = await prisma.mediaAsset.create({
            data: {
                lessonId: lessonId || null,
                url: fileKey, // Store the GCS file key
                type: contentType.split('/')[0], // e.g. 'video', 'image', 'application'
                size: parseInt(fileSize),
                status: 'pending',
                uploadedBy: req.user.id
            }
        });

        res.json({
            success: true,
            uploadUrl,
            mediaAssetId: mediaAsset.id,
            fileKey
        });
    } catch (error) {
        console.error('Signed URL generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate signed upload URL' });
    }
});

/**
 * POST /media/confirm-upload - Confirm GCS upload completion and activate media asset status
 */
router.post('/media/confirm-upload', checkPermission('courses:write'), async (req, res) => {
    const { mediaAssetId } = req.body;
    if (!mediaAssetId) {
        return res.status(400).json({ success: false, message: 'mediaAssetId is required' });
    }

    try {
        const asset = await prisma.mediaAsset.update({
            where: { id: mediaAssetId },
            data: { status: 'uploaded' }
        });

        res.json({ success: true, message: 'Upload confirmed', asset });
    } catch (error) {
        console.error('Confirm upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm upload status' });
    }
});

/**
 * POST /import/moodle - Import course from Moodle backup (.mbz / zip format)
 */
router.post('/import/moodle', checkPermission('courses:write'), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Moodle archive file is required' });
    }

    try {
        const result = await LMSMigrationAdapter.importMoodleArchive(req.file.buffer, req.user.id);
        
        await logAudit(req.user.id, 'courses:import_moodle', 'Course', result.courseId, { 
            correlationId: req.correlationId,
            fileName: req.file.originalname 
        });

        res.json({ success: true, message: 'Moodle course imported successfully', result });
    } catch (error) {
        console.error('Moodle import route error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /import/openedx - Import course from Open edX export (.tar.gz / zip format)
 */
router.post('/import/openedx', checkPermission('courses:write'), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Open edX archive file is required' });
    }

    try {
        const result = await LMSMigrationAdapter.importOpenEdxArchive(req.file.buffer, req.user.id);
        
        await logAudit(req.user.id, 'courses:import_openedx', 'Course', result.courseId, { 
            correlationId: req.correlationId,
            fileName: req.file.originalname 
        });

        res.json({ success: true, message: 'Open edX course imported successfully', result });
    } catch (error) {
        console.error('Open edX import route error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /import/learners - Bulk import users/learners from CSV
 */
router.post('/import/learners', checkPermission('users:write'), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Learner CSV file is required' });
    }

    try {
        const result = await LMSMigrationAdapter.importLearnerCSV(req.file.buffer);
        
        await logAudit(req.user.id, 'users:import_csv', 'User', 'bulk', { 
            correlationId: req.correlationId,
            fileName: req.file.originalname,
            created: result.created,
            skipped: result.skipped
        });

        res.json(result);
    } catch (error) {
        console.error('Learner CSV import route error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Course from '../../../../models/Course.js';
import Lesson from '../../../../models/Lesson.js';
import { checkPermission } from '../../../../middleware/rbac.js';
import { logAudit } from '../../../../utils/audit.js';
import { getUploadSignedUrl, getDownloadSignedUrl } from '../../../../utils/s3-signed.js';
import { LMSMigrationAdapter } from '../../../../utils/migration-adapter.js';

const router = express.Router();

// 50 MB limit for LMS archive imports
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

// Allowed MIME types for media uploads
const ALLOWED_MEDIA_TYPES = new Set([
    'video/mp4', 'video/webm', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'audio/mpeg', 'audio/mp4', 'audio/ogg'
]);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ── Course CRUD ───────────────────────────────────────────────────────────────

/**
 * GET / — List all courses with summary metadata
 */
router.get('/', checkPermission('courses:read'), async (req, res) => {
    try {
        const courses = await Course.find()
            .sort({ createdAt: -1 })
            .select('courseId title description instructor status difficultyLevel enrollmentCount thumbnailUrl category createdAt modules')
            .lean();

        res.json({
            success: true,
            courses: courses.map(c => ({
                id: c._id,
                courseId: c.courseId,
                title: c.title,
                description: c.description,
                instructor: c.instructor,
                status: c.status,
                difficultyLevel: c.difficultyLevel,
                enrollmentCount: c.enrollmentCount,
                thumbnailUrl: c.thumbnailUrl || null,
                category: c.category || null,
                moduleCount: c.modules?.length || 0,
                lessonCount: c.modules?.reduce((t, m) => t + (m.lessons?.length || 0), 0) || 0,
                createdAt: c.createdAt
            }))
        });
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses' });
    }
});

/**
 * GET /:id — Full course detail including modules & lessons
 */
router.get('/:id', checkPermission('courses:read'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Fetch all lessons belonging to this course
        const lessons = await Lesson.find({ courseId: req.params.id })
            .sort({ moduleId: 1, order: 1 })
            .lean();

        res.json({ success: true, course, lessons });
    } catch (error) {
        console.error('Fetch course detail error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST / — Create a new course
 */
router.post('/', checkPermission('courses:write'), async (req, res) => {
    const { title, description, instructor, difficultyLevel, category, estimatedDuration, tags, price } = req.body;

    if (!title || !description) {
        return res.status(400).json({ success: false, message: 'title and description are required' });
    }

    try {
        const course = await Course.create({
            title,
            description,
            instructor: instructor || '',
            difficultyLevel: difficultyLevel || 'Beginner',
            category: category || '',
            estimatedDuration: estimatedDuration || { value: 1, unit: 'days' },
            tags: tags || [],
            price: price || 0,
            status: 'draft',
            createdBy: req.user.id
        });

        await logAudit(req.user.id, 'courses:create', 'Course', course._id.toString(), {
            correlationId: req.correlationId, title
        });

        res.status(201).json({ success: true, course });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ success: false, message: 'Failed to create course' });
    }
});

/**
 * PUT /:id — Update course metadata
 */
router.put('/:id', checkPermission('courses:write'), async (req, res) => {
    const { title, description, instructor, difficultyLevel, category, tags, price, estimatedDuration } = req.body;

    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const existing = await Course.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const updates = {};
        if (title !== undefined)             updates.title = title;
        if (description !== undefined)       updates.description = description;
        if (instructor !== undefined)        updates.instructor = instructor;
        if (difficultyLevel !== undefined)   updates.difficultyLevel = difficultyLevel;
        if (category !== undefined)          updates.category = category;
        if (tags !== undefined)              updates.tags = tags;
        if (price !== undefined)             updates.price = price;
        if (estimatedDuration !== undefined) updates.estimatedDuration = estimatedDuration;

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        await logAudit(req.user.id, 'courses:update', 'Course', course._id.toString(), {
            correlationId: req.correlationId, changes: updates
        });

        res.json({ success: true, course });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

/**
 * POST /:id/publish — Publish course (must have at least 1 module with 1 lesson)
 */
router.post('/:id/publish', checkPermission('courses:publish'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!course.modules || course.modules.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Publishing blocked: course must have at least one module.'
            });
        }

        const totalLessons = course.modules.reduce((t, m) => t + (m.lessons?.length || 0), 0);
        if (totalLessons === 0) {
            return res.status(400).json({
                success: false,
                message: 'Publishing blocked: course modules must contain at least one lesson.'
            });
        }

        course.status = 'published';
        course.publishedAt = new Date();
        await course.save();

        await logAudit(req.user.id, 'courses:publish', 'Course', course._id.toString(), {
            correlationId: req.correlationId
        });

        res.json({ success: true, message: 'Course published successfully', course });
    } catch (error) {
        console.error('Publish course error:', error);
        res.status(500).json({ success: false, message: 'Failed to publish course' });
    }
});

/**
 * POST /:id/unpublish — Revert course to draft
 */
router.post('/:id/unpublish', checkPermission('courses:publish'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'draft' } },
            { new: true }
        );

        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        await logAudit(req.user.id, 'courses:unpublish', 'Course', course._id.toString(), {
            correlationId: req.correlationId
        });

        res.json({ success: true, message: 'Course reverted to draft', course });
    } catch (error) {
        console.error('Unpublish error:', error);
        res.status(500).json({ success: false, message: 'Failed to unpublish course' });
    }
});

// ── Modules ───────────────────────────────────────────────────────────────────

/**
 * POST /:id/modules — Add a module to a course
 */
router.post('/:id/modules', checkPermission('courses:write'), async (req, res) => {
    const { title, description, order } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Module title is required' });

    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const newModule = {
            _id: new mongoose.Types.ObjectId(),
            title,
            description: description || '',
            order: order !== undefined ? parseInt(order) : course.modules.length,
            lessons: []
        };

        course.modules.push(newModule);
        await course.save();

        await logAudit(req.user.id, 'courses:module_add', 'Course', course._id.toString(), {
            correlationId: req.correlationId, moduleTitle: title
        });

        res.status(201).json({ success: true, module: newModule });
    } catch (error) {
        console.error('Add module error:', error);
        res.status(500).json({ success: false, message: 'Failed to add module' });
    }
});

// ── Lessons ───────────────────────────────────────────────────────────────────

/**
 * POST /:id/modules/:moduleId/lessons — Add a lesson to a module
 */
router.post('/:id/modules/:moduleId/lessons', checkPermission('courses:write'), async (req, res) => {
    const { title, description, contentType, textContent, order } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Lesson title is required' });

    try {
        if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.moduleId)) {
            return res.status(400).json({ success: false, message: 'Invalid course or module ID' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const mod = course.modules.id(req.params.moduleId);
        if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });

        // Create Lesson document in MongoDB
        const lesson = await Lesson.create({
            courseId: req.params.id,
            moduleId: req.params.moduleId,
            title,
            description: description || '',
            contentType: contentType || 'text',
            textContent: textContent || '',
            order: order !== undefined ? parseInt(order) : mod.lessons.length
        });

        // Add lesson ref to module
        mod.lessons.push(lesson._id);
        await course.save();

        await logAudit(req.user.id, 'lessons:create', 'Lesson', lesson._id.toString(), {
            correlationId: req.correlationId, title, courseId: req.params.id
        });

        res.status(201).json({ success: true, lesson });
    } catch (error) {
        console.error('Create lesson error:', error);
        res.status(500).json({ success: false, message: 'Failed to create lesson' });
    }
});

/**
 * PUT /:id/lessons/:lessonId — Update lesson content/metadata
 */
router.put('/:id/lessons/:lessonId', checkPermission('courses:write'), async (req, res) => {
    const { title, description, contentType, textContent, order, isPreview } = req.body;

    try {
        if (!isValidObjectId(req.params.lessonId)) {
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }

        const updates = {};
        if (title !== undefined)       updates.title = title;
        if (description !== undefined) updates.description = description;
        if (contentType !== undefined) updates.contentType = contentType;
        if (textContent !== undefined) updates.textContent = textContent;
        if (order !== undefined)       updates.order = parseInt(order);
        if (isPreview !== undefined)   updates.isPreview = isPreview;

        const lesson = await Lesson.findByIdAndUpdate(
            req.params.lessonId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

        await logAudit(req.user.id, 'lessons:update', 'Lesson', lesson._id.toString(), {
            correlationId: req.correlationId, changes: updates
        });

        res.json({ success: true, lesson });
    } catch (error) {
        console.error('Update lesson error:', error);
        res.status(500).json({ success: false, message: 'Failed to update lesson' });
    }
});

// ── GCS Media Upload Flow ─────────────────────────────────────────────────────

/**
 * POST /media/signed-upload — Generate a GCS signed upload URL
 * Media files go to GCP; the GCS file key is stored on the Lesson document.
 */
router.post('/media/signed-upload', checkPermission('courses:write'), async (req, res) => {
    const { fileName, contentType, fileSize, lessonId } = req.body;

    if (!fileName || !contentType || !fileSize) {
        return res.status(400).json({ success: false, message: 'fileName, contentType, and fileSize are required' });
    }

    if (!ALLOWED_MEDIA_TYPES.has(contentType)) {
        return res.status(400).json({
            success: false,
            message: `Content type "${contentType}" is not allowed. Permitted: video, image, pdf, audio.`
        });
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
    if (parseInt(fileSize) > MAX_FILE_SIZE) {
        return res.status(400).json({ success: false, message: 'File exceeds the 2 GB limit' });
    }

    try {
        // Verify lesson exists in MongoDB before issuing URL
        if (lessonId && isValidObjectId(lessonId)) {
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.status(404).json({ success: false, message: 'Lesson not found' });
            }
        }

        const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileKey = `courses/media/${Date.now()}-${safeFileName}`;

        // Generate signed upload URL from GCS (15 min expiry)
        const uploadUrl = await getUploadSignedUrl(fileKey, contentType, 15);

        res.json({
            success: true,
            uploadUrl,
            fileKey,
            lessonId: lessonId || null,
            expiresIn: '15 minutes'
        });
    } catch (error) {
        console.error('Signed URL generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate signed upload URL: ' + error.message });
    }
});

/**
 * POST /media/confirm-upload — Confirm GCS upload, store file key on Lesson in MongoDB
 */
router.post('/media/confirm-upload', checkPermission('courses:write'), async (req, res) => {
    const { lessonId, fileKey, contentType } = req.body;

    if (!lessonId || !fileKey || !contentType) {
        return res.status(400).json({ success: false, message: 'lessonId, fileKey, and contentType are required' });
    }

    try {
        if (!isValidObjectId(lessonId)) {
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }

        // Determine which URL field to update on the Lesson
        const mediaCategory = contentType.split('/')[0];
        const urlFieldMap = { video: 'videoUrl', image: 'imageUrl', audio: 'videoUrl', application: 'imageUrl' };
        const urlField = urlFieldMap[mediaCategory] || 'videoUrl';

        const lesson = await Lesson.findByIdAndUpdate(
            lessonId,
            {
                $set: {
                    [urlField]: fileKey,
                    contentType: mediaCategory === 'video' ? 'video'
                        : mediaCategory === 'image' ? 'image'
                        : mediaCategory === 'audio' ? 'mixed'
                        : 'mixed'
                }
            },
            { new: true }
        );

        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

        await logAudit(req.user.id, 'media:confirm_upload', 'Lesson', lessonId, {
            correlationId: req.correlationId, fileKey, contentType
        });

        res.json({ success: true, message: 'Media confirmed and linked to lesson', lesson });
    } catch (error) {
        console.error('Confirm upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm upload' });
    }
});

/**
 * GET /media/download/:lessonId — Get a short-lived signed download URL for a lesson's media
 */
router.get('/media/download/:lessonId', checkPermission('courses:read'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.lessonId)) {
            return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }

        const lesson = await Lesson.findById(req.params.lessonId).lean();
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

        const fileKey = lesson.videoUrl || lesson.imageUrl;
        if (!fileKey) {
            return res.status(404).json({ success: false, message: 'No media file found for this lesson' });
        }

        const downloadUrl = await getDownloadSignedUrl(fileKey, 30);

        res.json({ success: true, downloadUrl, fileKey, expiresIn: '30 minutes' });
    } catch (error) {
        console.error('Download URL error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate download URL: ' + error.message });
    }
});

// ── LMS Import ────────────────────────────────────────────────────────────────

/**
 * POST /import/moodle — Import from Moodle .mbz archive
 */
router.post('/import/moodle', checkPermission('courses:write'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Moodle archive file is required' });

    try {
        const result = await LMSMigrationAdapter.importMoodleArchive(req.file.buffer, req.user.id);
        await logAudit(req.user.id, 'courses:import_moodle', 'Course', result.courseId, {
            correlationId: req.correlationId, fileName: req.file.originalname
        });
        res.json({ success: true, message: 'Moodle course imported successfully', result });
    } catch (error) {
        console.error('Moodle import error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /import/openedx — Import from Open edX export archive
 */
router.post('/import/openedx', checkPermission('courses:write'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Open edX archive file is required' });

    try {
        const result = await LMSMigrationAdapter.importOpenEdxArchive(req.file.buffer, req.user.id);
        await logAudit(req.user.id, 'courses:import_openedx', 'Course', result.courseId, {
            correlationId: req.correlationId, fileName: req.file.originalname
        });
        res.json({ success: true, message: 'Open edX course imported successfully', result });
    } catch (error) {
        console.error('Open edX import error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /import/learners — Bulk import users from CSV
 */
router.post('/import/learners', checkPermission('users:write'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });

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
        console.error('Learner CSV import error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

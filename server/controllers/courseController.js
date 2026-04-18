import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { validationResult } from 'express-validator';

/**
 * Get all courses with pagination, search, and filters
 */
export const getAllCourses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            difficulty = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (status) {
            query.status = status;
        }

        if (difficulty) {
            query.difficultyLevel = difficulty;
        }

        // Execute query with pagination
        const courses = await Course.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Course.countDocuments(query);

        res.json({
            success: true,
            data: courses,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

/**
 * Get single course by ID with all lessons
 */
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get all lessons for this course
        const lessons = await Lesson.find({ courseId: course._id })
            .sort({ order: 1 })
            .exec();

        // Build a lookup map for fast access
        const lessonMap = {};
        for (const lesson of lessons) {
            lessonMap[lesson._id.toString()] = lesson.toObject();
        }

        // Hydrate modules: replace ObjectId references with full lesson objects
        const courseObj = course.toObject();
        courseObj.modules = courseObj.modules.map(mod => ({
            ...mod,
            lessons: (mod.lessons || []).map(lid => lessonMap[lid.toString()] || lid)
        }));

        res.json({
            success: true,
            data: {
                ...courseObj,
                lessonsData: lessons
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching course',
            error: error.message
        });
    }
};

/**
 * Helper to process modules and lessons
 * Creates/Updates Lesson documents and replaces lesson objects with IDs in modules
 */
const processModulesAndLessons = async (courseId, modules) => {
    if (!modules || !Array.isArray(modules)) return [];

    const updatedModules = [];

    for (let i = 0; i < modules.length; i++) {
        const moduleData = modules[i];
        const lessons = moduleData.lessons || [];
        const lessonIds = [];

        // Ensure we have a valid moduleId (prefer existing if valid, otherwise new)
        let moduleId;
        if (moduleData._id && mongoose.Types.ObjectId.isValid(moduleData._id)) {
            moduleId = moduleData._id;
        } else {
            moduleId = new mongoose.Types.ObjectId();
        }

        // Handle lessons for this module
        for (let j = 0; j < lessons.length; j++) {
            const lessonData = lessons[j];

            // If lessonData is a bare ObjectId string or ObjectId (already saved, no full data)
            // just keep the reference — don't try to create/update it without required fields
            const isBareLessonId =
                typeof lessonData === 'string' ||
                lessonData instanceof mongoose.Types.ObjectId ||
                (!lessonData.title && lessonData._id && mongoose.Types.ObjectId.isValid(lessonData._id));

            if (isBareLessonId) {
                const existingId = lessonData._id || lessonData;
                if (mongoose.Types.ObjectId.isValid(existingId.toString())) {
                    lessonIds.push(new mongoose.Types.ObjectId(existingId.toString()));
                }
                continue;
            }

            let lesson;

            // Only extract valid lesson fields to avoid CastErrors or extra data issues
            const lessonFields = {
                title: lessonData.title,
                description: lessonData.description,
                contentType: lessonData.contentType || 'text',
                textContent: lessonData.textContent,
                imageUrl: lessonData.imageUrl,
                videoUrl: lessonData.videoUrl,
                videoThumbnail: lessonData.videoThumbnail,
                interactiveExamples: lessonData.interactiveExamples,
                tags: lessonData.tags,
                duration: lessonData.duration,
                isPreview: lessonData.isPreview,
                resources: lessonData.resources,
                courseId: courseId,
                moduleId: moduleId,
                order: j
            };

            if (lessonData._id && mongoose.Types.ObjectId.isValid(lessonData._id)) {
                // Update existing lesson
                lesson = await Lesson.findByIdAndUpdate(lessonData._id, lessonFields, { new: true, runValidators: true });
                if (!lesson) {
                    // Doc was deleted — recreate it
                    lesson = await Lesson.create({ ...lessonFields });
                }
            } else {
                // Create new lesson
                lesson = await Lesson.create(lessonFields);
            }

            if (lesson) {
                lessonIds.push(lesson._id);
            }
        }

        // Reconstruct module object with only valid fields
        updatedModules.push({
            _id: moduleId,
            title: moduleData.title,
            description: moduleData.description,
            order: moduleData.order || i,
            lessons: lessonIds
        });
    }

    return updatedModules;
};

/**
 * Create new course
 */
export const createCourse = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { modules, ...otherData } = req.body;

        const course = new Course({
            ...otherData,
            createdBy: req.admin?.email || 'admin'
        });

        // Process modules and lessons if provided
        if (modules && modules.length > 0) {
            course.modules = await processModulesAndLessons(course._id, modules);
        }

        await course.save();

        res.status(201).json({
            success: true,
            message: 'Course and lessons created successfully',
            data: course
        });
    } catch (error) {
        console.error('Create Course Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating course',
            error: error.message
        });
    }
};

/**
 * Update course
 */
export const updateCourse = async (req, res) => {
    try {
        const { modules, ...otherData } = req.body;

        // 1. Update the course basic data
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Update basic fields
        Object.assign(course, otherData);

        // 2. Handle Modules and Lessons if provided
        if (modules && Array.isArray(modules)) {
            course.modules = await processModulesAndLessons(course._id, modules);
        }

        await course.save();

        res.json({
            success: true,
            message: 'Course and lessons updated successfully',
            data: course
        });
    } catch (error) {
        console.error('❌ Update Course Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating course and lessons',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Delete course
 */
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Delete all lessons associated with this course
        await Lesson.deleteMany({ courseId: req.params.id });

        res.json({
            success: true,
            message: 'Course and associated lessons deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
};

/**
 * Toggle course publish status
 */
export const togglePublishStatus = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        course.status = course.status === 'published' ? 'draft' : 'published';
        await course.save();

        res.json({
            success: true,
            message: `Course ${course.status === 'published' ? 'published' : 'unpublished'} successfully`,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating course status',
            error: error.message
        });
    }
};

/**
 * Get course statistics
 */
export const getCourseStats = async (req, res) => {
    try {
        const totalCourses = await Course.countDocuments();
        const publishedCourses = await Course.countDocuments({ status: 'published' });
        const draftCourses = await Course.countDocuments({ status: 'draft' });
        const totalEnrollments = await Course.aggregate([
            { $group: { _id: null, total: { $sum: '$enrollmentCount' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalCourses,
                publishedCourses,
                draftCourses,
                totalEnrollments: totalEnrollments[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

/**
 * Get all published courses (public endpoint)
 */
export const getAllPublishedCourses = async (req, res) => {
    try {
        const courses = await Course.find({ status: 'published' })
            .select('title description difficultyLevel estimatedDuration category price modules enrollmentCount')
            .sort({ createdAt: -1 })
            .exec();

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching published courses',
            error: error.message
        });
    }
};

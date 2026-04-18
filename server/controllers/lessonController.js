import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { validationResult } from 'express-validator';

/**
 * Get all lessons for a course
 */
export const getLessonsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { moduleId } = req.query;

        const query = { courseId };
        if (moduleId) {
            query.moduleId = moduleId;
        }

        const lessons = await Lesson.find(query)
            .sort({ order: 1 })
            .exec();

        res.json({
            success: true,
            data: lessons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lessons',
            error: error.message
        });
    }
};

/**
 * Get single lesson by ID
 */
export const getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            data: lesson
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lesson',
            error: error.message
        });
    }
};

/**
 * Create new lesson
 */
export const createLesson = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { courseId } = req.params;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get the next order number
        const lastLesson = await Lesson.findOne({ courseId, moduleId: req.body.moduleId })
            .sort({ order: -1 })
            .exec();

        const lesson = new Lesson({
            ...req.body,
            courseId,
            order: req.body.order || (lastLesson ? lastLesson.order + 1 : 0)
        });

        await lesson.save();

        // Add lesson to course module
        const module = course.modules.id(req.body.moduleId);
        if (module) {
            module.lessons.push(lesson._id);
            await course.save();
        }

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: lesson
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating lesson',
            error: error.message
        });
    }
};

/**
 * Update lesson
 */
export const updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            message: 'Lesson updated successfully',
            data: lesson
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating lesson',
            error: error.message
        });
    }
};

/**
 * Delete lesson
 */
export const deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndDelete(req.params.id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Remove lesson from course module
        const course = await Course.findById(lesson.courseId);
        if (course) {
            const module = course.modules.id(lesson.moduleId);
            if (module) {
                module.lessons = module.lessons.filter(
                    id => id.toString() !== lesson._id.toString()
                );
                await course.save();
            }
        }

        res.json({
            success: true,
            message: 'Lesson deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting lesson',
            error: error.message
        });
    }
};

/**
 * Reorder lessons
 */
export const reorderLessons = async (req, res) => {
    try {
        const { lessons } = req.body; // Array of { id, order }

        if (!Array.isArray(lessons)) {
            return res.status(400).json({
                success: false,
                message: 'Lessons must be an array'
            });
        }

        // Update all lessons
        const updatePromises = lessons.map(({ id, order }) =>
            Lesson.findByIdAndUpdate(id, { order }, { new: true })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Lessons reordered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reordering lessons',
            error: error.message
        });
    }
};

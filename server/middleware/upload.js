import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to GCP directly)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    // Allowed image types (restricted to .jpg, .jpeg, .png, .svg)
    const imageTypes = /jpeg|jpg|png|svg/;
    // Allowed video types (restricted to .mp4, .webm)
    const videoTypes = /mp4|webm/;

    const extname = path.extname(file.originalname).toLowerCase().slice(1);
    const mimetype = file.mimetype;

    if (file.fieldname === 'image' || file.fieldname === 'thumbnail') {
        if (imageTypes.test(extname) && mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (.jpg, .jpeg, .png, .svg)'), false);
        }
    } else if (file.fieldname === 'video') {
        if (videoTypes.test(extname) && mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed (.mp4, .webm)'), false);
        }
    } else if (file.fieldname === 'pdf' || file.fieldname === 'document') {
        if (extname === 'pdf' && mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf files are allowed!'), false);
        }
    } else if (file.fieldname === 'file') {
        // Generic catch-all for existing functionality (e.g. zip/csv) if needed
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf' || mimetype === 'application/pdf') {
             cb(null, true);
        } else if (ext === '.zip' || mimetype === 'application/zip') {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type for this field!'), false);
        }
    } else {
        cb(null, true);
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size as requested
    }
});

export default upload;

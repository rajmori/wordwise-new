import { bucket } from '../config/gcp.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload file to GCP Storage bucket
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File mimetype
 * @param {string} folder - Folder in bucket (e.g., 'images', 'videos')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export const uploadToGCP = async (fileBuffer, originalName, mimetype, folder = 'uploads') => {
    try {
        if (!bucket) {
            throw new Error('GCP Storage not initialized. Please configure GCP credentials.');
        }

        // Sanitize original filename (remove special chars, keep alphanumeric, dots, dashes, underscores)
        const sanitizedOriginalName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        
        // Generate unique filename within the specified folder
        const ext = path.extname(sanitizedOriginalName);
        const baseName = path.basename(sanitizedOriginalName, ext);
        const filename = `${folder}/${baseName}_${uuidv4().substring(0, 8)}${ext}`;

        // Create a new blob in the bucket
        const blob = bucket.file(filename);

        // Create a write stream
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: mimetype,
                cacheControl: 'public, max-age=31536000',
            }
            // Removed public: true to make it private by default
        });

        return new Promise((resolve, reject) => {
            blobStream.on('error', (error) => {
                reject(new Error(`Upload failed: ${error.message}`));
            });

            blobStream.on('finish', () => {
                // Get public URL
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                resolve(publicUrl);
            });

            blobStream.end(fileBuffer);
        });
    } catch (error) {
        throw new Error(`GCP upload error: ${error.message}`);
    }
};

/**
 * Delete file from GCP Storage bucket
 * @param {string} fileUrl - Public URL of the file
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFromGCP = async (fileUrl) => {
    try {
        if (!bucket) {
            throw new Error('GCP Storage not initialized');
        }

        // Extract filename from URL
        const urlParts = fileUrl.split('/');
        const filename = urlParts.slice(4).join('/'); // Everything after bucket name

        const file = bucket.file(filename);
        await file.delete();

        return true;
    } catch (error) {
        console.error(`GCP delete error: ${error.message}`);
        return false;
    }
};

/**
 * Generate signed URL for private files
 * @param {string} filename - File path in bucket
 * @param {number} expiresIn - Expiration time in minutes
 * @returns {Promise<string>} - Signed URL
 */
export const generateSignedUrl = async (filename, expiresIn = 60) => {
    try {
        if (!bucket) {
            throw new Error('GCP Storage not initialized');
        }

        const file = bucket.file(filename);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresIn * 60 * 1000,
        });

        return url;
    } catch (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
};

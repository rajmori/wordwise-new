import { bucket } from '../config/gcp.js';

/**
 * Generate a short-lived signed URL for downloading a file from GCS
 * @param {string} fileKey - The file path/name inside the bucket
 * @param {number} expiresMinutes - Expiry time in minutes (default: 15)
 * @returns {Promise<string>} - The signed read URL
 */
export async function getDownloadSignedUrl(fileKey, expiresMinutes = 15) {
    if (!bucket) {
        throw new Error('GCP Storage is not initialized');
    }
    
    try {
        const file = bucket.file(fileKey);
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresMinutes * 60 * 1000
        });
        return url;
    } catch (error) {
        console.error('Error generating GCS download signed URL:', error);
        throw new Error('Failed to generate media download URL');
    }
}

/**
 * Generate a short-lived signed URL for uploading a file to GCS
 * @param {string} fileKey - The target file path/name inside the bucket
 * @param {string} contentType - The expected MIME type (e.g. video/mp4, image/png)
 * @param {number} expiresMinutes - Expiry time in minutes (default: 15)
 * @returns {Promise<string>} - The signed write URL
 */
export async function getUploadSignedUrl(fileKey, contentType, expiresMinutes = 15) {
    if (!bucket) {
        throw new Error('GCP Storage is not initialized');
    }
    
    try {
        const file = bucket.file(fileKey);
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + expiresMinutes * 60 * 1000,
            contentType
        });
        return url;
    } catch (error) {
        console.error('Error generating GCS upload signed URL:', error);
        throw new Error('Failed to generate media upload URL');
    }
}

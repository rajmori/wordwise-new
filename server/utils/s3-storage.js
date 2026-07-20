import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, s3BucketName } from '../config/s3.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload file directly to S3 (server-side, from buffer)
 */
export const uploadToS3 = async (fileBuffer, originalName, mimetype, folder = 'uploads') => {
    if (!s3Client) throw new Error('AWS S3 not initialized. Please configure AWS credentials.');

    const sanitized = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    const key = `${folder}/${base}_${uuidv4().substring(0, 8)}${ext}`;

    await s3Client.send(new PutObjectCommand({
        Bucket: s3BucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
        CacheControl: 'public, max-age=31536000',
    }));

    return `https://${s3BucketName}.s3.amazonaws.com/${key}`;
};

/**
 * Delete file from S3 by its public URL
 */
export const deleteFromS3 = async (fileUrl) => {
    try {
        if (!s3Client) throw new Error('AWS S3 not initialized');

        // Extract key from URL: https://<bucket>.s3.amazonaws.com/<key>
        const url = new URL(fileUrl);
        const key = url.pathname.replace(/^\//, '');

        await s3Client.send(new DeleteObjectCommand({ Bucket: s3BucketName, Key: key }));
        return true;
    } catch (error) {
        console.error(`S3 delete error: ${error.message}`);
        return false;
    }
};

/**
 * Generate a presigned GET URL for private/time-limited access
 */
export const generateS3SignedUrl = async (key, expiresIn = 3600) => {
    if (!s3Client) throw new Error('AWS S3 not initialized');

    const command = new GetObjectCommand({ Bucket: s3BucketName, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn });
};

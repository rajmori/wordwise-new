import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, s3BucketName } from '../config/s3.js';

/**
 * Generate a presigned PUT URL so the client uploads directly to S3
 */
export async function getUploadSignedUrl(fileKey, contentType, expiresMinutes = 15) {
    if (!s3Client) throw new Error('AWS S3 is not initialized');

    try {
        const command = new PutObjectCommand({
            Bucket: s3BucketName,
            Key: fileKey,
            ContentType: contentType,
        });
        return getSignedUrl(s3Client, command, { expiresIn: expiresMinutes * 60 });
    } catch (error) {
        console.error('Error generating S3 upload presigned URL:', error);
        throw new Error('Failed to generate media upload URL');
    }
}

/**
 * Generate a presigned GET URL for streaming/downloading from S3
 */
export async function getDownloadSignedUrl(fileKey, expiresMinutes = 15) {
    if (!s3Client) throw new Error('AWS S3 is not initialized');

    try {
        const command = new GetObjectCommand({
            Bucket: s3BucketName,
            Key: fileKey,
        });
        return getSignedUrl(s3Client, command, { expiresIn: expiresMinutes * 60 });
    } catch (error) {
        console.error('Error generating S3 download presigned URL:', error);
        throw new Error('Failed to generate media download URL');
    }
}

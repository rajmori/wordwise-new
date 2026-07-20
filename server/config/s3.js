import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

let s3Client = null;
let s3BucketName = null;

const initS3 = () => {
    try {
        const region = process.env.AWS_REGION;
        const bucket = process.env.AWS_S3_BUCKET_NAME;

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !region || !bucket) {
            console.warn('⚠️  AWS S3 not configured — media uploads will be disabled');
            return;
        }

        s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        s3BucketName = bucket;
        console.log(`✅ AWS S3 initialized: ${bucket} (${region})`);
    } catch (error) {
        console.error(`❌ Error initializing AWS S3: ${error.message}`);
    }
};

export { s3Client, s3BucketName, initS3 };

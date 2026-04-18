import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let storage;
let bucket;

const runTest = async () => {
    try {
        console.log('🔄 Initializing GCP Storage...');

        // Configuration options
        const storageOptions = {};

        // Use key file if provided, otherwise it will try to use ADC (Application Default Credentials)
        // or environment variables like GOOGLE_APPLICATION_CREDENTIALS
        if (process.env.GCP_SERVICE_ACCOUNT_BASE64) {
            const credentials = JSON.parse(
                Buffer.from(process.env.GCP_SERVICE_ACCOUNT_BASE64, 'base64').toString()
            );
            storageOptions.credentials = credentials;
            storageOptions.projectId = process.env.GCP_PROJECT_ID;
            console.log('📋 Using GCP Credentials from GCP_SERVICE_ACCOUNT_BASE64');
        } else if (process.env.GCP_KEY_FILE || process.env.GCP_KEYFILE_PATH) {
            const keyPath = process.env.GCP_KEY_FILE || process.env.GCP_KEYFILE_PATH;
            storageOptions.keyFilename = path.resolve(keyPath);
            console.log(`📁 Using GCP Key File: ${storageOptions.keyFilename}`);
        } else if (process.env.GCP_CREDENTIALS) {
            storageOptions.credentials = JSON.parse(process.env.GCP_CREDENTIALS);
            console.log('📋 Using GCP Credentials from environment variable');
        }

        storage = new Storage(storageOptions);

        const bucketName = process.env.GCP_BUCKET_NAME || 'wordwise-media';
        bucket = storage.bucket(bucketName);

        console.log(`✅ GCP Storage initialized: ${bucketName}`);

        // Test connection
        try {
            const [exists] = await bucket.exists();
            if (exists) {
                console.log(`📡 Connection to bucket "${bucketName}" verified.`);
            } else {
                console.warn(`⚠️ Bucket "${bucketName}" does not exist!`);
            }
        } catch (err) {
            console.error('❌ GCP Connection Test Failed:', err.message);
        }

    } catch (error) {
        console.error('❌ GCP Initialization Error:', error.message);
    }
};

runTest();

export { storage, bucket };

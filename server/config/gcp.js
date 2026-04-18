import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let storage;
let bucket;

const initGCPStorage = () => {
    try {
        // Check if running in production with base64 encoded key
        if (process.env.GCP_SERVICE_ACCOUNT_BASE64) {
            const credentials = JSON.parse(
                Buffer.from(process.env.GCP_SERVICE_ACCOUNT_BASE64, 'base64').toString()
            );

            storage = new Storage({
                projectId: process.env.GCP_PROJECT_ID,
                credentials
            });

            bucket = storage.bucket(process.env.GCP_BUCKET_NAME);
            console.log(`✅ GCP Storage initialized (production): ${process.env.GCP_BUCKET_NAME}`);
        } else if (process.env.GCP_KEYFILE_PATH) {
            // Local development with key file
            storage = new Storage({
                projectId: process.env.GCP_PROJECT_ID,
                keyFilename: path.join(__dirname, '..', process.env.GCP_KEYFILE_PATH || 'gcp-service-account-key.json')
            });

            bucket = storage.bucket(process.env.GCP_BUCKET_NAME);
            console.log(`✅ GCP Storage initialized: ${process.env.GCP_BUCKET_NAME}`);
        } else {
            console.warn('⚠️  GCP Storage not configured - media uploads will be disabled');
        }
    } catch (error) {
        console.error(`❌ Error initializing GCP Storage: ${error.message}`);
        console.log('⚠️  GCP Storage features will be disabled. Please configure GCP credentials.');
    }
};

export { storage, bucket, initGCPStorage };

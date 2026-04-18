// Create GCP Bucket
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

async function createBucket() {
    try {
        console.log('🪣 Creating GCP Bucket...\n');

        const storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
            keyFilename: process.env.GCP_KEYFILE_PATH
        });

        const bucketName = process.env.GCP_BUCKET_NAME || 'wordwise-media';

        console.log('Project ID:', process.env.GCP_PROJECT_ID);
        console.log('Bucket Name:', bucketName);
        console.log('Key File:', process.env.GCP_KEYFILE_PATH);
        console.log('');

        // Check if bucket already exists
        const [buckets] = await storage.getBuckets();
        const existingBucket = buckets.find(b => b.name === bucketName);

        if (existingBucket) {
            console.log('✅ Bucket already exists:', bucketName);
            return;
        }

        // Create the bucket
        console.log('Creating bucket...');
        const [bucket] = await storage.createBucket(bucketName, {
            location: 'US',
            storageClass: 'STANDARD',
            uniformBucketLevelAccess: {
                enabled: true
            }
        });

        console.log('✅ Bucket created successfully!');
        console.log('   Name:', bucket.name);
        console.log('   Location:', bucket.metadata.location);
        console.log('   Storage Class:', bucket.metadata.storageClass);
        console.log('\n🎉 GCP bucket is ready for uploads!');

    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.code === 409) {
            console.log('\n💡 Bucket already exists (owned by another project)');
            console.log('   Try using a different bucket name in .env');
        } else if (error.code === 403) {
            console.log('\n💡 Permission denied');
            console.log('   Make sure your service account has Storage Admin role');
        } else {
            console.log('\n💡 Check:');
            console.log('   - GCP_PROJECT_ID is correct');
            console.log('   - Service account key file exists');
            console.log('   - Billing is enabled on your GCP project');
        }
    }
}

createBucket();

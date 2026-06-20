import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';

dotenv.config();

let client = null;

/**
 * Initialize Secret Manager Client
 */
const initSecretManager = () => {
    if (client) return;
    try {
        if (process.env.GCP_PROJECT_ID) {
            const config = {
                projectId: process.env.GCP_PROJECT_ID
            };
            
            // Local fallback path for keyfile
            if (process.env.GCP_KEYFILE_PATH) {
                config.keyFilename = process.env.GCP_KEYFILE_PATH;
            }
            
            client = new SecretManagerServiceClient(config);
            console.log('✅ Google Secret Manager client initialized');
        } else {
            console.warn('⚠️  GCP_PROJECT_ID not set. Secret Manager will fall back to local .env variables.');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Secret Manager client:', error.message);
    }
};

/**
 * Access a single secret from Secret Manager
 * @param {string} secretName - Name of the secret inside Secret Manager
 * @param {string} version - Specific version (default: 'latest')
 * @returns {Promise<string|null>} - Secret value or null
 */
export async function getSecret(secretName, version = 'latest') {
    initSecretManager();
    
    if (!client) {
        // Fallback to local process.env for local development
        return process.env[secretName] || null;
    }
    
    try {
        const [secretVal] = await client.accessSecretVersion({
            name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/${version}`
        });
        return secretVal.payload.data.toString('utf8');
    } catch (error) {
        // Log warning and fallback to local environment variables
        console.warn(`⚠️  Failed to load secret [${secretName}] from Secret Manager: ${error.message}. Falling back to .env.`);
        return process.env[secretName] || null;
    }
}

/**
 * Load multiple secrets directly into process.env at boot time
 * @param {string[]} secretNames - Array of secret keys (e.g. ['JWT_SECRET', 'RAZORPAY_KEY_SECRET'])
 */
export async function loadSecretsIntoEnv(secretNames) {
    for (const name of secretNames) {
        const val = await getSecret(name);
        if (val) {
            process.env[name] = val;
        }
    }
    console.log('🔒 Environment secrets successfully reconciled.');
}

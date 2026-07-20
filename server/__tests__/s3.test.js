import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── helpers ────────────────────────────────────────────────────────────────

const getClient = () => {
    const region = process.env.AWS_REGION;
    const key    = process.env.AWS_ACCESS_KEY_ID;
    const secret = process.env.AWS_SECRET_ACCESS_KEY;

    if (!key || !secret || !region) {
        throw new Error('AWS credentials not set in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)');
    }

    return new S3Client({
        region,
        credentials: { accessKeyId: key, secretAccessKey: secret },
    });
};

const BUCKET  = process.env.AWS_S3_BUCKET_NAME;
const TEST_KEY = `__tests__/wordwise-connection-test-${Date.now()}.txt`;

// ─── suite ──────────────────────────────────────────────────────────────────

describe('AWS S3 — Connection & Operations', () => {

    let s3;

    beforeAll(() => {
        s3 = getClient();
    });

    // ── 1. env vars ────────────────────────────────────────────────────────
    describe('Environment variables', () => {
        test('AWS_ACCESS_KEY_ID is set', () => {
            expect(process.env.AWS_ACCESS_KEY_ID).toBeDefined();
            expect(process.env.AWS_ACCESS_KEY_ID).not.toBe('your_access_key_here');
        });

        test('AWS_SECRET_ACCESS_KEY is set', () => {
            expect(process.env.AWS_SECRET_ACCESS_KEY).toBeDefined();
            expect(process.env.AWS_SECRET_ACCESS_KEY).not.toBe('your_secret_key_here');
        });

        test('AWS_REGION is set', () => {
            expect(process.env.AWS_REGION).toBeDefined();
            expect(process.env.AWS_REGION.length).toBeGreaterThan(0);
        });

        test('AWS_S3_BUCKET_NAME is set', () => {
            expect(BUCKET).toBeDefined();
            expect(BUCKET).not.toBe('your-bucket-name');
        });
    });

    // ── 2. connectivity ────────────────────────────────────────────────────
    describe('Connectivity', () => {
        test('S3 client initialises without throwing', () => {
            expect(() => getClient()).not.toThrow();
        });

        test('bucket exists and credentials have access', async () => {
            const cmd = new HeadBucketCommand({ Bucket: BUCKET });
            await expect(s3.send(cmd)).resolves.toBeDefined();
        }, 10000);
    });

    // ── 3. upload ──────────────────────────────────────────────────────────
    describe('Upload (PutObject)', () => {
        test('uploads a text file to S3', async () => {
            const cmd = new PutObjectCommand({
                Bucket: BUCKET,
                Key: TEST_KEY,
                Body: 'wordwise s3 connection test',
                ContentType: 'text/plain',
            });
            const res = await s3.send(cmd);
            expect(res.$metadata.httpStatusCode).toBe(200);
        }, 15000);

        test('uploads a simulated video buffer', async () => {
            const videoKey = `__tests__/test-video-${Date.now()}.mp4`;
            const fakeBuffer = Buffer.alloc(1024, 0); // 1 KB fake binary
            const cmd = new PutObjectCommand({
                Bucket: BUCKET,
                Key: videoKey,
                Body: fakeBuffer,
                ContentType: 'video/mp4',
            });
            const res = await s3.send(cmd);
            expect(res.$metadata.httpStatusCode).toBe(200);

            // cleanup
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: videoKey }));
        }, 15000);
    });

    // ── 4. download ────────────────────────────────────────────────────────
    describe('Download (GetObject)', () => {
        test('retrieves the uploaded file and content matches', async () => {
            const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: TEST_KEY });
            const res = await s3.send(cmd);
            expect(res.$metadata.httpStatusCode).toBe(200);

            // Read stream to string
            const chunks = [];
            for await (const chunk of res.Body) chunks.push(chunk);
            const body = Buffer.concat(chunks).toString();
            expect(body).toBe('wordwise s3 connection test');
        }, 15000);
    });

    // ── 5. presigned URLs ──────────────────────────────────────────────────
    describe('Presigned URLs', () => {
        test('generates a presigned PUT URL for video upload', async () => {
            const key = `courses/media/${Date.now()}-sample.mp4`;
            const cmd = new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                ContentType: 'video/mp4',
            });
            const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });

            expect(url).toMatch(/^https:\/\//);
            expect(url).toContain(BUCKET);
            // SDK v3 signs ContentType in headers, not query string — verify key path instead
            expect(url).toContain('courses/media/');
        }, 10000);

        test('generates a presigned GET URL for streaming', async () => {
            const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: TEST_KEY });
            const url = await getSignedUrl(s3, cmd, { expiresIn: 1800 });

            expect(url).toMatch(/^https:\/\//);
            expect(url).toContain(BUCKET);
            expect(url).toContain(TEST_KEY);
        }, 10000);

        test('presigned PUT URL expires within configured window', async () => {
            const cmd = new PutObjectCommand({
                Bucket: BUCKET,
                Key: `__tests__/expiry-test-${Date.now()}.mp4`,
                ContentType: 'video/mp4',
            });
            const url = await getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15 min
            const urlObj = new URL(url);
            const expires = parseInt(urlObj.searchParams.get('X-Amz-Expires') || '0');
            expect(expires).toBe(900);
        }, 10000);
    });

    // ── 6. list ────────────────────────────────────────────────────────────
    describe('List objects', () => {
        test('lists objects under the __tests__ prefix', async () => {
            const cmd = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: '__tests__/' });
            const res = await s3.send(cmd);
            expect(res.$metadata.httpStatusCode).toBe(200);
            expect(Array.isArray(res.Contents ?? [])).toBe(true);
        }, 10000);
    });

    // ── 7. delete ──────────────────────────────────────────────────────────
    describe('Delete (DeleteObject)', () => {
        test('deletes the test file from S3', async () => {
            const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: TEST_KEY });
            const res = await s3.send(cmd);
            expect(res.$metadata.httpStatusCode).toBe(204);
        }, 10000);

        test('file no longer exists after delete', async () => {
            const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: TEST_KEY });
            await expect(s3.send(cmd)).rejects.toThrow();
        }, 10000);
    });

    // ── 8. s3-signed util wrappers ─────────────────────────────────────────
    describe('App utility — s3-signed.js', () => {
        beforeAll(async () => {
            // initS3 must run so s3Client is set in the module
            const { initS3 } = await import('../config/s3.js');
            initS3();
        });

        test('getUploadSignedUrl returns a valid presigned URL', async () => {
            const { getUploadSignedUrl } = await import('../utils/s3-signed.js');
            const url = await getUploadSignedUrl('courses/media/test.mp4', 'video/mp4', 15);
            expect(url).toMatch(/^https:\/\//);
            expect(url).toContain('courses/media/test.mp4');
        }, 10000);

        test('getDownloadSignedUrl returns a valid presigned URL', async () => {
            const { getDownloadSignedUrl } = await import('../utils/s3-signed.js');
            const url = await getDownloadSignedUrl('courses/media/test.mp4', 30);
            expect(url).toMatch(/^https:\/\//);
            expect(url).toContain('courses/media/test.mp4');
        }, 10000);
    });

    // ── 9. s3-storage util wrappers ────────────────────────────────────────
    describe('App utility — s3-storage.js', () => {
        beforeAll(async () => {
            const { initS3 } = await import('../config/s3.js');
            initS3();
        });

        test('uploadToS3 uploads a buffer and returns a public URL', async () => {
            const { uploadToS3 } = await import('../utils/s3-storage.js');
            const buf = Buffer.from('test image data');
            const url = await uploadToS3(buf, 'test-image.png', 'image/png', '__tests__');
            expect(url).toMatch(/^https:\/\//);
            expect(url).toContain(BUCKET);

            // cleanup
            const key = new URL(url).pathname.replace(/^\//, '');
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        }, 15000);

        test('deleteFromS3 removes file by URL and returns true', async () => {
            const { uploadToS3, deleteFromS3 } = await import('../utils/s3-storage.js');
            const url = await uploadToS3(Buffer.from('delete me'), 'del-test.txt', 'text/plain', '__tests__');
            const deleted = await deleteFromS3(url);
            expect(deleted).toBe(true);
        }, 15000);
    });
});

import AdmZip from 'adm-zip';
import csv from 'csv-parser';
import { Readable } from 'stream';
import FlashCard from '../models/FlashCard.js';
import { uploadToS3 } from '../utils/s3-storage.js';

// Helper to parse CSV buffer
const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer.toString());

        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

export const bulkUploadFlashCards = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No ZIP file uploaded'
            });
        }

        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        // Find CSV file
        const csvEntry = zipEntries.find(entry =>
            entry.entryName.toLowerCase().endsWith('.csv') && !entry.isDirectory
        );

        if (!csvEntry) {
            return res.status(400).json({
                success: false,
                message: 'No CSV file found in the ZIP archive'
            });
        }

        // Parse CSV
        const csvData = await parseCSV(csvEntry.getData());

        if (!csvData || csvData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is empty'
            });
        }

        const results = {
            total: csvData.length,
            success: 0,
            failed: 0,
            errors: []
        };

        // Process each row
        for (const [index, row] of csvData.entries()) {
            try {
                // Validate required fields
                if (!row.word1 || !row.word2 || !row.category || !row.imageFilename) {
                    throw new Error('Missing required fields (word1, word2, category, imageFilename)');
                }

                // Find image in ZIP
                const imageEntry = zipEntries.find(entry =>
                    entry.entryName.toLowerCase().endsWith(row.imageFilename.toLowerCase().trim()) ||
                    entry.entryName.toLowerCase().includes('/' + row.imageFilename.toLowerCase().trim())
                );

                if (!imageEntry) {
                    throw new Error(`Image not found in ZIP: ${row.imageFilename}`);
                }

                // Upload Image
                const imageBuffer = imageEntry.getData();
                const mimeType = row.imageFilename.toLowerCase().endsWith('.png') ? 'image/png' :
                    row.imageFilename.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';

                const imageUrl = await uploadToS3(
                    imageBuffer,
                    row.imageFilename,
                    mimeType,
                    'flash-cards'
                );

                // Create Flash Card
                await FlashCard.create({
                    word1: row.word1.trim(),
                    word2: row.word2.trim(),
                    category: row.category.trim(),
                    description: row.description ? row.description.trim() : '',
                    tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
                    imageUrl: imageUrl,
                    isArchived: false
                });

                results.success++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: index + 2, // 1-based + header
                    word: row.word1 || 'Unknown',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Processed ${results.total} items. Success: ${results.success}, Failed: ${results.failed}`,
            results
        });

    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error processing bulk upload',
            error: error.message
        });
    }
};

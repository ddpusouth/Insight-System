const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const axios = require('axios'); // Not strictly needed unless proxying
const DocumentCategory = require('../models/DocumentCategory');
const College = require('../models/College');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/documents';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'DOC-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only PDF files are allowed!'));
    }
});

// --- Categories ---

// GET /api/documents/categories - List all categories with stats
router.get('/categories', async (req, res) => {
    try {
        const categories = await DocumentCategory.find().sort({ createdAt: -1 });
        // Map to include submission count
        const response = categories.map(cat => ({
            ...cat.toObject(),
            submissionCount: cat.submissions ? cat.submissions.length : 0
        }));
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { sendNewDocumentCategoryNotification } = require('../utils/emailService');
const { getCollegeEmail } = require('../utils/collegeHelper');

// POST /api/documents/categories - Create Category (DDPO)
router.post('/categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const newCategory = new DocumentCategory({ name, description, submissions: [] });
        await newCategory.save();
        res.status(201).json(newCategory);

        // Send email notifications to all colleges
        try {
            console.log(`[Documents] Sending new category notification for: ${name}`);
            const colleges = await College.find({}, { Username: 1 });

            // Process emails in background to avoid blocking response
            (async () => {
                for (const college of colleges) {
                    try {
                        const collegeInfo = await getCollegeEmail(college.Username);
                        if (collegeInfo && collegeInfo.email) {
                            await sendNewDocumentCategoryNotification(
                                collegeInfo.email,
                                collegeInfo.collegeName,
                                name
                            );
                            console.log(`[Documents] Notification sent to ${collegeInfo.email}`);
                        } else if (process.env.EMAIL_USER) {
                            // Fallback
                            await sendNewDocumentCategoryNotification(
                                process.env.EMAIL_USER,
                                collegeInfo?.collegeName || college.Username,
                                name
                            );
                        }
                    } catch (err) {
                        console.error(`[Documents] Error sending to ${college.Username}:`, err.message);
                        if (err.message && (err.message.includes('invalid_grant') || err.message.includes('invalid_client'))) {
                            console.error('[Documents] CRITICAL: Email credentials invalid (invalid_grant). Aborting email notifications.');
                            break;
                        }
                    }
                }
            })();

        } catch (emailErr) {
            console.error('[Documents] Error in email notification flow:', emailErr);
        }

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Category already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// GET /api/documents/categories/:categoryId/submissions - Get submissions for category (DDPO)
router.get('/categories/:categoryId/submissions', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await DocumentCategory.findById(categoryId).populate('submissions.collegeId');

        if (!category) return res.status(404).json({ error: 'Category not found' });

        // Return submissions array
        res.json(category.submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/documents/categories/:categoryId/zip - Download all as ZIP
router.get('/categories/:categoryId/zip', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await DocumentCategory.findById(categoryId);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        if (!category.submissions || category.submissions.length === 0) {
            return res.status(404).json({ error: 'No documents found for this category' });
        }

        const zip = new AdmZip();

        category.submissions.forEach(doc => {
            const filePath = path.join(__dirname, '..', '..', doc.fileUrl.startsWith('/') ? doc.fileUrl.substring(1) : doc.fileUrl);
            // NOTE: Adjusted filepath construction. 
            // doc.fileUrl is like "/uploads/documents/DOC-123.pdf" (set in upload route)
            // __dirname is "backend/routes"
            // We need "backend/uploads/documents/..."
            // So join(dirname, '..', '..', 'uploads/documents/...') is correct if we strip leading slash.
            // Wait, standard upload puts it in "uploads/documents" relative to process cwd (backend root).
            // Let's ensure proper path resolution.

            // Standard Multer destination is 'uploads/documents' (relative to where app started, typically backend folder).
            // fileUrl stored as `/uploads/documents/${filename}`

            // If running from backend folder:
            // Absolute path = path.join(process.cwd(), doc.fileUrl);

            const absolutePath = path.join(process.cwd(), doc.fileUrl);

            if (fs.existsSync(absolutePath)) {
                // filename format: CollegeName_Title.pdf or similar
                // We'll use doc.username and fileName
                const entryName = `${doc.username}_${doc.fileName}`;
                zip.addLocalFile(absolutePath, '', entryName);
            }
        });

        const downloadName = `${category.name.replace(/\s+/g, '_')}_Submissions.zip`;
        const data = zip.toBuffer();

        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${downloadName}`);
        res.set('Content-Length', data.length);
        res.send(data);

    } catch (error) {
        console.error('Zip generation error:', error);
        res.status(500).json({ error: error.message });
    }
});


// --- Uploads ---

// POST /api/documents - Upload document (Embed in Category)
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { title, description, username, categoryId } = req.body;
        const file = req.file;

        if (!file || !title || !username || !categoryId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const college = await College.findOne({ Username: username });
        if (!college) {
            return res.status(404).json({ error: 'College not found' });
        }

        const category = await DocumentCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if college already submitted for this category
        const existingSubIndex = category.submissions.findIndex(sub =>
            (sub.collegeId && sub.collegeId.toString() === college._id.toString()) || sub.username === username
        );

        if (existingSubIndex !== -1) {
            const existingSub = category.submissions[existingSubIndex];
            console.log(`Replacing existing document for college ${college.Username} in category ${category.name}`);

            // Delete old file
            // fileUrl is like /uploads/documents/xxxx.pdf
            const oldFilePath = path.join(process.cwd(), existingSub.fileUrl);
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                    console.log('Old file deleted:', oldFilePath);
                } catch (e) {
                    console.error('Error deleting old file:', e);
                }
            }

            // Remove from array (or update in place, but simpler to remove then push or overwrite)
            category.submissions.splice(existingSubIndex, 1);
        }

        // New Submission Object
        const newSubmission = {
            collegeId: college._id,
            username,
            title,
            description,
            fileUrl: `/uploads/documents/${file.filename}`,
            fileName: file.originalname,
            createdAt: new Date()
        };

        category.submissions.push(newSubmission);
        await category.save();

        res.status(201).json(newSubmission);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/documents/:username - Get documents for a college (My Submissions)
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Find all categories that have a submission from this username
        const categories = await DocumentCategory.find({
            'submissions.username': username
        }).select('name submissions');

        // Extract the specific submissions and format them
        const myDocs = categories.map(cat => {
            const sub = cat.submissions.find(s => s.username === username);
            if (!sub) return null;
            return {
                ...sub.toObject(),
                categoryId: { _id: cat._id, name: cat.name }, // Format to match frontend expectation of populated category
            };
        }).filter(Boolean);

        res.json(myDocs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/documents/:id - Delete document (by submission ID) - Optional/Not previously exposed to UI?
router.delete('/:id', async (req, res) => {
    res.status(501).json({ message: 'Not implemented' });
});

module.exports = router;

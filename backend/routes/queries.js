const express = require('express');
const AdmZip = require('adm-zip');
const router = express.Router();
const Query = require('../models/Query');
const Notification = require('../models/Notification');
const College = require('../models/College');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { sendNewQueryNotification, sendNewLinkQueryNotification } = require('../utils/emailService');
const { checkImmediateReminder } = require("../utils/scheduler");


// Import fetch for Node.js (if not available globally)
const fetch = require('node-fetch');

// Helper function to get college email
const { getCollegeEmail } = require('../utils/collegeHelper');

// Get io instance
let io;
const setIO = (socketIO) => {
  io = socketIO;
};
const responseUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/queries/'));
    },
    filename: function (req, file, cb) {
      cb(null, 'response_' + Date.now() + '-' + file.originalname);
    }
  })
});
const GoogleSheetQuery = require('../models/GoogleSheetQuery');
const { types } = require('util');

// Ensure uploads/queries directory exists
const uploadDir = path.join(__dirname, '../uploads/queries');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for dynamic excel file uploads
const excelUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/queries/'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});

// Test route for email testing with actual college email
router.post('/test-email-temp', async (req, res) => {
  try {
    const { collegeUsername, queryType, dueDate, description } = req.body;

    if (!collegeUsername) {
      return res.status(400).json({ error: 'College username is required' });
    }

    // Get college email using the helper function
    const collegeInfo = await getCollegeEmail(collegeUsername);
    if (!collegeInfo) {
      return res.status(404).json({ error: 'College not found' });
    }

    if (collegeInfo.email) {
      // Send to actual college email
      console.log(`[Test Email Temp] Sending test email to: ${collegeInfo.email} for college: ${collegeInfo.collegeName}`);

      await sendNewQueryNotification(
        collegeInfo.email,
        collegeInfo.collegeName,
        queryType || 'Test Query',
        dueDate || new Date(),
        description || 'This is a test email to verify college email functionality'
      );

      res.json({
        message: 'Test email sent successfully to college email',
        college: collegeInfo.collegeName,
        email: collegeInfo.email,
        note: 'Sent to actual college email'
      });
    } else if (process.env.EMAIL_USER) {
      // Fallback to EMAIL_USER if configured
      const testEmail = process.env.EMAIL_USER;

      console.log(`[Test Email Temp] No college email found, sending to EMAIL_USER: ${testEmail} for college: ${collegeInfo.collegeName}`);

      await sendNewQueryNotification(
        testEmail,
        collegeInfo.collegeName,
        queryType || 'Test Query',
        dueDate || new Date(),
        description || 'This is a test email to verify college email functionality'
      );

      res.json({
        message: 'Test email sent successfully to test address',
        college: collegeInfo.collegeName,
        email: testEmail,
        note: 'Sent to test email since college has no email address'
      });
    } else {
      res.status(400).json({ error: 'No email address found for college and no fallback EMAIL_USER configured' });
    }
  } catch (error) {
    console.error('[Test Email Temp] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check college email data
router.get('/college-email/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const collegeData = await College.findOne({ Username: username });

    if (!collegeData) {
      return res.status(404).json({ error: 'College not found' });
    }

    // Also try to get email from dashboard data
    let dashboardEmail = null;
    try {
      const dashboardRes = await fetch(`${process.env.BASE_URL || 'http://localhost:5001'}/api/college-dashboard/${username}`);
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        dashboardEmail = dashboardData?.information?.email;
      }
    } catch (dashboardError) {
      console.log(`[Check College Email] Could not fetch dashboard data for ${username}:`, dashboardError.message);
    }

    res.json({
      username: collegeData.Username,
      collegeName: collegeData['College Name'],
      email: collegeData.Email,
      dashboardEmail: dashboardEmail,
      hasEmail: !!(collegeData.Email || dashboardEmail)
    });
  } catch (error) {
    console.error('[Check College Email] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add/Update college email
router.post('/college-email/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const collegeData = await College.findOne({ Username: username });
    if (!collegeData) {
      return res.status(404).json({ error: 'College not found' });
    }

    // Update the college record with the email
    collegeData.Email = email;
    await collegeData.save();

    res.json({
      message: 'College email updated successfully',
      username: collegeData.Username,
      collegeName: collegeData['College Name'],
      email: email
    });
  } catch (error) {
    console.error('[Update College Email] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email route with actual college data
router.post('/test-email-college', async (req, res) => {
  try {
    const { collegeUsername } = req.body;

    if (!collegeUsername) {
      return res.status(400).json({ error: 'College username is required' });
    }

    // Find the college in the database
    const collegeData = await College.findOne({ Username: collegeUsername });
    if (!collegeData) {
      return res.status(404).json({ error: 'College not found' });
    }

    if (!collegeData.Email) {
      return res.status(400).json({ error: 'College does not have an email address' });
    }

    console.log(`[Test Email] Sending test email to college: ${collegeData['College Name']} (${collegeData.Email})`);

    await sendNewQueryNotification(
      collegeData.Email,
      collegeData['College Name'] || collegeUsername,
      'Test Query',
      new Date(),
      'This is a test email to verify college email functionality'
    );

    res.json({
      message: 'Test email sent successfully to college',
      college: collegeData['College Name'],
      email: collegeData.Email
    });
  } catch (error) {
    console.error('[Test Email College] Error:', error);
    res.status(500).json({ error: error.message });
  }
});
// GET /api/queries/google-sheet-queries/:id - get a single Google Sheet query by ID
router.get('/google-sheet-queries/:id', async (req, res) => {
  try {
    console.log(`[GET /api/queries/google-sheet-queries/:id] Looking for query with ID: ${req.params.id}`);
    const query = await GoogleSheetQuery.findById(req.params.id);
    if (!query) {
      console.log(`[GET /api/queries/google-sheet-queries/:id] Query not found in GoogleSheetQuery model`);
      return res.status(404).json({ error: 'Google Sheet query not found' });
    }

    // Only send root Google Sheet link + metadata
    const queryWithGoogleLink = {
      ...query.toObject(),
      rootLink: {
        googleLink: query.googleLink
      }
    };

    console.log(`[GET /api/queries/google-sheet-queries/:id] Query found:`, queryWithGoogleLink);
    res.json(queryWithGoogleLink);

  } catch (err) {
    console.error(`[GET /api/queries/google-sheet-queries/:id] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries/google-sheet-queries/debug - get all Google Sheet queries without filtering (for debugging)
router.get('/google-sheet-queries/debug', async (req, res) => {
  try {
    console.log(`[GET /api/queries/google-sheet-queries/debug] Debug request received`);

    // Get all queries without any filtering
    const allQueries = await GoogleSheetQuery.find({}).sort({ createdAt: -1 });
    console.log(`[GET /api/queries/google-sheet-queries/debug] All queries found: ${allQueries.length}`);

    // Log details of each query
    allQueries.forEach((query, index) => {
      console.log(`[GET /api/queries/google-sheet-queries/debug] Query ${index + 1}:`, {
        id: query._id,
        type: query.type,
        selectedColleges: query.selectedColleges,
        selectedCollegesType: typeof query.selectedColleges,
        selectedCollegesLength: Array.isArray(query.selectedColleges) ? query.selectedColleges.length : 'not array',
        createdAt: query.createdAt
      });
    });

    res.json({
      totalQueries: allQueries.length,
      queries: allQueries
    });
  } catch (err) {
    console.error(`[GET /api/queries/google-sheet-queries/debug] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries/google-sheet-queries - get all Google Sheet Link queries, or filter by college
router.get('/google-sheet-queries', async (req, res) => {
  try {
    const { college, page = 1, limit = 10 } = req.query;
    console.log(`[GET /api/queries/google-sheet-queries] Received request for college: ${college}`);
    let filter = {};
    if (college) {
      filter = {
        selectedColleges: { $elemMatch: { $eq: college } }
      };
    }
    console.log(`[GET /api/queries/google-sheet-queries] Using filter: ${JSON.stringify(filter)}`);

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await GoogleSheetQuery.countDocuments(filter);
    console.log(`[GET /api/queries/google-sheet-queries] Total documents found: ${total}`);

    // Get paginated results
    let queries = await GoogleSheetQuery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    console.log(`[GET /api/queries/google-sheet-queries] Raw queries found: ${queries.length}`);
    console.log(`[GET /api/queries/google-sheet-queries] Sample query:`, queries[0]);

    // Filter out any queries where selectedColleges is not an array or is empty
    queries = queries.filter(q => Array.isArray(q.selectedColleges) && q.selectedColleges.length > 0);
    console.log(`[GET /api/queries/google-sheet-queries] After filtering: ${queries.length} queries`);

    const response = {
      queries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    };

    console.log(`[GET /api/queries/google-sheet-queries] Sending response with ${queries.length} queries`);
    res.json(response);
  } catch (err) {
    console.error(`[GET /api/queries/google-sheet-queries] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/queries/google-sheet-queries - create a new Google Sheet Link query
router.post('/google-sheet-queries', async (req, res) => {
  try {
    const { type, dueDate, collegeType, selectedColleges, googleLink, description } = req.body;
    console.log(`[POST /api/queries/google-sheet-queries] Received request:`, { type, dueDate, collegeType, selectedColleges, googleLink, description });

    if (!googleLink) return res.status(400).json({ error: 'Google Sheet link is required' });

    // Parse selectedColleges if it's a stringified array
    let colleges = selectedColleges;
    if (typeof colleges === 'string') {
      try {
        colleges = JSON.parse(colleges);
      } catch {
        colleges = [colleges];
      }
    }
    if (!Array.isArray(colleges)) colleges = [colleges];

    console.log(`[POST /api/queries/google-sheet-queries] Processed colleges:`, colleges);

    // Create a single query with all selected colleges
    const query = new GoogleSheetQuery({
      type,
      dueDate,
      collegeType,
      googleLink,
      description,
      selectedColleges: colleges // Assign the whole array
    });

    console.log(`[POST /api/queries/google-sheet-queries] Created query object:`, query);

    await query.save();
    console.log(`[POST /api/queries/google-sheet-queries] Link Query saved successfully with ID:`, query._id);

    for (const college of colleges) {
      const notification = new Notification({
        recipient: college,
        type: 'lquery',
        title: 'New Link Query from DDPO',
        message: `New Link query: ${type}`,
        link: '/query'
      });
      await notification.save();

      if (io) io.emit('ddpo_lquery_message', { message: `New link query: ${type}`, college });
    }
    // Send email notifications to all selected colleges
    for (const college of colleges) {
      try {
        const collegeInfo = await getCollegeEmail(college);
        if (collegeInfo) {
          if (collegeInfo.email) {
            // Send to actual college email
            await sendNewLinkQueryNotification(
              collegeInfo.email,
              collegeInfo.collegeName,
              type,
              dueDate,
              description,
              googleLink
            );
            console.log(`[EmailService] Sent new link query notification to ${collegeInfo.email} for college ${collegeInfo.collegeName}`);
            await checkImmediateReminder(query);

          } else if (process.env.EMAIL_USER) {
            // Fallback to EMAIL_USER if configured
            const testEmail = process.env.EMAIL_USER;
            await sendNewLinkQueryNotification(
              testEmail,
              collegeInfo.collegeName,
              type,
              dueDate,
              description,
              googleLink // <-- make sure to pass the link
            );
            console.log(`[EmailService] No email found for ${college}, sent to test email ${testEmail} for college ${collegeInfo.collegeName}`);

          } else {
            console.warn(`[EmailService] No email found for ${college} and no EMAIL_USER fallback.`);
          }
        }
      } catch (emailError) {
        console.error(`[EmailService] Error sending email to ${college}:`, emailError);
      }
    }

    res.status(201).json(query); // Return the single created query
  } catch (err) {
    console.error(`[POST /api/queries/google-sheet-queries] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries/google-sheet-queries/:id - get a single Google Sheet query by ID
router.get('/google-sheet-queries/:id', async (req, res) => {
  try {
    console.log(`[GET /api/queries/google-sheet-queries/:id] Looking for Google Sheet query with ID: ${req.params.id}`);
    const query = await GoogleSheetQuery.findById(req.params.id);
    if (!query) {
      console.log(`[GET /api/queries/google-sheet-queries/:id] Google Sheet query not found`);
      return res.status(404).json({ error: 'Google Sheet Query not found' });
    }
    console.log(`[GET /api/queries/google-sheet-queries/:id] Google Sheet query found:`, query);
    res.json(query);
  } catch (err) {
    console.error(`[GET /api/queries/google-sheet-queries/:id] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/queries/google-sheet-queries/:id/respond
router.patch('/google-sheet-queries/:id/respond', async (req, res) => {
  try {
    const { college } = req.body;
    const query = await GoogleSheetQuery.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });
    if (!college) return res.status(400).json({ error: 'College username required' });
    // Find or add the response for this college
    let response = query.responses.find(r => r.college === college);
    if (!response) {
      query.responses.push({ college, status: 'Responded', respondedAt: new Date() });
    } else {
      response.status = 'Responded';
      response.respondedAt = new Date();
    }
    await query.save();
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries/:id - get a single query by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`[GET /api/queries/:id] Looking for query with ID: ${req.params.id}`);
    const query = await Query.findById(req.params.id);
    if (!query) {
      console.log(`[GET /api/queries/:id] Query not found in Query model`);
      return res.status(404).json({ error: 'Query not found' });
    }

    // Optional: add info about each response file for easier client use
    const queryWithFileInfo = {
      ...query.toObject(),
      responses: query.responses.map(r => ({
        college: r.college,
        status: r.status,
        respondedAt: r.respondedAt,
        file: r.file,
        fileUrl: r.fileUrl
      })),
      rootFile: {
        file: query.file,
        fileUrl: query.fileUrl
      }
    };

    console.log(`[GET /api/queries/:id] Query found:`, queryWithFileInfo);
    res.json(queryWithFileInfo);

  } catch (err) {
    console.error(`[GET /api/queries/:id] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/queries - create a new query with file upload
router.post('/', excelUpload.single('file'), async (req, res) => {
  try {
    const { title, studentName, category, priority, status, dueDate, type, collegeType, selectedColleges, description } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File is required' });

    // Parse selectedColleges if it's a stringified array
    let colleges = selectedColleges;
    if (typeof colleges === 'string') {
      try { colleges = JSON.parse(colleges); } catch { colleges = [colleges]; }
    }
    if (!Array.isArray(colleges)) colleges = [colleges];

    // Initialize empty file info for each college response
    const responses = colleges.map(college => ({
      college,
      status: 'Pending',
      file: false,
      fileUrl: '',
    }));

    // Create a single query with root file info and empty college responses
    const query = new Query({
      title,
      studentName,
      category,
      priority,
      status,
      dueDate,
      type,
      collegeType,
      selectedColleges: colleges,
      description,
      file: true,                            // Root-level file
      fileUrl: `/uploads/queries/${req.file.filename}`,
      responses,                             // Empty responses for colleges
    });

    await query.save();
    res.status(201).json(query);

    // Notifications and email
    for (const college of colleges) {
      const notification = new Notification({
        recipient: college,
        type: 'query',
        title: 'New Query from DDPO',
        message: `New query: ${type}`,
        link: '/query'
      });
      await notification.save();

      if (io) io.emit('ddpo_query_message', { message: `New query: ${type}`, college });

      try {
        const collegeInfo = await getCollegeEmail(college);
        const targetEmail = collegeInfo?.email || process.env.EMAIL_USER;

        if (targetEmail) {
          await sendNewQueryNotification(
            targetEmail,
            collegeInfo?.collegeName || college,
            type,
            dueDate,
            description
          );
          console.log(`[EmailService] Sent new query notification to ${targetEmail} for college ${college}`);
        } else {
          console.warn(`[EmailService] No email found for ${college} and no EMAIL_USER fallback.`);
        }
      } catch (emailError) {
        console.error(`[EmailService] Error sending email to ${college}:`, emailError);
      }
    }

    await checkImmediateReminder(query);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries - get all queries, or filter by college
router.get('/', async (req, res) => {
  try {
    const { college, page = 1, limit = 10 } = req.query;
    let filter = {};
    if (college) filter = { selectedColleges: { $elemMatch: { $eq: college } } };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const total = await Query.countDocuments(filter);

    let queries = await Query.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    queries = queries.filter(q => Array.isArray(q.selectedColleges) && q.selectedColleges.length > 0);

    res.json({
      queries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const { college } = req.query;

    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });

    let fileUrl = '';

    if (college) {
      // Check if college has uploaded a response file
      const response = query.responses.find(r => r.college === college && r.file);
      if (response && response.fileUrl) {
        fileUrl = response.fileUrl; // serve college file
      } else if (query.file && query.fileUrl) {
        fileUrl = query.fileUrl; // fallback to root file
      } else {
        return res.status(404).json({ error: 'File not found' });
      }
    } else {
      // If no college param, serve root file
      if (query.file && query.fileUrl) {
        fileUrl = query.fileUrl;
      } else {
        return res.status(404).json({ error: 'Root file not found' });
      }
    }

    const filePath = path.join(__dirname, '..', fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    res.download(filePath, path.basename(filePath));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// PATCH /api/queries/:id/respond - college uploads response file
router.patch('/:id/respond', responseUpload.single('file'), async (req, res) => {
  try {
    const { college } = req.body;
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });
    if (!college) return res.status(400).json({ error: 'College username required' });

    let response = query.responses.find(r => r.college === college);

    if (!response) {
      response = {
        college,
        status: 'Responded',
        respondedAt: new Date(),
        file: req.file ? true : false,
        fileUrl: req.file ? `/uploads/queries/${req.file.filename}` : ''
      };
      query.responses.push(response);
    } else {
      response.status = 'Responded';
      response.respondedAt = new Date();
      if (req.file) {
        response.file = true;
        response.fileUrl = `/uploads/queries/${req.file.filename}`;
      }
    }

    await query.save();
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE /api/queries/:id - delete a query and all associated files
router.delete('/:id', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // Delete root-level file if it exists
    if (query.fileUrl) {
      const filePath = path.join(__dirname, '..', query.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[DELETE /api/queries/:id] Deleted root file: ${filePath}`);
      }
    }

    // Delete all response files uploaded by colleges
    if (Array.isArray(query.responses)) {
      query.responses.forEach((response) => {
        if (response.file && response.fileUrl) {
          const responseFilePath = path.join(__dirname, '..', response.fileUrl);
          if (fs.existsSync(responseFilePath)) {
            fs.unlinkSync(responseFilePath);
            console.log(`[DELETE /api/queries/:id] Deleted response file for college ${response.college}: ${responseFilePath}`);
          }
        }
      });
    }

    // Delete the query from database
    await Query.findByIdAndDelete(req.params.id);
    console.log(`[DELETE /api/queries/:id] Deleted query with ID: ${req.params.id}`);

    res.json({ message: 'Query and all associated files deleted successfully' });
  } catch (err) {
    console.error(`[DELETE /api/queries/:id] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});


// DELETE /api/queries/google-sheet-queries/:id - delete a Google Sheet query
router.delete('/google-sheet-queries/:id', async (req, res) => {
  try {
    const query = await GoogleSheetQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Google Sheet Query not found' });
    }

    // Delete the query from database
    await GoogleSheetQuery.findByIdAndDelete(req.params.id);
    console.log(`[DELETE /api/queries/google-sheet-queries/:id] Deleted Google Sheet query with ID: ${req.params.id}`);

    res.json({ message: 'Google Sheet query deleted successfully' });
  } catch (err) {
    console.error(`[DELETE /api/queries/google-sheet-queries/:id] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries/:id/download-zip - download all response files as ZIP
router.get('/:id/download-zip', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });
    const zip = new AdmZip();
    let hasFiles = false;
    if (query.responses && query.responses.length > 0) {
      query.responses.forEach(response => {
        if (response.file && response.fileUrl) {
          const filePath = path.join(__dirname, '..', response.fileUrl);
          if (fs.existsSync(filePath)) {
            const originalName = path.basename(filePath);
            const entryName = `${response.college}_${originalName}`;
            const content = fs.readFileSync(filePath);
            zip.addFile(entryName, content);
            hasFiles = true;
          }
        }
      });
    }
    if (!hasFiles) {
      return res.status(404).json({ error: 'No response files found to zip' });
    }
    const downloadName = `Query_${(query.type || 'Responses').replace(/\s+/g, '_')}_Files.zip`;
    const data = zip.toBuffer();
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${downloadName}`);
    res.set('Content-Length', data.length);
    res.send(data);
  } catch (err) {
    console.error('Zip generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries/all/standard - get all standard queries
router.get('/all/standard', async (req, res) => {
  try {
    const queries = await Query.find({}).sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queries/all/link - get all Google Sheet link queries
router.get('/all/link', async (req, res) => {
  try {
    const queries = await GoogleSheetQuery.find({}).sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, setIO }; 
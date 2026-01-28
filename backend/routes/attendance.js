const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const College = require('../models/College');
const { Parser } = require('json2csv');

// Middleware to check time (9 AM to 9 PM)
const checkTime = (req, res, next) => {
    const now = new Date();

    // Convert current time to IST (UTC+5:30) for accurate check
    // Since server might be in UTC or local time, better to work with consistent time
    // Using Intl.DateTimeFormat to get IST hour
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();

    // 9:00 AM to 9:00 PM (Hour 9 to 21)
    // Inclusive of 9:00:00 AM and up to 20:59:59 PM (before 21:00:00)
    // Strictly close at 21:00:00. So valid hours are 9, 10, ... 20.
    // Hour 21 (9 PM) is too late.
    if (hour < 9 || hour >= 21) {
        return res.status(400).json({ error: 'Attendance can only be marked between 9:00 AM and 9:00 PM IST.' });
    }
    next();
};

// POST /api/attendance/mark - Mark attendance (College only)
// POST /api/attendance/mark - Mark attendance (College only)
router.post('/mark', checkTime, async (req, res) => {
    const { collegeUsername } = req.body;
    if (!collegeUsername) return res.status(400).json({ error: 'College username is required' });

    try {
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const year = istTime.getFullYear();
        const month = String(istTime.getMonth() + 1).padStart(2, '0');
        const day = String(istTime.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        const college = await College.findOne({ Username: collegeUsername });
        if (!college) return res.status(404).json({ error: 'College not found' });

        // Atomic update: Push if not exists
        const updated = await Attendance.findOneAndUpdate(
            { date: today, "records.collegeUsername": { $ne: collegeUsername } },
            {
                $push: {
                    records: {
                        collegeId: college._id,
                        collegeUsername: collegeUsername,
                        status: 'Present',
                        timestamp: new Date()
                    }
                }
            },
            { new: true, upsert: true } // Create daily doc if missing
        );

        if (!updated) {
            // Document existed but update failed -> Likely already present
            // We check if it was just because of the $ne condition
            const existing = await Attendance.findOne({ date: today, "records.collegeUsername": collegeUsername });
            if (existing) {
                return res.status(400).json({ error: 'Attendance already marked for today.' });
            }
        }

        res.status(201).json({ message: 'Attendance marked successfully' });
    } catch (err) {
        // Handle duplicate key error (race condition on creation)
        if (err.code === 11000) {
            // Retry once or handle gracefully
            return res.status(400).json({ error: 'Concurrency conflict, please try again.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance/status/:username - Check today's status
router.get('/status/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const year = istTime.getFullYear();
        const month = String(istTime.getMonth() + 1).padStart(2, '0');
        const day = String(istTime.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        const doc = await Attendance.findOne({ date: today, "records.collegeUsername": username });
        const record = doc ? doc.records.find(r => r.collegeUsername === username) : null;

        res.json({ marked: !!record, attendance: record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance/report - Get report for DDPO
router.get('/report', async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        let targetDate = date;
        if (!targetDate) {
            const now = new Date();
            const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const year = istTime.getFullYear();
            const month = String(istTime.getMonth() + 1).padStart(2, '0');
            const day = String(istTime.getDate()).padStart(2, '0');
            targetDate = `${year}-${month}-${day}`;
        }

        const allColleges = await College.find({}, { Username: 1, "College Name": 1, "College Code": 1 });
        const attendanceDoc = await Attendance.findOne({ date: targetDate });
        const records = attendanceDoc ? attendanceDoc.records : [];

        const report = allColleges.map(col => {
            const record = records.find(r => r.collegeUsername === col.Username);
            return {
                username: col.Username,
                collegeName: col['College Name'],
                collegeCode: col['College Code'],
                status: record ? 'Present' : 'Absent',
                markedAt: record ? record.timestamp : null
            };
        });

        const total = allColleges.length;
        const present = records.length;
        const absent = total - present;

        res.json({ date: targetDate, stats: { total, present, absent }, report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance/export - Download CSV
router.get('/export', async (req, res) => {
    try {
        const { date } = req.query;
        let targetDate = date;
        if (!targetDate) {
            const now = new Date();
            const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const year = istTime.getFullYear();
            const month = String(istTime.getMonth() + 1).padStart(2, '0');
            const day = String(istTime.getDate()).padStart(2, '0');
            targetDate = `${year}-${month}-${day}`;
        }

        const allColleges = await College.find({}, { Username: 1, "College Name": 1, "College Code": 1 });
        const attendanceDoc = await Attendance.findOne({ date: targetDate });
        const records = attendanceDoc ? attendanceDoc.records : [];

        const report = allColleges.map(col => {
            const record = records.find(r => r.collegeUsername === col.Username);
            return {
                'College Name': col['College Name'],
                'College Code': col['College Code'],
                'Username': col.Username,
                'Date': targetDate,
                'Status': record ? 'Present' : 'Absent',
                'Marked At': record ? new Date(record.timestamp).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) : '-'
            };
        });

        const fields = ['College Name', 'College Code', 'Username', 'Date', 'Status', 'Marked At'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(report);

        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance-report-${targetDate}.csv`);
        res.send(csv);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

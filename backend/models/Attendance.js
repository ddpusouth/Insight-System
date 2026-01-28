const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        unique: true
    },
    records: [{
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'College'
        },
        collegeUsername: String,
        status: {
            type: String,
            default: 'Present'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('Attendance', attendanceSchema);

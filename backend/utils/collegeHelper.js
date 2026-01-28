const College = require('../models/College');
const fetch = require('node-fetch');

// Helper function to get college email
async function getCollegeEmail(collegeUsername) {
    try {
        const collegeData = await College.findOne({ Username: collegeUsername });
        if (!collegeData) return null;

        // First try to get email from college record
        let collegeEmail = collegeData['Email'];

        // If no email in college record, try to get from dashboard data
        if (!collegeEmail) {
            try {
                const dashboardRes = await fetch(`${process.env.BASE_URL || 'http://localhost:5001'}/api/college-dashboard/${collegeUsername}`);
                if (dashboardRes.ok) {
                    const dashboardData = await dashboardRes.json();
                    collegeEmail = dashboardData?.information?.email;
                }
            } catch (dashboardError) {
                console.log(`[EmailService] Could not fetch dashboard data for ${collegeUsername}:`, dashboardError.message);
            }
        }

        return {
            email: collegeEmail,
            collegeName: collegeData['College Name'] || collegeUsername
        };
    } catch (error) {
        console.error(`[EmailService] Error getting college email for ${collegeUsername}:`, error);
        return null;
    }
}

module.exports = { getCollegeEmail };

const { google } = require('googleapis');

// Gmail API Configuration
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Helper to encode email string to base64url
const makeBody = (to, from, subject, message) => {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    message
  ].join('\n');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Email templates
const emailTemplates = {
  newQuery: (collegeName, queryType, dueDate, description) => ({
    subject: `New Query from DDPU - ${queryType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Query Notification</h2>
        <p>Dear ${collegeName},</p>
        <p>You have received a new query from Deputy Director Office Pre-University (DDPU South).</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Query Details:</h3>
          <p><strong>Query Type:</strong> ${queryType}</p>
          <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'Not specified'}</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
        </div>
        
        <p>Please log in to your dashboard to view the complete details and submit your response.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the Insight System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),
  newLinkQuery: (collegeName, queryType, dueDate, description, googleLink) => ({
    subject: `New Link Query from DDPU - ${queryType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Link Query Notification</h2>
        <p>Dear ${collegeName},</p>
        <p>You have received a new <strong>link query</strong> from Deputy Director Office Pre-University (DDPU South).</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Query Details:</h3>
          <p><strong>Query Type:</strong> ${queryType}</p>
          <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'Not specified'}</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
        </div>
        
        <p>Please log in to your dashboard to view the complete details and submit your response.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the Insight System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  dueDateReminder: (collegeName, queryType, dueDate, description) => ({
    subject: `Reminder: Query Due - ${queryType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b91c1c;">Query Due Alert</h2>
        <p>Dear ${collegeName},</p>
        <p>This is a reminder that your <strong>query</strong> would be <strong>due</strong> shortly.</p>
        
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #991b1b;">Query Details:</h3>
          <p><strong>Query Type:</strong> ${queryType}</p>
          <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
        </div>
        
        <p style="color: #dc6c26; font-weight: bold;">Please submit your response before the due date to avoid any delays.</p>
        
        <p>Log in to your dashboard to submit your response.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated reminder from the Insight System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),
  dueDateReminderLinkQuery: (collegeName, queryType, dueDate, description, googleLink) => ({
    subject: `Reminder: Link Query Due- ${queryType}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #b91c1c;">Link Query Due Alert</h2>
      <p>Dear ${collegeName},</p>
      <p>This is a reminder that your <strong>link query</strong> would be <strong>due</strong> shortly.</p>

      <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Query Details:</h3>
        <p><strong>Query Type:</strong> ${queryType}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
      </div>

      <p style="color: #dc6c26; font-weight: bold;">Please submit your response before the due date to avoid any delays.</p>
      <p>Log in to your dashboard to submit your response.</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated reminder from the Insight System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `
  }),

  dueDateWarning: (collegeName, queryType, dueDate, description) => ({
    subject: `Overdue: Query Not Responded - ${queryType}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Query Response Overdue</h2>
      <p>Dear ${collegeName},</p>
      <p>You have a query that is <strong>past its due date</strong> and has not yet been responded to.</p>

      <div style="background-color: #fcdede; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b91c1c;">
        <h3 style="margin-top: 0; color: #7f1d1d;">Query Details:</h3>
        <p><strong>Query Type:</strong> ${queryType}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
      </div>

      <p style="color: #dc2626; font-weight: bold;">Immediate action required. Please respond at the earliest.</p>

      <p>Log in to your dashboard to submit your response.</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated warning from the Insight System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `
  }),

  dueDateWarningLinkQuery: (collegeName, queryType, dueDate, description, googleLink) => ({
    subject: `Overdue: Link Query Not Responded - ${queryType}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Link Query Response Overdue</h2>
      <p>Dear ${collegeName},</p>
      <p>Your <strong>link query</strong> is past its due date and has not yet been responded to.</p>

      <div style="background-color: #fcdede; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Query Details:</h3>
        <p><strong>Query Type:</strong> ${queryType}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
       
      </div>

      <p style="color: #dc2626; font-weight: bold;">Immediate action required. Please respond at the earliest.</p>
      <p>Log in to your dashboard to submit your response.</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated warning from the Insight System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `
  }),

  newDocumentCategory: (collegeName, categoryName) => ({
    subject: `New Document Request from DDPU - ${categoryName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Document Compliance Request</h2>
        <p>Dear ${collegeName},</p>
        <p>Deputy Director Office Pre-University (DDPU South) has requested new documents.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #166534;">Document Details:</h3>
          <p><strong>Request:</strong> ${categoryName}</p>
          <p>Please upload the required documents in the specified category.</p>
        </div>
        
        <p>Log in to your dashboard, go to <strong>Documents</strong>, and upload the requested files.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the Insight System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  newCircular: (collegeName, title, sender) => ({
    subject: `New Circular from DDPU - ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7e22ce;">New Circular Notification</h2>
        <p>Dear ${collegeName},</p>
        <p>A new circular has been released by <strong>${sender || 'DDPU South'}</strong>.</p>
        
        <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea;">
          <h3 style="margin-top: 0; color: #6b21a8;">Circular Details:</h3>
          <p><strong>Title:</strong> ${title}</p>
        </div>
        
        <p>Log in to your dashboard to view and download the circular.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the Insight System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  documentReminder: (collegeName, categoryName) => ({
    subject: `Reminder: Pending Document Submission - ${categoryName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c2410c;">Document Submission Reminder</h2>
        <p>Dear ${collegeName},</p>
        <p>This is a reminder that you have <strong>not yet submitted</strong> the required documents for the following category:</p>
        
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
          <h3 style="margin-top: 0; color: #9a3412;">Category Details:</h3>
          <p><strong>Category:</strong> ${categoryName}</p>
        </div>
        
        <p style="color: #ea580c; font-weight: bold;">Please log in to your dashboard and upload the required documents as soon as possible.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated daily reminder from the Insight System.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  })
};

// Generic send function using Gmail API directly
const sendEmail = async (to, template, data) => {
  try {
    console.log(`[EmailService] Attempting to send email to ${to}`);

    const emailContent = emailTemplates[template](...data);
    const raw = makeBody(to, process.env.EMAIL_USER, emailContent.subject, emailContent.html);

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw
      }
    });

    console.log(`[EmailService] Email sent successfully to ${to}:`, result.data.id);
    return result;
  } catch (error) {
    console.error(`[EmailService] Error sending email to ${to}:`, error);
    throw error;
  }
};

// Specific wrappers
const sendNewQueryNotification = async (collegeEmail, collegeName, queryType, dueDate, description) => {
  return await sendEmail(collegeEmail, 'newQuery', [collegeName, queryType, dueDate, description]);
};

const sendDueDateReminder = async (collegeEmail, collegeName, queryType, dueDate, description) => {
  return await sendEmail(collegeEmail, 'dueDateReminder', [collegeName, queryType, dueDate, description]);
};

const sendDueDateWarning = async (collegeEmail, collegeName, queryType, dueDate, description) => {
  return await sendEmail(collegeEmail, 'dueDateWarning', [collegeName, queryType, dueDate, description]);
};
const sendNewLinkQueryNotification = async (collegeEmail, collegeName, queryType, dueDate, description, googleLink) => {
  return await sendEmail(collegeEmail, 'newLinkQuery', [collegeName, queryType, dueDate, description, googleLink]);
};

const sendDueDateReminderLinkQuery = async (collegeEmail, collegeName, queryType, dueDate, description, googleLink) => {
  return await sendEmail(collegeEmail, 'dueDateReminderLinkQuery', [collegeName, queryType, dueDate, description, googleLink]);
};
const sendDueDateWarningLinkQuery = async (collegeEmail, collegeName, queryType, dueDate, description, googleLink) => {
  return await sendEmail(collegeEmail, 'dueDateWarningLinkQuery', [collegeName, queryType, dueDate, description, googleLink]);
};

const sendNewDocumentCategoryNotification = async (collegeEmail, collegeName, categoryName) => {
  return await sendEmail(collegeEmail, 'newDocumentCategory', [collegeName, categoryName]);
};

const sendNewCircularNotification = async (collegeEmail, collegeName, title, sender) => {
  return await sendEmail(collegeEmail, 'newCircular', [collegeName, title, sender]);
};

const sendDocumentReminder = async (collegeEmail, collegeName, categoryName) => {
  return await sendEmail(collegeEmail, 'documentReminder', [collegeName, categoryName]);
};

const testEmailConfig = async () => {
  try {
    console.log(`[EmailService] Testing email configuration (Gmail API)...`);
    console.log(`[EmailService] EMAIL_USER: ${process.env.EMAIL_USER}`);

    // Try to get profile to test auth
    await gmail.users.getProfile({ userId: 'me' });

    console.log(`[EmailService] Email configuration is valid (Gmail API Auth Successful)`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Email configuration error:`, error);
    return false;
  }
};

module.exports = {
  testEmailConfig,
  sendEmail,
  sendNewQueryNotification,
  sendDueDateReminder,
  sendDueDateWarning,
  sendNewLinkQueryNotification,
  sendDueDateReminderLinkQuery,
  sendDueDateWarningLinkQuery,
  sendNewDocumentCategoryNotification,
  sendNewCircularNotification,
  sendDocumentReminder
};

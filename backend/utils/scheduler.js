const cron = require("node-cron");
const { utcToZonedTime } = require("date-fns-tz");
const { startOfDay, endOfDay, addDays } = require("date-fns");

const Query = require("../models/Query");
const GoogleSheetQuery = require("../models/GoogleSheetQuery");
const CollegeDashboard = require("../models/CollegeDashboard");
const College = require("../models/College");
const DocumentCategory = require("../models/DocumentCategory");
const { sendDueDateReminder, sendDueDateWarning, sendDueDateReminderLinkQuery, sendDueDateWarningLinkQuery, sendDocumentReminder } = require("./emailService");

const TIMEZONE = "Asia/Kolkata";

// =========================
// Helper: get college name safely
// =========================
const getCollegeNameField = (college) => {
  return college["College Name"] || college["college name"] || college.collegeName || college.name || null;
};

// =========================
// Send email helper (updated)
// =========================
const sendMail = async (query, fn, isLink = false) => {
  const dueDate = new Date(query.dueDate);

  const [dashboards, colleges] = await Promise.all([
    CollegeDashboard.find({}),
    College.find({})
  ]);

  const collegeMap = new Map();
  dashboards.forEach(d => {
    if (d.username) collegeMap.set(d.username.toLowerCase(), d.information);
  });

  const collegeNameMap = new Map();
  colleges.forEach(c => {
    const name = getCollegeNameField(c);
    if (name && (c.Username || c.username)) {
      collegeNameMap.set((c.Username || c.username).toLowerCase(), name);
    }
  });

  for (const collegeUsername of query.selectedColleges || []) {
    const usernameKey = collegeUsername.toLowerCase();

    const hasResponded = query.responses?.some(
      r => (r.college?.toLowerCase() === usernameKey || r.username?.toLowerCase() === usernameKey) && r.status?.toLowerCase() === "responded"
    );
    if (hasResponded) continue;

    const collegeInfo = collegeMap.get(usernameKey);
    const collegeName = collegeNameMap.get(usernameKey) || collegeUsername;

    try {
      if (!collegeInfo?.email) {
        console.log(`[Scheduler] No email found for ${collegeUsername}, skipping notification.`);
        continue;
      }

      if (isLink) {
        await fn(
          collegeInfo.email,
          collegeName,
          query.type || "Link Query",
          dueDate,
          query.description,
          query.googleLink
        );
      } else {
        await fn(
          collegeInfo.email,
          collegeName,
          query.type || "Query",
          dueDate,
          query.description
        );
      }

      console.log(`[Scheduler] Sent ${fn.name}${isLink ? " (link query)" : ""} to ${collegeInfo.email} (${collegeName}) for query ${query._id}`);
    } catch (error) {
      console.error(`[Scheduler] Error sending ${fn.name} to ${collegeInfo?.email}:`, error.message);
      if (error.message && (error.message.includes('invalid_grant') || error.message.includes('invalid_client'))) {
        console.error('[Scheduler] CRITICAL: Email credentials invalid (invalid_grant). Aborting notifications.');
        throw error;
      }
    }
  }
};

// =========================
// Document Reminder Job
// =========================
const checkDocumentReminders = async () => {
  try {
    console.log("[Scheduler] Checking for document reminders...");

    // Fetch all categories and colleges
    const [categories, colleges, dashboards] = await Promise.all([
      DocumentCategory.find({}),
      College.find({}),
      CollegeDashboard.find({})
    ]);

    // Create maps for efficient lookup
    const dashboardMap = new Map();
    dashboards.forEach(d => {
      if (d.username) dashboardMap.set(d.username.toLowerCase(), d.information);
    });

    // Iterate through all categories
    for (const category of categories) {
      // For each category, checking which colleges have NOT submitted
      for (const college of colleges) {
        const username = college.Username || college.username;
        if (!username) continue;

        const usernameLower = username.toLowerCase();

        // precise check for submission
        const hasSubmitted = category.submissions.some(sub =>
          (sub.username && sub.username.toLowerCase() === usernameLower) ||
          (sub.collegeId && sub.collegeId.toString() === college._id.toString())
        );

        if (!hasSubmitted) {
          // Send reminder
          let email = college.Email;
          const collegeName = college["College Name"] || college.collegeName || username;

          // Fallback to dashboard email if not in college record
          if (!email) {
            const dashInfo = dashboardMap.get(usernameLower);
            email = dashInfo?.email;
          }

          if (email) {
            try {
              await sendDocumentReminder(email, collegeName, category.name);
              console.log(`[Scheduler] Sent document reminder for '${category.name}' to ${email} (${username})`);
            } catch (err) {
              console.error(`[Scheduler] Failed to send document reminder to ${username}:`, err.message);
              if (err.message && (err.message.includes('invalid_grant') || err.message.includes('invalid_client'))) {
                console.error('[Scheduler] CRITICAL: Email credentials invalid (invalid_grant). Aborting document reminders.');
                return;
              }
            }
          }
        }
      }
    }
    console.log("[Scheduler] Document reminders check completed");
  } catch (error) {
    console.error("[Scheduler] Error in document reminders:", error);
  }
};

// =========================
// Main notification job
// =========================
const sendDueDateNotifications = async () => {
  try {
    console.log("[Scheduler] Checking for reminders/warnings...");
    const now = utcToZonedTime(new Date(), TIMEZONE);

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));

    const [reminderQueries, reminderLinkQueries, warningQueries, warningLinkQueries, todayQueries, todayLinkQueries] = await Promise.all([
      Query.find({ dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd }, status: { $ne: "responded" } }),
      GoogleSheetQuery.find({ dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd }, status: { $ne: "responded" } }),
      Query.find({ dueDate: { $lt: todayStart }, status: { $ne: "responded" } }),
      GoogleSheetQuery.find({ dueDate: { $lt: todayStart }, status: { $ne: "responded" } }),
      Query.find({ dueDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "responded" } }),
      GoogleSheetQuery.find({ dueDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "responded" } })
    ]);

    console.log(`[Scheduler] Found ${reminderQueries.length + reminderLinkQueries.length} reminders, ${todayQueries.length + todayLinkQueries.length} due-today, ${warningQueries.length + warningLinkQueries.length} warnings`);

    for (const q of reminderQueries) await sendMail(q, sendDueDateReminder);
    for (const q of reminderLinkQueries) await sendMail(q, sendDueDateReminderLinkQuery, true);

    for (const q of todayQueries) await sendMail(q, sendDueDateReminder);
    for (const q of todayLinkQueries) await sendMail(q, sendDueDateReminderLinkQuery, true);

    for (const q of warningQueries) await sendMail(q, sendDueDateWarning);
    for (const q of warningLinkQueries) await sendMail(q, sendDueDateWarningLinkQuery, true);

    console.log("[Scheduler] Reminder/Warning check completed");

    // Run Document Reminders
    await checkDocumentReminders();

  } catch (error) {
    console.error("[Scheduler] Error in notifications:", error);
  }
};

// =========================
// Immediate reminder for queries due tomorrow
// =========================
const checkImmediateReminder = async (query) => {
  const now = utcToZonedTime(new Date(), TIMEZONE);

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));
  const dueDate = new Date(query.dueDate);

  const isLink = Boolean(query.googleLink);

  // Case 1: Due date is today → send reminder immediately (since no "yesterday" to catch it)
  if (dueDate >= todayStart && dueDate <= todayEnd) {
    await sendMail(query, isLink ? sendDueDateReminderLinkQuery : sendDueDateReminder, isLink);
    console.log(`[Immediate Reminder] Sent immediate "due today" reminder for ${query._id}`);
    return;
  }

  // Case 2: Due date is tomorrow → send reminder only if current time >= 9 AM
  const today9am = new Date(now);
  today9am.setHours(9, 0, 0, 0);

  if (dueDate >= tomorrowStart && dueDate <= tomorrowEnd && now >= today9am) {
    await sendMail(query, isLink ? sendDueDateReminderLinkQuery : sendDueDateReminder, isLink);
    console.log(`[Immediate Reminder] Sent "due tomorrow" reminder for ${query._id}`);
  } else {
    console.log(`[Immediate Reminder] Skipped for query ${query._id} (due=${dueDate}, now=${now})`);
  }
};


// Start scheduler
const startScheduler = () => {
  console.log("[Scheduler] Starting email scheduler...");

  const now = utcToZonedTime(new Date(), TIMEZONE);
  const today9am = new Date(now);
  today9am.setHours(9, 0, 0, 0);

  if (now > today9am) {
    console.log("[Scheduler] Missed 9 AM run → Sending notifications now...");
    sendDueDateNotifications();
  }

  cron.schedule("0 9 * * *", sendDueDateNotifications, {
    scheduled: true,
    timezone: TIMEZONE
  });

  console.log("[Scheduler] Email scheduler started - runs daily at 9:00 AM IST");
};

module.exports = { startScheduler, checkImmediateReminder };

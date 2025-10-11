// cronJobs/overdueJob.js
import cron from 'node-cron';
import Report from '../models/report.model.js';
import User from '../models/user.model.js';
import nodemailer from 'nodemailer';
import { APP_PASS } from '../config/env.js'; // ensure this exists in your env

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'patidardeepanshu910@gmail.com',
    pass: APP_PASS,
  },
});

export const initOverdueJob = (io) => {
  console.log('🕒 initOverdueJob started');

  const checkAndProcess = async () => {
    try {
      const now = new Date();
      const overdueReports = await Report.find({
        deadline: { $lt: now },
        status: { $ne: 'Resolved' },
        isOverdue: false,
      });

      if (!overdueReports || overdueReports.length === 0) {
        // No new overdue reports
        return;
      }

      const admins = await User.find({ role: 'admin' });
      const adminIds = admins.map((admin) => admin._id.toString());

      for (const report of overdueReports) {
        try {
          report.isOverdue = true;
          await report.save();

          const payload = {
            id: report._id,
            title: report.title,
            severity: report.severity,
            deadline: report.deadline,
            isOverdue: true,
          };

          // Emit only to assignedBy (if present)
          const assignedById = report.assignedBy && report.assignedBy._id
            ? report.assignedBy._id.toString()
            : null;
          if (assignedById) {
            io.to(assignedById).emit('reportOverdue', payload);
            const admin = await User.findById(assignedById);
            admin.notifications.push({
              id: report._id,
              message: `Report #${report._id.toString().substring(0, 8)} is now OVERDUE!`,
              time: new Date(),
              read: false,
            });
            await admin.save();
            console.log(`Emitted reportOverdue to assignedBy ${assignedById}`);
          }

          // Emit only to assignedTo (if present)
          const assignedToId = report.assignedTo && report.assignedTo._id
            ? report.assignedTo._id.toString()
            : null;
          if (assignedToId) {
            io.to(assignedToId).emit('reportOverdue', payload);
            const staff = await User.findById(assignedToId);
            staff.notifications.push({
              id: report._id,
              message: `Report #${report._id.toString().substring(0, 8)} is now OVERDUE!`,
              time: new Date(),
              read: false,
            });
            await staff.save();
            console.log(`Emitted reportOverdue to assignedTo ${assignedToId}`);
          }

            // Emit to all admins
            adminIds.forEach(async (adminId) => {
                if (adminId === assignedById) return;
                io.to(adminId).emit('reportOverdue', payload);
                const admin = await User.findById(adminId);
                admin.notifications.push({
                    id: report._id,
                    message: `Report #${report._id.toString().substring(0, 8)} is now OVERDUE!`,
                    time: new Date(),
                    read: false,
                });
                await admin.save();
                console.log(`Emitted reportOverdue to admin ${adminId}`);
            });

          // Log the action
          console.log(`Report ${report._id} marked as overdue and notifications sent.`);

          // Optionally email assigned users (escalation)
          // Try assignedBy email first, fallback to nested email in report
          const assignedByEmail =
            report.assignedBy && report.assignedBy._id && report.assignedBy._id.email
              ? report.assignedBy._id.email
              : report.assignedBy && report.assignedBy.email
                ? report.assignedBy.email
                : null;

          const assignedToEmail =
            report.assignedTo && report.assignedTo._id && report.assignedTo._id.email
              ? report.assignedTo._id.email
              : report.assignedTo && report.assignedTo.email
                ? report.assignedTo.email
                : null;

          const recipients = [];
          if (assignedByEmail) {
            recipients.push(assignedByEmail);
          }
          if (assignedToEmail && assignedToEmail !== assignedByEmail) recipients.push(assignedToEmail);

          if (recipients.length > 0) {
            await transporter.sendMail({
              from: 'patidardeepanshu910@gmail.com',
              to: recipients.join(','),
              subject: `🚨 Overdue Report: ${report.title}`,
              text: `The report "${report.title}" (id: ${report._id}) has passed its deadline (${report.deadline}) and is now marked as overdue. Please take action.`,
            });
            console.log('Escalation email sent to:', recipients);
          }
        } catch (innerErr) {
          console.error('Error processing a specific overdue report:', innerErr);
        }
      }
    } catch (err) {
      console.error('Error in overdue job:', err);
    }
  };

  // Run the check once at startup
  checkAndProcess();

  // Then schedule to run every 5 minutes (adjust interval as needed)
  cron.schedule('*/2 * * * *', () => {
    console.log('⏰ Running scheduled overdue check');
    checkAndProcess();
  });
};

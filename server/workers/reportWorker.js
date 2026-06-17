import { Worker } from 'bullmq';
import { connection } from '../config/queue.js';
import Report from '../models/report.model.js';
import User from '../models/user.model.js';
import nodemailer from 'nodemailer';
import { APP_PASS } from '../config/env.js';

export const initReportWorker = (io) => {
  console.log('👷 Report worker initialization started');

  const worker = new Worker(
    'reportQueue',
    async (job) => {
      const { reportId } = job.data;
      console.log(`📦 Processing overdue check for report: ${reportId}`);

      try {
        const report = await Report.findById(reportId);
        if (!report) {
          console.log(`⚠️ Report ${reportId} not found in DB.`);
          return;
        }

        // Only process if status is not Resolved and not already overdue
        if (report.status === 'Resolved' || report.isOverdue) {
          console.log(`ℹ️ Report ${reportId} status is "${report.status}" or is already overdue. Skipping.`);
          return;
        }

        // 1. Mark report as overdue in MongoDB
        report.isOverdue = true;
        await report.save();

        // 2. Create notification for report creator (createdBy) and other involved parties
        const notificationMessage = `Report #${report._id.toString().substring(0, 8)} is now OVERDUE!`;
        
        // Push notification to creator
        const creator = await User.findById(report.createdBy);
        if (creator) {
          creator.notifications.push({
            reportId: report._id,
            message: notificationMessage,
          });
          await creator.save();
          console.log(`🔔 Notification saved for creator: ${creator._id}`);
        }

        // Push notification to assigned staff (assignedTo)
        if (report.assignedTo?._id) {
          const staff = await User.findById(report.assignedTo._id);
          if (staff) {
            staff.notifications.push({
              reportId: report._id,
              message: notificationMessage,
            });
            await staff.save();
            console.log(`🔔 Notification saved for assignedTo staff: ${staff._id}`);
          }
        }

        // Push notification to assigning admin (assignedBy)
        if (report.assignedBy?._id && report.assignedBy._id.toString() !== report.createdBy.toString()) {
          const assigner = await User.findById(report.assignedBy._id);
          if (assigner) {
            assigner.notifications.push({
              reportId: report._id,
              message: notificationMessage,
            });
            await assigner.save();
            console.log(`🔔 Notification saved for assignedBy admin: ${assigner._id}`);
          }
        }

        // Push notification to all other admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          const adminIdStr = admin._id.toString();
          if (
            adminIdStr !== report.createdBy.toString() &&
            adminIdStr !== report.assignedBy?._id?.toString()
          ) {
            admin.notifications.push({
              reportId: report._id,
              message: notificationMessage,
            });
            await admin.save();
            console.log(`🔔 Notification saved for admin: ${adminIdStr}`);
          }
        }


        // 3. Find recipients for email notification (assignedTo and assignedBy)
        const recipients = [];
        const assignedToEmail = report.assignedTo?.email;
        const assignedByEmail = report.assignedBy?.email;

        if (assignedToEmail) {
          recipients.push(assignedToEmail);
        }
        if (assignedByEmail && assignedByEmail !== assignedToEmail) {
          recipients.push(assignedByEmail);
        }

        if (recipients.length > 0) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'patidardeepanshu910@gmail.com',
              pass: APP_PASS,
            },
          });

          await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: recipients.join(','),
            subject: `🚨 Overdue Report: ${report.title}`,
            text: `The report "${report.title}" (id: ${report._id}) has passed its deadline (${report.deadline}) and is now marked as overdue. Please take action.`,
          });
          console.log(`✉️ Overdue email sent to: ${recipients.join(', ')}`);
        }

        // 4. Emit socket event
        const payload = {
          id: report._id.toString(),
          title: report.title,
          severity: report.severity,
          deadline: report.deadline,
          isOverdue: true,
        };

        // Emit to creator
        io.to(report.createdBy.toString()).emit('reportOverdue', payload);

        // Emit to assignedTo (staff) if available
        if (report.assignedTo?._id) {
          io.to(report.assignedTo._id.toString()).emit('reportOverdue', payload);
        }

        // Emit to assignedBy (admin) if available
        if (report.assignedBy?._id) {
          io.to(report.assignedBy._id.toString()).emit('reportOverdue', payload);
        }

        // Emit to all other admins
        for (const admin of admins) {
          const adminIdStr = admin._id.toString();
          if (
            adminIdStr !== report.createdBy.toString() &&
            adminIdStr !== report.assignedBy?._id?.toString()
          ) {
            io.to(adminIdStr).emit('reportOverdue', payload);
          }
        }

        console.log(`✅ Finished processing overdue report: ${reportId}`);

      } catch (err) {
        console.error(`❌ Error processing overdue job for report ${reportId}:`, err);
        throw err;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`🎉 Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`💥 Job ${job?.id} failed with error:`, err);
  });

  return worker;
};

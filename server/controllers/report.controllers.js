import { APP_PASS, USER_MAIL } from "../config/env.js";
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import { uploadrepOnCloudinary } from "../utils/cloudinary.js";
import nodemailer from "nodemailer";
import { Parser } from "json2csv";
import { reportQueue } from "../config/queue.js";

const GRID_SIZE = 0.01;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: USER_MAIL,
    pass: APP_PASS
  }
});

export const createReport = async (req, res, next) => {
  try {
    const parsedLocation = JSON.parse(req.body.location);
    const [lng, lat] = parsedLocation.coordinates;
    const gridX = Math.floor(lat / GRID_SIZE);
    const gridY = Math.floor(lng / GRID_SIZE);

    let image = undefined;

    if (req.file) {
      const cloudinaryResponse =
        await uploadrepOnCloudinary(req.file.buffer);

      if (!cloudinaryResponse) {
        return res.status(500).json({
          status: "error",
          message: "Failed to upload image to Cloudinary"
        });
      }

      image = {
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id
      };
    }

    // Create the report with data from req.body and the Cloudinary image URL

    const reportData = {
      ...req.body,
      departments: JSON.parse(req.body.departments),
      location: parsedLocation,
      gridX,
      gridY,
      createdBy: req.id
    };

    if (image) {
      reportData.image = image;
    }

    const report = await Report.create(reportData);

    const createdAt = new Date(report.createdAt);
    if (report.severity === 'High')
      report.deadline = new Date(createdAt.getTime() + 120 * 1000);
    else if (report.severity === 'Medium')
      report.deadline = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
    else
      report.deadline = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    await report.save();

    // Schedule delayed job for overdue report check
    const delay = report.deadline.getTime() - Date.now();
    await reportQueue.add(
      'checkOverdue',
      { reportId: report._id.toString() },
      { delay: Math.max(0, delay) }
    );
    console.log(`⏰ Scheduled overdue check job for report ${report._id} with delay ${delay}ms`);

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await transporter.sendMail({
        from: 'patidardeepanshu910@gmail.com',
        to: admin.email,
        subject: 'New Report Created',
        text: `A new report has been created with the title: ${report.title}. Please review it at your earliest convenience.`
      });
      admin.notifications.push({
        reportId: report._id,
        message: `A new report has been created with the title: ${report.title}. Please review it at your earliest convenience.`
      });
      await admin.save();
    }

    // You might want to remove the temporary file from the local server after successful upload.
    // For that, you'd need to import 'fs' and call fs.unlinkSync(localImagePath);

    const io = req.app.get('io');
    if (io) {
      io.to('globalRoom').emit('newReport', report);
      io.to('adminsRoom').emit('newNotification');
    }

    res.status(201).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    next(error)
  }
}


export const getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.find();

    res.status(200).json({
      status: 'success',
      data: reports
    });
  } catch (error) {
    next(error)
  }
}

export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({
        status: 'fail',
        message: 'Report not found'
      });
      return;
    }
    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid report ID'
      });
    }
    next(error)
  }
}

export const getReportsByUserId = async (req, res, next) => {
  try {
    const id = req.id;
    const reports = await Report.find({ createdBy: id }).populate({
      path: 'createdBy',
      options: { sort: { createdAt: -1 } },
    });
    res.status(200).json({
      success: true,
      data: reports || []
    });
  } catch (error) {
    next(error)
  }
}

export const updateReportStatusTOInProgress = async (req, res, next) => {
  try {
    // Role-based access control
    if (req.user.role === 'citizen') {
      return res.status(403).json({
        status: "fail",
        message: "You are not allowed to change the report status.",
      });
    }

    const { id } = req.params;

    // Find and update in one step
    const report = await Report.findByIdAndUpdate(
      id,
      { status: 'IN_PROGRESS' },
      { new: true, runValidators: true }
    );

    // If no report found
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to('globalRoom').emit('reportUpdated', report);
    }

    // Success response
    res.status(200).json({
      success: true,
      message: "Report verified successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};


export const updateReportStatusTOResolvedNotifiction = async (req, res, next) => {
  try {
    // Role-based access control
    if (req.user.role === 'citizen') {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to change the report status.",
      });
    }

    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: "Report must be in 'IN_PROGRESS' status to be resolved.",
      });
    }

    const user = await User.findById(report.createdBy);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Report creator not found.",
      });
    }

    await transporter.sendMail({
      from: 'patidardeepanshu910@gmail.com',
      to: user.email,
      subject: 'Problem Resolved verification',
      text: `Your report with the title: ${report.title} has been marked as resolved. Please verify the resolution at your earliest convenience.`
    });

    report.isNotifiedTOResolved = true;
    await report.save();

    user.reportsForVerification.push(report._id);
    user.notifications.push({
      reportId: report._id,
      message: `Your report with the title: ${report.title} has been marked as resolved. Please verify the resolution at your earliest convenience.`
    });
    await user.save();

    const io = req.app.get('io');
    if (io) {
      io.to(report.createdBy.toString()).emit('newNotification');
    }

    return res.status(200).json({
      success: true,
      message: "Notification sent to the report creator. Please wait for their verification.",
    });


  } catch (error) {
    next(error);
  }
};


export const getAllUnAssignedReports = async (req, res, next) => {
  try {
    // Role-based access control
    if (req.user.role === 'citizen' || req.user.role === 'staff') {
      return res.status(403).json({
        status: "fail",
        message: "You are not allowed to view unassigned reports.",
      });
    }

    const reports = await Report.find({ isAssigned: false });

    res.status(200).json({
      status: "success",
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const departments = await Report.findById(id).select('departments');
    if (!departments) {
      return res.status(404).json({
        status: 'fail',
        message: 'No departments found for this report'
      });
    }

    const staffs = await User.find({
      role: 'staff',
      departments: { $in: departments.departments }
    }).select('-password').select('-otp').select('-otpExpiry').select('-reportsForVerification').select('-__v').select('-isVerified');

    if (staffs.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No staff found for the report departments',
        data: {
          staffs: [],
          reportDepartments: departments.departments
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        staffs: staffs,
        reportDepartments: departments.departments
      }
    });
  } catch (error) {
    next(error);
  }
}

export const updateReportStatusToResolved = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        status: 'fail',
        message: 'Report not found'
      });
    }

    console.log(report);

    if (report.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        status: 'fail',
        message: "Report must be in 'IN_PROGRESS' status to be resolved."
      });
    }

    if (!report.isNotifiedTOResolved) {
      return res.status(400).json({
        status: 'fail',
        message: "Report creator has not been notified for verification yet."
      });
    }

    if (report.createdBy.toString() !== req.id) {
      return res.status(403).json({
        status: 'fail',
        message: "You are not authorized to verify this report."
      });
    }

    report.status = 'Resolved';
    await report.save();

    // Also remove the report from user's reportsForVerification array
    await User.findByIdAndUpdate(report.createdBy, { $pull: { reportsForVerification: report._id } });

    const staff = await User.findById(report.assignedTo);

    if (staff) {
      await transporter.sendMail({
        from: 'patidardeepanshu910@gmail.com',
        to: staff.email,
        subject: 'Problem Resolved verification done by Creator',
        text: `The creator of the report with the title: ${report.title} has verified the resolution. Thank you for your efforts!`
      });
      staff.notifications.push({
        reportId: report._id,
        message: `The creator of the report with the title: ${report.title} has verified the resolution. Thank you for your efforts!`
      });
      await staff.save();

    }

    const admins = await User.find({ role: 'admin' });
    admins.forEach(async (admin) => {
      await transporter.sendMail({
        from: 'patidardeepanshu910@gmail.com',
        to: admin.email,
        subject: 'Report Resolved',
        text: `The creator of the report with the title: ${report.title} has verified the resolution. Thank you for your efforts!`
      });
      admin.notifications.push({
        reportId: report._id,
        message: `The creator of the report with the title: ${report.title} has verified the resolution. Thank you for your efforts!`
      });
      await admin.save();
    });

    const io = req.app.get('io');
    if (io) {
      io.to('globalRoom').emit('reportUpdated', report);
      if (staff) {
        io.to(staff._id.toString()).emit('newNotification');
      }
      io.to('adminsRoom').emit('newNotification');
    }

    res.status(200).json({
      status: 'success',
      message: 'Report marked as resolved successfully',
      data: report
    });
  } catch (error) {
    next(error)
  }
}

export const rejectResolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        status: 'fail',
        message: 'Report not found'
      });
    }

    if (report.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        status: 'fail',
        message: "Report must be in 'IN_PROGRESS' status to reject the resolution."
      });
    }

    if (!report.isNotifiedTOResolved) {
      return res.status(400).json({
        status: 'fail',
        message: "Report creator has not been notified for verification yet."
      });
    }

    if (report.createdBy.toString() !== req.id) {
      return res.status(403).json({
        status: 'fail',
        message: "You are not authorized to reject the resolution of this report."
      });
    }

    // Reset notification flag to allow future notifications and set back to OPEN
    report.isNotifiedTOResolved = false;
    report.status = 'OPEN';
    await report.save();

    // Also remove the report from user's reportsForVerification array
    await User.findByIdAndUpdate(report.createdBy, { $pull: { reportsForVerification: report._id } });

    const staff = await User.findById(report.assignedTo);

    if (staff) {
      await transporter.sendMail({
        from: 'patidardeepanshu910@gmail.com',
        to: staff.email,
        subject: 'Problem Resolved verification Rejected by Creator',
        text: `The creator of the report with the title: ${report.title} has rejected the resolution. Please look into it again.`
      });
      staff.notifications.push({
        reportId: report._id,
        message: `The creator of the report with the title: ${report.title} has rejected the resolution. Please look into it again.`
      });
      await staff.save();

    }

    const io = req.app.get('io');
    if (io) {
      io.to('globalRoom').emit('reportUpdated', report);
      if (staff) {
        io.to(staff._id.toString()).emit('newNotification');
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Report resolution rejected successfully. You can expect a new resolution soon.',
      data: report
    });
  } catch (error) {
    next(error)
  }
}

export const getAllAssignedReportsByAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to view assigned reports by admin.",
      });
    }

    const reports = await Report.find({
      isAssigned: true,
      "assignedBy._id": req.user._id
    });

    res.status(200).json({
      status: "success",
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

export const downloadReportsCSV = async (req, res) => {
  try {
    const reports = await Report.find().lean();

    // Overall stats
    const totalReports = reports.length;
    const resolved = reports.filter(r => r.status === "Resolved").length;
    const pending = reports.filter(r => r.status === "Pending").length;
    const inProgress = reports.filter(r => r.status === "In Progress").length;

    // Department-wise stats
    const departments = [...new Set(reports.map(r => r.department))];
    const departmentStats = departments.map(dep => {
      const depReports = reports.filter(r => r.department === dep);
      return {
        department: dep,
        total: depReports.length,
        resolved: depReports.filter(r => r.status === "Resolved").length,
        pending: depReports.filter(r => r.status === "Pending").length,
        inProgress: depReports.filter(r => r.status === "In Progress").length
      };
    });

    // CSV rows
    const statsRow = {
      title: "OVERALL STATS",
      description: `Total: ${totalReports}, Resolved: ${resolved}, Pending: ${pending}, In Progress: ${inProgress}`,
      severity: "",
      department: "",
      status: ""
    };

    const departmentRows = departmentStats.map(depStat => ({
      title: `DEPARTMENT: ${depStat.department}`,
      description: `Total: ${depStat.total}, Resolved: ${depStat.resolved}, Pending: ${depStat.pending}, In Progress: ${depStat.inProgress}`,
      severity: "",
      department: depStat.department,
      status: ""
    }));

    const dataToExport = [statsRow, ...departmentRows, ...reports];

    const fields = ["title", "description", "severity", "department", "status"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(dataToExport);

    res.header("Content-Type", "text/csv");
    res.attachment("reports.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getHeatmapGridData = async (req, res, next) => {
  try {
    const { severity, status, departments } = req.query;

    // Self-healing migration for legacy reports without grid coordinates
    const ungriddedReports = await Report.find({
      $or: [
        { gridX: { $exists: false } },
        { gridY: { $exists: false } }
      ]
    });

    if (ungriddedReports.length > 0) {
      for (const report of ungriddedReports) {
        if (report.location && report.location.coordinates) {
          const [lng, lat] = report.location.coordinates;
          report.gridX = Math.floor(lat / GRID_SIZE);
          report.gridY = Math.floor(lng / GRID_SIZE);
          await report.save();
        }
      }
    }

    const matchStage = {};
    if (severity) matchStage.severity = severity;
    if (status) matchStage.status = status;
    if (departments) {
      const deptsArray = Array.isArray(departments)
        ? departments
        : departments.split(',').filter(Boolean);
      if (deptsArray.length > 0) {
        matchStage.departments = { $in: deptsArray };
      }
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({
      $group: {
        _id: {
          x: "$gridX",
          y: "$gridY"
        },
        count: { $sum: 1 },
        reportIds: { $push: "$_id" }
      }
    });

    const aggregated = await Report.aggregate(pipeline);

    const gridData = aggregated
      .filter(cell => cell._id.x !== null && cell._id.y !== null)
      .map(cell => {
        const lat = (cell._id.x + 0.5) * GRID_SIZE;
        const lng = (cell._id.y + 0.5) * GRID_SIZE;
        return {
          lat,
          lng,
          count: cell.count,
          reportIds: cell.reportIds
        };
      });

    res.status(200).json({
      status: 'success',
      data: gridData
    });
  } catch (error) {
    next(error);
  }
};
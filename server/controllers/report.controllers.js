import { APP_PASS } from "../config/env.js";
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import { uploadrepOnCloudinary } from "../utils/cloudinary.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'patidardeepanshu910@gmail.com',
        pass: APP_PASS
    }
});

export const createReport = async (req, res, next) => {
    try {
        // Check if an image was uploaded
        if (!req.file) {
            
            const report = await Report.create({
            ...req.body,
            departments: JSON.parse(req.body.departments),
            location: JSON.parse(req.body.location), // Assuming location comes as a stringified JSON
            createdBy: req.id
        })
        const createdAt = new Date(report.createdAt);
        if(report.severity === 'High')
        report.deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        else if(report.severity === 'Medium')
        report.deadline = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
        else
        report.deadline = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
        await report.save();

          const admins = await User.find({ role: 'admin' });

        admins.forEach(async (element) => {
          await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: element.email,
            subject: 'New Report Created',
            text: `A new report has been created with the title: ${report.title}. Please review it at your earliest convenience.`
        });
        });

            return res.status(200).json({
                status: 'success',
                data: report
            });
        }
        
        const localImagePath = req.file.path;

        // Upload image to Cloudinary
        const cloudinaryResponse = await uploadrepOnCloudinary(localImagePath);

        if (!cloudinaryResponse || !cloudinaryResponse.url) {
            // In a real app, you'd handle the file deletion from the local system here if the upload failed
            return res.status(500).json({
                status: 'error',
                message: 'Failed to upload image to Cloudinary'
            });
        }

        // Create the report with data from req.body and the Cloudinary image URL
        const report = await Report.create({
            ...req.body,
            departments: JSON.parse(req.body.departments),
            location: JSON.parse(req.body.location), // Assuming location comes as a stringified JSON
            image: {
                url: cloudinaryResponse.url // Store the URL returned by Cloudinary
            },
            createdBy: req.id
        })

        const createdAt = new Date(report.createdAt);
        if(report.severity === 'High')
        report.deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        else if(report.severity === 'Medium')
        report.deadline = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
        else
        report.deadline = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
        await report.save();

        const admins = await User.find({ role: 'admin' });        
        admins.forEach(async (element) => {
          await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: element.email,
            subject: 'New Report Created',
            text: `A new report has been created with the title: ${report.title}. Please review it at your earliest convenience.`
        });
        });

        // You might want to remove the temporary file from the local server after successful upload.
        // For that, you'd need to import 'fs' and call fs.unlinkSync(localImagePath);

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
        if(error.name === 'CastError') {
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
        const  id  = req.id;
        const reports = await Report.find({ createdBy: id }).populate({
            path: 'createdBy',
            options: { sort: { createdAt: -1 } },    
        });
        if(!reports || reports.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No reports found for this user'
            });
        }
        res.status(200).json({
            success: true,
            data: reports
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
        await user.save();
      
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
      const { id }= req.params;
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

        if (report.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                status: 'fail',
                message: "Report must be in 'IN_PROGRESS' status to be resolved."
            });
        }

        if( !report.isNotifiedTOResolved ) {
            return res.status(400).json({
                status: 'fail',
                message: "Report creator has not been notified for verification yet."
            });
        }

        if(report.createdBy.toString() !== req.id ) {
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
        
        if(staff) {
            await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: staff.email,
            subject: 'Problem Resolved verification done by Creator',
            text: `The creator of the report with the title: ${report.title} has verified the resolution. Thank you for your efforts!`
        });

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
  
      if( !report.isNotifiedTOResolved ) {
        return res.status(400).json({
          status: 'fail',
          message: "Report creator has not been notified for verification yet."
        });
      }
  
      if(report.createdBy.toString() !== req.id ) {
        return res.status(403).json({
          status: 'fail',
          message: "You are not authorized to reject the resolution of this report."
        });
      }
  
      // Reset notification flag to allow future notifications
      report.isNotifiedTOResolved = false;
      await report.save();
  
      // Also remove the report from user's reportsForVerification array
      await User.findByIdAndUpdate(report.createdBy, { $pull: { reportsForVerification: report._id } });

      const staff = await User.findById(report.assignedTo);
        
        if(staff) {
          await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: staff.email,
            subject: 'Problem Resolved verification Rejected by Creator',
            text: `The creator of the report with the title: ${report.title} has rejected the resolution. Please look into it again.`
        });

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
      if (reports.length === 0) {
        return res.status(404).json({
          status: "fail",
          message: "No assigned reports found.",
        });
      }

      res.status(200).json({
        status: "success",
        data: reports,
      });
    } catch (error) {
      next(error);
    }
}

export const notifyOnOverdueReports = async (req, res, next) => {
    try {
          const id = req.params;
        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({
                status: 'fail',
                message: 'Report not found'
            });
        }

        if (report.status === 'Resolved') {
            return res.status(400).json({
                status: 'fail',
                message: "Resolved reports cannot be overdue."
            });
        }

        const nowTime = new Date().getTime();
        const deadlineTime = new Date(report.deadline).getTime();
        
        if (nowTime <= deadlineTime) {
            return res.status(400).json({
                status: 'fail',
                message: "Report is not overdue yet."
            });
        }
        await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: report.assignedTo.email,
            subject: 'Report overdue notification',
            text: `The report with the title: ${report.title} assigned to you is overdue. Please take immediate action to resolve it.`
        });
        
        await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: report.assignedBy.email,
            subject: 'Problem Resolved verification Rejected by Creator',
            text: `The creator of the report with the title: ${report.title} has rejected the resolution. Please look into it again.`
        });

        res.status(200).json({
            status: 'success',
            message: 'Overdue notification sent successfully',
        });
  }
catch (error) {
        next(error);
    }
}
// export const deleteReport = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         const report = await Report.findByIdAndDelete(id);
//         if (!report) {
//             return res.status(404).json({
//                 status: 'fail',
//                 message: 'Report not found'
//             });
//         }
//         res.status(200).json({
//             status: 'success',
//             message: 'Report deleted successfully',
//         });
//     } catch (error) {
//         next(error)
//     }
// }
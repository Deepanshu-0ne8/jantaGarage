import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import { uploadrepOnCloudinary } from "../utils/cloudinary.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'patidardeepanshu910@gmail.com',
        pass: 'dosv rzwn tchz kifx'
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
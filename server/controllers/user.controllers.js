import { assign } from "nodemailer/lib/shared/index.js";
import { APP_PASS, DEFAULT_DP } from "../config/env.js";
import Report from "../models/report.model.js";
import User, { departmentList } from "../models/user.model.js";
import { extractPublicId, uploadDpOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'patidardeepanshu910@gmail.com',
        pass: APP_PASS
    }
});

export const getProfile = async (req, res, next) => {
  try {
    // If the request reaches this point, the `protect` middleware has already
    // verified the JWT and attached the user's data to `req.user`.

    // All we need to do is send that user object back to the client.
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, contact, address, departments } = req.body;
    const file = req.file;

    let isUpdated = false;
    let deletionWarning = null;

    if (name && name !== req.user.name) {
      req.user.name = name;
      isUpdated = true;
    }

    if (contact) {
      const numCont = Number(contact);
      if (isNaN(numCont)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact number format.",
        });
      }
      req.user.contact = numCont;
      isUpdated = true;
    }

    if (address && address !== req.user.address) {
      req.user.address = address;
      isUpdated = true;
    }

    if (file) {
      const localImagePath = file.path;
      const oldUrl = req.user.displaypic?.url;

      const cloudinaryResponse = await uploadDpOnCloudinary(localImagePath);

      if (!cloudinaryResponse || !cloudinaryResponse.url) {
        return res.status(500).json({
          success: false,
          status: "error",
          message: "Failed to upload image to Cloudinary. Please try again.",
        });
      }

      req.user.displaypic.url = cloudinaryResponse.url;
      isUpdated = true;

      if (oldUrl && oldUrl !== DEFAULT_DP) {
        const publicId = extractPublicId(oldUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error("Error deleting old image:", error);
            deletionWarning = "Old image could not be deleted from Cloudinary.";
          }
        }
      }
    }

    // Departments update with validation
    if (departments !== undefined) {
      if (req.user.role === "citizen") {
        return res.status(403).json({
          success: false,
          message: "Citizens cannot update departments.",
        });
      }

      let newDepartments = departments;

      // Handle string input as single department
      if (!Array.isArray(newDepartments)) {
        newDepartments = [newDepartments];
      }

      // Validate against allowed list
      const invalid = newDepartments.filter(
        (dept) => !departmentList.includes(dept)
      );
      if (invalid.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid department(s): ${invalid.join(", ")}`,
        });
      }

      // // Merge unique departments
      // const existing = req.user.departments || [];
      // const unique = [...new Set([...existing, ...newDepartments])];
      req.user.departments = newDepartments;
      isUpdated = true;
    }

    // Save only if something changed
    if (isUpdated) {
      const updatedUser = await req.user.save();
      return res.status(200).json({
       success: true,
        message: "Profile updated successfully.",
        warning: deletionWarning,
        data: updatedUser.toObject(),
      });
    }

    // If nothing changed
    return res.status(200).json({
      success: true,
      message: "No changes detected.",
      data: req.user.toObject(),
    });
  } catch (error) {
    next(error);
  }
};


export const removeDp = async (req, res, next) => {
   try {
     const oldUrl = req.user.displaypic.url;
    if(oldUrl === DEFAULT_DP) {
        return res.status(200).json({
            success: true,
            message: "NO profile pic to delete",
            data: req.user
        })
    }

    if (oldUrl) {
        const publicId = extractPublicId(oldUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            res.status(404).json({
                success:false,
                message:"deletion failed"
            })
            next(error)
          }
        }
      }

      req.user.displaypic.url = DEFAULT_DP;

      const updatedUser = await req.user.save();
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser.toObject(),
      });
   } catch (error) {
    next(error);
   }
}

export const getdepartmentalReport = async (req, res, next) => {
    try {
        if (req.user.role === 'citizen') {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to view departmental reports'
            });
        }

        if(req.user.role === 'admin') {
            const reports = await Report.find({});
            return res.status(200).json({
                success: true,
                data: reports
            });
        }

        const reports = await Report.find({ departments: { $in: req.user.departments } });

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
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

export const getReportsForVerification = async (req, res, next) => {
    try {
      const reportsId = req.user.reportsForVerification;
      if(!reportsId || reportsId.length === 0) {
        return res.status(404).json({
            status: 'fail',
            message: 'No reports found for verification'
        });
      }
      const reports = await Report.find({_id: { $in: reportsId }});
      if(reports.length === 0) {
        return res.status(404).json({
            status: 'fail',
            message: 'No reports found for verification'
        });
      }
        res.status(200).json({
            success: true,
            data: reports
        })
    } catch (error) {
        next(error)
    }
}


export const rejectVerification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const report = await Report.findById(id);
        if(!report) {
            return res.status(404).json({
                status: 'fail',
                message: 'Report not found'
            });
        }
        report.status = "OPEN";
        report.isNotifiedTOResolved = false;
        await report.save();

        await User.findByIdAndUpdate(report.createdBy, { $pull: { reportsForVerification: id } });

        await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: user.email,
            subject: 'Problem Resolved verification',
            text: `Your report with the title: ${report.title} has been marked as resolved. Please verify the resolution at your earliest convenience.`
        });

    } catch (error) {
        next(error)
    }
}



export const assignReportToStaff = async (req, res, next) => {
    try {
      const { reportId, staffId } = req.body;

      if (!reportId || !staffId) {
        return res.status(400).json({
          success: false,
          message: "Both reportId and staffId are required.",
        });
      }

      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found.",
        });
      }

      const staff = await User.findById(staffId);
      if (!staff || (staff.role === "citizen" || staff.role === "admin")) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff ID or user is not a staff member.",
        });
      }

      if (report.isAssigned) {
        return res.status(400).json({
          success: false,
          message: "Report is already assigned to a staff member.",
        });
      }

      report.isAssigned = true;
      report.assignedTo = staff._id;
      await report.save();

      staff.reportsAssigned.push(report._id);
      await staff.save();

      await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: staff.email,
            subject: 'New Report Assignment',
            text: `You have been assigned a new report with the title: ${report.title}. Please check your dashboard for more details.`
        });

      res.status(200).json({
        success: true,
        message: "Report assigned to staff successfully.",
        data: { report, staff },
      });
    } catch (error) {
      next(error);
    }
}


export const getAssignedReports = async (req, res, next) => {
    try {
      const user = req.user;
      if(user.role === "citizen" || user.role === "admin") {
        return res.status(403).json({
            success: false,
            message: "Only staff members can have assigned reports."
        });
      }
      const reportsId = user.reportsAssigned;
      if(!reportsId || reportsId.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No assigned reports found for this staff'
        });
      }
      const reports = await Report.find({_id: { $in: reportsId }});
      if(reports.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No assigned reports found for this staff'
        });
      }
        res.status(200).json({
            success: true,
            data: reports
        })
    } catch (error) {
      next(error);
    }
}
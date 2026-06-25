import { assign } from "nodemailer/lib/shared/index.js";
import { APP_PASS, DEFAULT_DP, USER_MAIL } from "../config/env.js";
import Report from "../models/report.model.js";
import User, { departmentList } from "../models/user.model.js";
import { extractPublicId, uploadDpOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: USER_MAIL,
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
  const oldPublicId = req.user.displaypic?.publicId;

  const cloudinaryResponse =
    await uploadDpOnCloudinary(file.buffer);

  if (!cloudinaryResponse) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload image"
    });
  }

  req.user.displaypic = {
    url: cloudinaryResponse.secure_url,
    publicId: cloudinaryResponse.public_id
  };

  if (oldPublicId) {
    try {
      await cloudinary.uploader.destroy(oldPublicId);
    } catch (err) {
      console.error(err);
    }
  }

  isUpdated = true;
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
    const currentDp = req.user.displaypic;

    if (!currentDp || currentDp.url === DEFAULT_DP) {
      return res.status(200).json({
        success: true,
        message: "No profile picture to delete",
        data: req.user.toObject(),
      });
    }

    const publicId = currentDp.publicId;

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Cloudinary deletion failed:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to delete profile picture from Cloudinary",
        });
      }
    }

    req.user.displaypic = {
      url: DEFAULT_DP,
      publicId: null,
    };

    const updatedUser = await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      data: updatedUser.toObject(),
    });
  } catch (error) {
    console.error("REMOVE DP ERROR:", error);
    next(error);
  }
};

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
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        // console.log(reports);
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
        return res.status(200).json({
            success: true,
            data: []
        });
      }
      const reports = await Report.find({_id: { $in: reportsId }});
        res.status(200).json({
            success: true,
            data: reports
        })
    } catch (error) {
        next(error)
    }
}

export const assignReportToStaff = async (req, res, next) => {
    try {

      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can assign reports to staff.",
        });
      }

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
      report.assignedTo = {
        name: staff.name,
        userName: staff.userName,
        _id: staff._id,
        email: staff.email,
      };
      report.assignedBy = {
        name: req.user.name,
        userName: req.user.userName,
        _id: req.user._id,
        email: req.user.email
      };
      await report.save();

      staff.reportsAssigned.push(report._id);
      staff.notifications.push({
        reportId: report._id,
        message: `You have been assigned a new report with the title: ${report.title}.`,
      });
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

      const io = req.app.get('io');
      if (io) {
        io.to('globalRoom').emit('reportUpdated', report);
        io.to(staff._id.toString()).emit('newNotification');
      }
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
        return res.status(200).json({
            success: true,
            data: [],
            message: 'No assigned reports found for this staff'
        });
      }

      const reports = await Report.find({_id: { $in: reportsId }})
        .sort({ createdAt: -1 });
        
      if(reports.length === 0) {
        return res.status(200).json({
            success: true,
            message: 'No active reports found for this staff',
            data: []
        });
      }
      
      res.status(200).json({
          success: true,
          data: reports
      });

    } catch (error) {
      next(error);
    }
}

export const getNotifications = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user.notifications
    })
  } catch (error) {
    next(error)
  }
}

export const removeNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    if(!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    const notificationIndex = req.user.notifications.findIndex(
      (notification) => notification.notificationId.toString() === notificationId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    req.user.notifications.splice(notificationIndex, 1);

    
    await req.user.save();
    res.status(200).json({
      success: true,
      message: 'Notification removed successfully',
      data: req.user.notifications
    })
  } catch (error) {
    next(error)
  }
}

export const removeAllNotifications = async (req, res, next) => {
  try {
    req.user.notifications = [];
    await req.user.save();
    res.status(200).json({
      success: true,
      message: 'All notifications removed successfully',
      data: []
    })
  } catch (error) {
    next(error)
  }
}



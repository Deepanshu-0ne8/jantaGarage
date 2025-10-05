import { DEFAULT_DP } from "../config/env.js";
import { departmentList } from "../models/user.model.js";
import { extractPublicId, uploadDpOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

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
          status: "fail",
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
          status: "fail",
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
          status: "fail",
          message: `Invalid department(s): ${invalid.join(", ")}`,
        });
      }

      // Merge unique departments
      const existing = req.user.departments || [];
      const unique = [...new Set([...existing, ...newDepartments])];
      req.user.departments = unique;
      isUpdated = true;
    }

    // Save only if something changed
    if (isUpdated) {
      const updatedUser = await req.user.save();
      return res.status(200).json({
        status: "success",
        message: "Profile updated successfully.",
        warning: deletionWarning,
        data: updatedUser.toObject(),
      });
    }

    // If nothing changed
    return res.status(200).json({
      status: "success",
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
        status: "success",
        message: "Profile updated successfully",
        data: updatedUser.toObject(),
      });
   } catch (error) {
    next(error);
   }
}
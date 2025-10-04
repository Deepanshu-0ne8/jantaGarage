import { DEFAULT_DP } from "../config/env.js";
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
    const { name } = req.body;
    const file = req.file; // Multer uploads
    const contact = req.contact;
    const address = req.address;

    let isUpdated = false;
    let deletionWarning = null; // To track deletion errors

    if (name && name !== req.user.name) {
      req.user.name = name;
      isUpdated = true;
    }

    if (file) {
      const localImagePath = file.path;
      const oldUrl = req.user.displaypic?.url;

      // Upload new image
      const cloudinaryResponse = await uploadDpOnCloudinary(localImagePath);

      if (!cloudinaryResponse || !cloudinaryResponse.url) {
        return res.status(500).json({
          status: "error",
          message: "Failed to upload image to Cloudinary. Please try again.",
        });
      }

      // Assign new image
      req.user.displaypic.url = cloudinaryResponse.url;
      isUpdated = true;

      // Try deleting old image (non-blocking for update)
      if (oldUrl) {
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

    if(contact) {
        req.user.contact = contact;
        isUpdated = true;
    }

    if(address) {
        req.user.address = address;
        isUpdated = true;
    }

    if (isUpdated) {
      const updatedUser = await req.user.save();

      return res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
        warning: deletionWarning, // will be null if no error
        data: updatedUser.toObject(),
      });
    }

    return res.status(200).json({
      status: "success",
      message: "No changes detected or applied.",
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
        res.status(200).json({
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
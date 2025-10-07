import { v2 as cloudinary } from 'cloudinary';
import { 
    CLOUDINARY_CLOUD_NAME, 
    CLOUDINARY_API_KEY, 
    CLOUDINARY_API_SECRET 
} from '../config/env.js';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

/**
 
 * @param {string} localFilePath 
 * @returns {Promise<object | null>}
 */
export const uploadrepOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "jantaGarage/reportsimage" // Optional: specify a folder
        });

        // File has been uploaded successfully
        // console.log("File is uploaded on cloudinary", response.url);
        return response;

    } catch (error) {
        // You might want to delete the file from the local server after a failed upload
        // fs.unlinkSync(localFilePath); 
        console.error("Cloudinary upload failed:", error);
        return null;
    }
}

export const uploadDpOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "jantaGarage/DisplayPics" // Optional: specify a folder
        });

        // File has been uploaded successfully
        // console.log("File is uploaded on cloudinary", response.url);
        return response;

    } catch (error) {
        // You might want to delete the file from the local server after a failed upload
        // fs.unlinkSync(localFilePath); 
        console.error("Cloudinary upload failed:", error);
        return null;
    }
}

export const extractPublicId = (url) => {
  try {
    // Example: https://res.cloudinary.com/demo/image/upload/v1696001234/myfolder/testimage.jpg
    const parts = url.split("/");
    const versionAndPublicId = parts.slice(7).join("/"); // skip until after 'upload/'
    const withoutExtension = versionAndPublicId.replace(/\.[^/.]+$/, ""); // remove extension
    // remove version number like v1234567890/
    return withoutExtension.replace(/^v[0-9]+\//, "");
  } catch (err) {
    console.error("Invalid Cloudinary URL");
    return null;
  }
}

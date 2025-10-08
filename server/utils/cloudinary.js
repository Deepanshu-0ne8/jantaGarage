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

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "jantaGarage/reportsimage" 
        });

       
        return response;

    } catch (error) {
        
        console.error("Cloudinary upload failed:", error);
        return null;
    }
}

export const uploadDpOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "jantaGarage/DisplayPics" 
        });

        
        return response;

    } catch (error) {
        
        console.error("Cloudinary upload failed:", error);
        return null;
    }
}

export const extractPublicId = (url) => {
  try {
    const parts = url.split("/");
    const versionAndPublicId = parts.slice(7).join("/"); 
    const withoutExtension = versionAndPublicId.replace(/\.[^/.]+$/, ""); 
    return withoutExtension.replace(/^v[0-9]+\//, "");
  } catch (err) {
    console.error("Invalid Cloudinary URL");
    return null;
  }
}
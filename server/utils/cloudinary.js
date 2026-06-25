import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
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

export const uploadrepOnCloudinary = async (buffer) => {
    try {
        if (!buffer) return null;

        return await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: "jantaGarage/reportsimage"
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            streamifier.createReadStream(buffer).pipe(stream);
        });

    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return null;
    }
};

export const uploadDpOnCloudinary = async (buffer) => {
    try {
        if (!buffer) return null;

        return await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: "jantaGarage/DisplayPics"
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            streamifier.createReadStream(buffer).pipe(stream);
        });

    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return null;
    }
};

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
};
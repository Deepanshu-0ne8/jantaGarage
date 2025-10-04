import Report from "../models/report.model.js";
import { uploadrepOnCloudinary } from "../utils/cloudinary.js";

export const createReport = async (req, res, next) => {
    try {
        // Check if an image was uploaded
        if (!req.file) {

            const report = await Report.create({
            ...req.body,
            location: JSON.parse(req.body.location), // Assuming location comes as a stringified JSON
            createdBy: req.id
        })

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
            location: JSON.parse(req.body.location), // Assuming location comes as a stringified JSON
            image: {
                url: cloudinaryResponse.url // Store the URL returned by Cloudinary
            },
            createdBy: req.id
        })
        
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
            status: 'success',
            data: reports
        });
    } catch (error) {
        next(error)
    }
}


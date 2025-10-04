import multer from "multer";
import path from "path";
import fs from "fs"; // File system module to ensure directory exists

// Define the temporary storage path
const uploadDir = "public/temp";

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Store files temporarily in a 'public/temp' directory
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename using timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: storage
});
import express, { Router } from 'express';
import { authorize } from '../middlewares/auth.middleware.js';
import { createReport,
        getAllAssignedReportsByAdmin,
        getAllReports,
        getAllStaff,
        getAllUnAssignedReports,
        getReportById,
        getReportsByUserId,
        notifyOnOverdueReports,
        rejectResolution,
        updateReportStatusTOInProgress, 
        updateReportStatusToResolved,
        updateReportStatusTOResolvedNotifiction,
        downloadReportsCSV
    } from '../controllers/report.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';
import multer from "multer";


const reportRouter = express.Router();
// const upload = multer({ dest: "uploads/" });

reportRouter.post('/', authorize, upload.single('reportImage'), createReport);

reportRouter.get('/', authorize, getAllReports);

reportRouter.get('/get/:id', authorize, getReportById);

reportRouter.get('/user', authorize, getReportsByUserId);

reportRouter.delete('/delete/:id', authorize, (req, res, next) => { 
    res.send(`Delete report with id route called`);
});

reportRouter.put('/verify/:id', authorize, updateReportStatusTOInProgress);

reportRouter.put('/resolve/:id', authorize, updateReportStatusTOResolvedNotifiction);

reportRouter.get('/unAssigned', authorize, getAllUnAssignedReports);

reportRouter.get('/getAllStaff/:id', authorize, getAllStaff);

reportRouter.patch('/toResolved/:id', authorize, updateReportStatusToResolved);

reportRouter.patch('/reject/:id', authorize, rejectResolution);

reportRouter.get('/assignedReports', authorize, getAllAssignedReportsByAdmin);

reportRouter.patch('/notifyForOverdue/:id', authorize, notifyOnOverdueReports);

reportRouter.get("/download-csv", downloadReportsCSV);


export default reportRouter;
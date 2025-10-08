import express from 'express';
import { authorize } from '../middlewares/auth.middleware.js';
import { createReport, getAllReports, getAllStaff, getAllUnAssignedReports, getReportById, getReportsByUserId, updateReportStatusTOInProgress, updateReportStatusTOResolvedNotifiction } from '../controllers/report.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';

const reportRouter = express.Router();

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



export default reportRouter;
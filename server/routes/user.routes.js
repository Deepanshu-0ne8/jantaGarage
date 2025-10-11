import express from 'express';
import { authorize } from '../middlewares/auth.middleware.js';
import { assignReportToStaff, getAssignedReports, getdepartmentalReport, getnotifyOnOverdueReports, getProfile, getReportsForVerification, notifyOnOverdueReportsRemove, removeDp, updateProfile } from '../controllers/user.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';
// import { notifyOnOverdueReports } from '../controllers/report.controllers.js';

const userRouter = express.Router();

userRouter.get('/profile', authorize, getProfile);

userRouter.patch('/', authorize, upload.single('displayPic'), updateProfile);

userRouter.delete('/', authorize, removeDp);

userRouter.get('/departmentalReport', authorize, getdepartmentalReport);

userRouter.get('/reportForVerification', authorize, getReportsForVerification);

userRouter.patch('/assignReport', authorize, assignReportToStaff);

userRouter.get('/assignedReports', authorize, getAssignedReports);

userRouter.get('/notifyForOverdue', authorize, getnotifyOnOverdueReports);

userRouter.patch('/notifyForOverdueRem/:id', authorize, notifyOnOverdueReportsRemove);

export default userRouter;
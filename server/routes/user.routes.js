import express from 'express';
import { authorize } from '../middlewares/auth.middleware.js';
import { assignReportToStaff, getAssignedReports, getdepartmentalReport, getNotifications, getProfile, getReportsForVerification, removeNotification, removeDp, updateProfile, removeAllNotifications } from '../controllers/user.controllers.js';
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

userRouter.get('/notifications', authorize, getNotifications);

userRouter.patch('/remove/:notificationId', authorize, removeNotification);

userRouter.patch('/removeAll', authorize, removeAllNotifications);

export default userRouter;
import express from 'express';
import { authorize } from '../middlewares/auth.middleware.js';
import { assignReportToStaff, getAssignedReports, getdepartmentalReport, getProfile, getReportsForVerification, removeDp, updateProfile } from '../controllers/user.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';

const userRouter = express.Router();

userRouter.get('/profile', authorize, getProfile);

userRouter.patch('/', authorize, upload.single('displayPic'), updateProfile);

userRouter.delete('/', authorize, removeDp);

userRouter.get('/departmentalReport', authorize, getdepartmentalReport);

userRouter.get('/reportForVerification', authorize, getReportsForVerification);

userRouter.delete('/assignReport/:userId/:reportId', authorize, assignReportToStaff);

userRouter.post('/assignedReports', authorize, getAssignedReports);

export default userRouter;
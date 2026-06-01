import express from 'express';
import { createProject } from '../controllers/createProject.js';
import { paymentInitController, paymentVerifyController } from '../controllers/payment.controller.js';
import { createProjectValidator, paymentInitValidator } from '../validators/createProject.js';

const projectRouter = express.Router();

projectRouter.post('/projects', createProjectValidator, createProject);
projectRouter.post('/payment/init', paymentInitValidator, paymentInitController);
projectRouter.post('/payment/verify', paymentVerifyController);


export default projectRouter;

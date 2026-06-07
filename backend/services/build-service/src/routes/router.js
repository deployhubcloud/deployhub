import express from 'express';
import { buildLogsStream } from '../controllers/buildLogsStream.js';


const buildRouter = express.Router();

buildRouter.get('/builds/logs/:projectId', buildLogsStream)


export default buildRouter;

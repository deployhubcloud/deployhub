import express from 'express';
import { checkHealthMiddleware } from '../../middlewares/healthCheck.js';

const monitoringRouter = express.Router();

// currently this routes is for testing , later we can add more monitoring related routes here
monitoringRouter.get('/health', checkHealthMiddleware('Monitoring'), (req, res) => {
    res.json({ status: 'ok' });
});


export default monitoringRouter;
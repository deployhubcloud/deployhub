import { buildLogsStreamService } from "../services/buildLogsStream.js";

export const buildLogsStream = async (req, res) => {
    try {


        const projectId = req.params.projectId;

        const poll = await buildLogsStreamService(projectId, res);


        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()

        const timer = setInterval(poll, 500)

        req.on('close', () => clearInterval(timer))

    } catch (error) {

        if (res.headersSent) {
            return res.end();
        }
        
        res.status(error.status || 500).json({
            message: error.message || "Internal Server Error"
        })
    }
}
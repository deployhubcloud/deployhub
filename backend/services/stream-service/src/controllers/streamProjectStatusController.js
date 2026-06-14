import { streamProjectStatusService } from "../service/sreamProjectStatus.js";

export const streamProjectStatusController = async (req, res) => {
    try {
        const { projectId } = req.params;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        res.flushHeaders();

        await streamProjectStatusService(
            projectId,
            res
        );

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
};
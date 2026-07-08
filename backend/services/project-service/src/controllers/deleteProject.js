import { deleteProject } from "../services/projectSettings.js";


export const deleteProjectController = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const result = await deleteProject(userId, projectId);

        return res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error?.msg || "Internal Server Error"
        })
    }
}
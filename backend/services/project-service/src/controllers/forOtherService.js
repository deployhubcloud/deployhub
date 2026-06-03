import { getProjectById, getProjectNotificationSettingsById } from "../services/forOtherService.js";


export const getProjectByIdController = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getProjectNotificationSettingsByProjectId = async (req, res) => {
    try {

        const { projectId } = req.params;
        const projectNotificationSettings = await getProjectNotificationSettingsById(projectId);
        if (!projectNotificationSettings) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(projectNotificationSettings);

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}
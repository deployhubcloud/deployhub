import { getProjectMetaService, getProjects } from "../services/getProjects.js";

export const getProjectsController = async (req, res) => {
    try {
        const userid = req.user._id;

        const projects = await getProjects(userid);

        return res.status(200).json({
            success: true,
            projects
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "internal Server Error"
        })
    }
}

export const getProjectMetaController = async (req, res) => {
    try {

        const { projectId } = req.params

        const projectData = await getProjectMetaService(projectId);

        console.log(projectData);
        return res.status(200).json({
            projectData
        });

    } catch (error) {
        res.status(error.status || 500).json({
            message: error?.message || "Internal Server Error"
        })
    }
}
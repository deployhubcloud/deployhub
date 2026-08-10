import { getProjectDataByIdService, getProjectMetaService, getProjects } from "../services/getProjects.js";

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

        return res.status(200).json({
            projectData
        });

    } catch (error) {
        res.status(error.status || 500).json({
            message: error?.msg || "Internal Server Error"
        })
    }
};

export const getProjectDataByIdConroller = async (req, res) => {
    try {

        const { projectId } = req.params;

        const data = await getProjectDataByIdService(projectId, req.user._id);

        return res.status(200).json({
            data
        })

    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({
            message: error?.msg || "Internal Server Error"
        })
    }
}
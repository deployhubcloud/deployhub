import { getProjects } from "../services/getProjects.js";

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
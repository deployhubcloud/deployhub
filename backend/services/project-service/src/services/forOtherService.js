import { Project } from "../models/project.model.js";

export const getProjectById = async (projectId) => {

    return await Project.findById(projectId);

}
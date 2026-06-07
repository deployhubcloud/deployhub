import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js";
import { buildQueue } from "../utils/queues.js";


export const reDeployment = async (projectId) => {

    const project = await Project.findById(projectId)

    if (!project) {
        throw new AppError('Invalid Project', 404);
    }

    project.status = "queued";
    await project.save({ validateBeforeSave: false });


    await buildQueue.add(QUEUE_NAMES.BUILD, {
        projectId: project._id,
        plan: project.plan,
        userId: project.userId,
        firstTime: false
    });

    return;

}
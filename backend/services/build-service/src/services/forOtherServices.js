import { Build } from "../models/build.model.js"

export const fetchBuildForOtherService = async (BuildId) => {
    return await Build.findById(BuildId);
}
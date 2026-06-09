import { Build } from "../models/build.model.js"

export const getBuilds = (userid) => {

    const builds = await Build.find().lean();

    return builds;
}
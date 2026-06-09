import { Build } from "../models/build.model.js"

export const getBuild = (userid) => {

    const builds = await Build.find().lean();

    return builds;
}
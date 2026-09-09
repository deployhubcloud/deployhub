export function normalizeBuild(build) {
  return {
    ...build,
    projectId: build.projectId?._id || build.projectId || build.project?._id || build.project,
    buildStatus: build.buildStatus || build.buildStaus || build.status || 'unknown',
    logsUrl: build.logsUrl || build.logUrl || '',
  }
}

export function normalizeProject(project) {
  return { ...project, createdAt: project.createdAt || project.credtedAt || project.cretedAt }
}

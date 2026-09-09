/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo } from 'react'
import { io } from 'socket.io-client'
import { useApi } from '../hooks/useApi'
import { WS_URL } from '../api/ApiUrl'
import { normalizeBuild, normalizeProject } from '../api/records'

const Workspace = createContext(null)
export function WorkspaceProvider({ children }) {
  const resource = useApi('/project/projects', 'projects')
  const buildsResource = useApi('/build/builds', 'builds')
  const { updateData, reload } = resource
  const reloadBuilds = buildsResource.reload
  useEffect(() => {
    const refresh = () => {
      reload()
      reloadBuilds()
    }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [reload, reloadBuilds])
  const idsKey = (resource.data || [])
    .map((p) => p._id)
    .sort()
    .join(',')
  const ids = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey])
  useEffect(() => {
    if (!ids.length) return
    let refreshTimer
    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })
    socket.on('connect', () => {
      socket.emit('subscribe_projects', ids)
      reloadBuilds()
    })
    socket.on('project_status', ({ projectId, status }) => {
      updateData((data) =>
        (data || []).map((project) =>
          project._id === projectId ? { ...project, status } : project,
        ),
      )
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(reloadBuilds, 500)
    })
    return () => {
      clearTimeout(refreshTimer)
      socket.disconnect()
    }
  }, [ids, updateData, reloadBuilds])
  const builds = useMemo(
    () => (buildsResource.data || []).map(normalizeBuild),
    [buildsResource.data],
  )
  const projects = useMemo(() => (resource.data || []).map(normalizeProject), [resource.data])
  return (
    <Workspace.Provider
      value={{
        ...resource,
        projects,
        builds,
        buildsLoading: buildsResource.loading,
        buildsError: buildsResource.error,
        reloadBuilds: buildsResource.reload,
      }}
    >
      {children}
    </Workspace.Provider>
  )
}
export const useWorkspace = () => useContext(Workspace)

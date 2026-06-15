import { useEffect, useRef } from 'react'
import { connectSocket } from '../socket/socket'


export function useProjectStatus(projectId, onStatusUpdate) {
    const onUpdateRef = useRef(onStatusUpdate)

    useEffect(() => {
        onUpdateRef.current = onStatusUpdate
    }, [onStatusUpdate])

    useEffect(() => {
        if (!projectId) return

        const socket = connectSocket()

        const handleStatus = ({ projectId: pid, status }) => {
            if (pid === projectId) {
                onUpdateRef.current(status)
            }
        }

        socket.emit('subscribe_projects', [projectId])
        socket.on('project_status', handleStatus)

        const handleReconnect = () => {
            socket.emit('subscribe_projects', [projectId])
        }
        socket.on('connect', handleReconnect)

        return () => {
            socket.off('project_status', handleStatus)
            socket.off('connect', handleReconnect)
        }
    }, [projectId])
}

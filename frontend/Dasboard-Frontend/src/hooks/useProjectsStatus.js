import { useEffect, useRef, useCallback } from 'react'
import { connectSocket } from '../socket/socket'


export function useProjectsStatus(visibleIds, onStatusUpdate) {
    const onUpdateRef = useRef(onStatusUpdate)

    useEffect(() => {
        onUpdateRef.current = onStatusUpdate
    }, [onStatusUpdate])

    useEffect(() => {
        if (!visibleIds || visibleIds.length === 0) return

        const socket = connectSocket()

        const handleStatus = ({ projectId, status }) => {
            onUpdateRef.current(projectId, status)
        }

        socket.emit('subscribe_projects', visibleIds)
        socket.on('project_status', handleStatus)

        // Reconnect pe re-subscribe
        const handleReconnect = () => {
            socket.emit('subscribe_projects', visibleIds)
        }
        socket.on('connect', handleReconnect)

        return () => {
            socket.off('project_status', handleStatus)
            socket.off('connect', handleReconnect)
        }
    }, [visibleIds])
}

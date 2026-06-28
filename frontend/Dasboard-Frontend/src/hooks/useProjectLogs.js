import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '../socket/socket';

export function useProjectLogs(projectId) {
    const [logs, setLogs] = useState([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isStaticProject, setIsStaticProject] = useState(false);
    const [staticContent, setStaticContent] = useState(null);

    const projectIdRef = useRef(projectId);
    const socketRef = useRef(null);

    useEffect(() => {
        projectIdRef.current = projectId;
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;

        const socket = connectSocket();
        socketRef.current = socket;

        const subscribe = () => {
            socket.emit('subscribe_logs', { projectId });
            setConnected(true);
        };

        const handleDisconnect = () => {
            setConnected(false);
        };

        const handleLog = async (data) => {
            if (data.projectId !== projectIdRef.current) return;

            switch (data.type) {
                case 'reset':
                    setLogs([]);
                    setIsStaticProject(false);
                    setStaticContent(null);
                    setLoading(false);
                    break;

                case 'static_project':
                    setIsStaticProject(true);
                    setLogs([]);
                    if (data.logsUrl) {
                        try {
                            const response = await fetch(data.logsUrl);
                            const content = await response.text();
                            setStaticContent(content);
                            setLogs([content]);
                        } catch (error) {
                            setLogs(['Unable to load deployment logs.']);
                        }
                    }
                    break;

                case 'log':
                    setLogs(prev => [...prev, data.log || data.message]);
                    break;

                case 'info':
                    setLogs(prev => [...prev, `[INFO] ${data.message}`]);
                    break;

                case 'error':
                    setLogs(prev => [...prev, `[ERROR] ${data.message || data.log}`]);
                    break;

                case 'complete':
                    setLogs(prev => [...prev, '[COMPLETE] Build log stream ended.']);
                    break;

                default:
                    if (data.message) {
                        setLogs(prev => [...prev, data.message]);
                    } else if (data.log) {
                        setLogs(prev => [...prev, data.log]);
                    }
            }
        };

        socket.on('connect', subscribe);
        socket.on('disconnect', handleDisconnect);
        socket.on('build_log', handleLog);

        if (socket.connected) {
            subscribe();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('unsubscribe_logs', { projectId });
                socketRef.current.off('connect', subscribe);
                socketRef.current.off('disconnect', handleDisconnect);
                socketRef.current.off('build_log', handleLog);
                socketRef.current.disconnect();
            }
        };
    }, [projectId]);

    return {
        logs,
        loading,
        connected,
        isStaticProject,
        staticContent
    };
}
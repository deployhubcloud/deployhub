import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectLogs } from '../../hooks/useProjectLogs.js';

export default function Logs() {
    const { id: projectId } = useParams();
    const { logs, loading, connected, isStaticProject } = useProjectLogs(projectId);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Project Logs</h1>
                <p className="text-sm text-gray-500">
                    Socket: {connected ? 'Connected' : 'Disconnected'}
                </p>
            </div>

            {isStaticProject && (
                <div className="bg-neutral-900 rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-2">Static Project</h2>
                    <p className="text-gray-400">
                        Runtime logs are not available for static projects.
                        {logs.length === 0 && ' Waiting for deployment logs URL...'}
                    </p>
                </div>
            )}

            <div className="bg-black text-green-400 rounded-lg p-4 h-[700px] overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                {loading ? (
                    'Connecting...'
                ) : logs.length ? (
                    logs.join('\n')
                ) : (
                    'No logs available.'
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
import express from 'express';
import { runAgentChat } from '../agent/runAgent.js';
import { clip, normalizeRecentMessages } from '../agent/contextBudget.js';

const router = express.Router();

function extractAccessToken(req) {
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (bearer) return bearer;
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/(?:^|;\s*)AccessToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

router.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy', service: 'agent-service' });
});

router.post('/chat', async (req, res) => {
    try {
        const user = req.user;
        if (!user?._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const body = req.body || {};
        let message = typeof body.message === 'string' ? body.message.trim() : '';
        let memory = typeof body.memory === 'string' ? body.memory : '';
        let recent = normalizeRecentMessages(body.recent);

        // Backward compat: old clients sending full messages[]
        if (!message && Array.isArray(body.messages) && body.messages.length) {
            const cleaned = body.messages
                .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
                .map((m) => ({ role: m.role, content: String(m.content) }));
            const lastUserIdx = [...cleaned].map((m) => m.role).lastIndexOf('user');
            if (lastUserIdx >= 0) {
                message = cleaned[lastUserIdx].content;
                recent = normalizeRecentMessages(cleaned.slice(0, lastUserIdx));
            }
        }

        if (!message) {
            return res.status(200).json({
                reply: 'Hi — how can I help with your DeployHub projects?',
                memory: '',
                toolsUsed: [],
            });
        }

        const result = await runAgentChat({
            user,
            message: clip(message, 2000),
            memory: clip(memory, 1200),
            recent,
            auth: {
                accessToken: extractAccessToken(req),
                cookie: req.headers.cookie || null,
            },
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('[agent/chat]', error);
        return res.status(500).json({ message: 'Error occurred while processing your request.' });
    }
});

export default router;

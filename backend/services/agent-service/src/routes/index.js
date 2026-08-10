import express from 'express';
import { runAgentChat } from '../agent/runAgent.js';

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

        const { messages, message } = req.body || {};
        let history = Array.isArray(messages) ? messages : [];

        if ((!history.length) && typeof message === 'string' && message.trim()) {
            history = [{ role: 'user', content: message.trim() }];
        }

        if (!history.length) {
            return res.status(200).json({
                reply: 'Hi — how can I help with your DeployHub projects?',
                toolsUsed: [],
            });
        }

        history = history
            .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
            .slice(-20)
            .map((m) => ({
                role: m.role,
                content: String(m.content).slice(0, 8000),
            }));

        const result = await runAgentChat({
            user,
            messages: history,
            auth: {
                accessToken: extractAccessToken(req),
                cookie: req.headers.cookie || null,
            },
        });
        return res.status(200).json(result);
    } catch (error) {
        console.error('[agent/chat]', error);
        const apiMessage =
            error?.error?.message ||
            error?.message ||
            'Agent failed';
        return res.status(500).json({ message: "Error occurred while processing your request." });
    }
});

export default router;

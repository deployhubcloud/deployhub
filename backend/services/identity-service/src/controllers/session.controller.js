import { listSessions, revokeAllSessions, revokeSession } from '../services/sessionManagement.service.js';

export const listSessionsController = async (req, res) => {
    try {
        const sessions = await listSessions({
            userId: req.user._id,
            currentTokenId: req.user.tokenId,
        });

        return res.status(200).json({ sessions });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || 'Internal Server Error',
        });
    }
};

export const revokeSessionController = async (req, res) => {
    try {
        await revokeSession({
            userId: req.user._id,
            tokenId: req.params.tokenId,
        });

        return res.status(200).json({ message: 'Session revoked' });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || 'Internal Server Error',
        });
    }
};

export const revokeAllSessionsController = async (req, res) => {
    try {
        await revokeAllSessions({ userId: req.user._id });

        return res.status(200).json({ message: 'All sessions revoked' });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.msg || 'Internal Server Error',
        });
    }
};

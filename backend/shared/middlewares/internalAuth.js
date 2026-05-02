export const createInternalAUthMiddleware = (options) => {

    const { secret, logger = console, header = "x-internal-secret", } = options
    return (req, res, next) => {

        const incoming = req.headers[header];

        if (!incoming || incoming !== secret) {
            logger.warn("Block internal Request")
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    }
}
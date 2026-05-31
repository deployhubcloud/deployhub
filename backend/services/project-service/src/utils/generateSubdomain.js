export const generateSubdomain = async (Project, name) => {
    let attempts = 0;
    while (attempts < 20) {
        const unique = Math.random().toString(36).substring(2, 8);
        const subdomain = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${unique}`;
        const exists = await Project.findOne({ subdomain });
        if (!exists) return subdomain;
        attempts++;
    }
    throw new Error("Could not generate unique subdomain");
};
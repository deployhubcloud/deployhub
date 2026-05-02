import { User } from "../models/user.model.js";
import sanatize from 'mongo-sanitize';

export const login = async (data) => {

    const sanatizeData = sanatize(data);

    const { email, password } = sanatizeData;

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error({
            status: 404,
            message: 'Invalid Credentails'
        })
    }


    if (user.provider !== 'local') {
        throw new Error({
            status: 400,
            message: 'This Account login with OAuth'
        })
    }

    if (user.isLocked()) {
        throw new Error({
            status: 423,
            message: 'Account temporarily locked. Try again in 15 minutes.'
        })
    }


    const verifyPassword = user.comparePassword(password);

    if (!verifyPassword) {
        await user.incrementLoginAttempts();
        throw new Error({
            status: 401,
            message: 'Invalid Credentials'
        })
    };

    await user.resetLoginAttempts();

    return user
}
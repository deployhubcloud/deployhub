import Devload from 'devload';
import { AUTH_ENV } from '../lib/env.js';
import { AppError } from '../../../../shared/errors/AppError.js';

const devload = new Devload(AUTH_ENV.DEVLOAD_API_KEY);
const projectid = AUTH_ENV.DEVLOAD_PROJECT_ID;

export const uploadOnDevload = async (filePath) => {

    try {
        const uploadResult = await devload.uploadFile(projectid, filePath)

        return uploadResult;
    } catch (error) {
        throw new AppError('upload Filed! Please Try Again Later', 500)
    }

}

export const deleteFromDevload = async (fileId) => {
    try {
        const deleteResult = await devload.deleteFile(fileId);
        console.log('File deleted:', deleteResult);
    } catch (error) {
        throw new AppError('Delete Failed', 500)
    }
}
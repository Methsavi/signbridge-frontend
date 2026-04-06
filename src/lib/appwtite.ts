/// <reference types="vite/client" />
import { Account, Client, ID } from 'appwrite';

type NormalizedUser = {
    user_id: string;
    username: string;
    email: string;
    profile_picture: string;
};

type AppwriteUserLike = {
    $id: string;
    name?: string;
    email?: string;
    prefs?: Record<string, unknown>;
};

const appwriteEndpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const appwriteProjectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!appwriteEndpoint || !appwriteProjectId) {
    throw new Error('Missing Appwrite configuration. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID in your .env file.');
}

const client = new Client()
    .setEndpoint(appwriteEndpoint)
    .setProject(appwriteProjectId);

export const account = new Account(client);

export const normalizeUser = (user: AppwriteUserLike): NormalizedUser => {
    const prefs = user.prefs || {};
    const usernamePref = typeof prefs.username === 'string' ? prefs.username : '';
    const emailPref = typeof prefs.email === 'string' ? prefs.email : '';
    const picturePref = typeof prefs.profile_picture === 'string' ? prefs.profile_picture : '';

    return {
        user_id: user.$id,
        username: usernamePref || user.name || user.email?.split('@')[0] || 'User',
        email: emailPref || user.email || '',
        profile_picture: picturePref,
    };
};

export { ID };
export default client;
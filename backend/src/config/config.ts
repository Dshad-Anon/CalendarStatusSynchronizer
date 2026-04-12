import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    databaseUrl: process.env.MongoDB_URI,
    jwtSecret: process.env.JWT_SECRET as string,
    mongoUri: process.env.MONGODB_URI,
    frontendUrl: process.env.FRONTEND_URL,
    encryption: {
        key: process.env.ENCRYPTION_KEY as string,
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        loginRedirectUri: process.env.GOOGLE_LOGIN_REDIRECT_URI,
    },
    slack: {
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        redirectUri: process.env.SLACK_REDIRECT_URI,
    }
};
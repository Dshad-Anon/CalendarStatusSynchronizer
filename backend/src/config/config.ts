import dotenv from 'dotenv';

dotenv.config();

export const config = {

    port: process.env.PORT || 5000,
    databaseUrl: process.env.MongoDB_URI,
    jwtSecret: process.env.JWT_SECRET as string,
    mongoUri: process.env.MONGODB_URI,
    frontendUrl : process.env.FRONTEND_URL,
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        loginRedirectUri: process.env.GOOGLE_LOGIN_REDIRECT_URI,
    },
    };
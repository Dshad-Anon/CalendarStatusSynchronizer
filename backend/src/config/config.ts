import dotenv from 'dotenv';

dotenv.config();

export const config = {

    port: process.env.PORT || 5000,
    databaseUrl: process.env.MongoDB_URI,
    jwtSecret: process.env.JWT_SECRET,
    };
import dotenv from 'dotenv';

dotenv.config();

const configuration = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoUri: process.env.MONGO_URI,
};

export default configuration;

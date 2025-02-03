import dotenv from 'dotenv';

dotenv.config();

const getEnvironmentValue = (variable) => process.env[variable] || null;

export default getEnvironmentValue;

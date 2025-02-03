import getEnvironmentValue from '../utils/getEnvironmentValue.js';
import getIntValue from '../utils/getIntValue.js';

const configuration = {
    env: getEnvironmentValue('NODE_ENV'),
    port: getIntValue(getEnvironmentValue('PORT')),
    mongoUri: getEnvironmentValue('MONGO_URI'),
};

export default configuration;

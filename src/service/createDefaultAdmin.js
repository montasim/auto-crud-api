import configuration from '../configuration/configuration.js';
import AdminModel from '../models/SystemAdmin.js';
import logger from '../lib/logger.js';

import createHashedPassword from '../utils/createHashedPassword.js';

const createDefaultAdmin = async () => {
    const name = configuration.system.admin.name;
    const email = configuration.system.admin.email;
    const password = configuration.system.admin.password;

    // Check if an admin user already exists using MongoDB's findOne
    const adminExists = await AdminModel.findOne({ email });
    if (!adminExists) {
        // Hash the default password (assuming createHashedPassword is compatible)
        const hashedPassword = await createHashedPassword(password);

        // Create the admin user using MongoDB's insertOne
        const result = await AdminModel.create({
            name,
            email,
            hashedPassword,
        });

        if (!result) {
            logger.info(`Default admin user created with email: ${email}`);
        } else {
            logger.error('Failed to create default admin user.'); // Handle potential failure
        }
    } else {
        logger.info(`Default admin user with email "${email}" already exists.`);
    }
};

export default createDefaultAdmin;

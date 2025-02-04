import mongoose from 'mongoose';

import logger from './logger.js';
import configuration from '../configuration/configuration.js';

const mongodbConnectionUri = configuration.database.mongodb.connectionUri;

// Function to handle reconnection logic
const handleReconnection = async () => {
    logger.warn(
        'Warning: Database connection lost. Attempting to reconnect...'
    );
    try {
        await mongoose.connect(mongodbConnectionUri);
        logger.info('Info: Database reconnected successfully.');
    } catch (error) {
        logger.error(
            `Error: Database reconnection failed. Reason: ${error.message}`
        );
    }
};

// Function to connect to the database
const connect = async () => {
    // Set up event listeners for MongoDB events.
    mongoose.connection.once('error', (error) => {
        logger.error(
            `Error: Database connection error encountered. Reason: ${error.message}`
        );
    });

    mongoose.connection.once('disconnecting', () => {
        logger.info('Info: Database is disconnecting...');
    });

    mongoose.connection.once('disconnected', handleReconnection);

    mongoose.connection.once('reconnected', () => {
        logger.info('Info: Database reconnected successfully.');
    });

    // Attempt to connect to the database.
    try {
        if (mongoose.connection.readyState === 1) {
            // @ts-ignore
            logger.info(
                `Info: Already connected to database: ${mongoose.connection.db.databaseName}`
            );
        } else {
            await mongoose.connect(mongodbConnectionUri);
            // @ts-ignore
            logger.info(
                `Info: Database connected successfully to: ${mongoose.connection.db.databaseName}`
            );
        }
    } catch (error) {
        logger.error(
            `Error: Initial database connection failed. Reason: ${error.message}`
        );
        throw error;
    }
};

// Function to disconnect from the database
const disconnect = async () => {
    try {
        logger.info('Info: Disconnecting from the database...');
        await mongoose.disconnect();
        logger.info('Info: Database disconnected successfully.');
    } catch (error) {
        logger.error(
            `Error: Database disconnection failed. Reason: ${error.message}`
        );
        throw error;
    }
};

// Function to start a new session.
const startSession = async () => {
    return mongoose.startSession();
};

// Export the MongoDB service with connect, disconnect, and startSession methods.
const mongodb = {
    connect,
    disconnect,
    startSession,
};

export default mongodb;

import mongoose from 'mongoose';

import logger from './logger.js';
import configuration from '../configuration/configuration.js';

// Function to handle reconnection logic
const handleReconnection = async () => {
    logger.warn('DATABASE DISCONNECTED! ATTEMPTING TO RECONNECT');
    try {
        await mongoose.connect(configuration.mongoUri);
        logger.info('DATABASE RECONNECTED');
    } catch (error) {
        logger.error(`RECONNECTION FAILED: ${error.message}`);
    }
};

// Function to connect to the database
const connect = async () => {
    // Set up event listeners for MongoDB
    mongoose.connection.once('error', (error) => {
        logger.error(`DATABASE ERROR: ${error.message}`);
    });

    mongoose.connection.once('disconnecting', () => {
        logger.info('DATABASE DISCONNECTING');
    });

    mongoose.connection.once('disconnected', handleReconnection);

    mongoose.connection.once('reconnected', () => {
        logger.info('DATABASE RECONNECTED SUCCESSFULLY');
    });

    // Attempt to connect to the database
    try {
        if (mongoose.connection.readyState === 1) {
            // @ts-ignore
            logger.info(
                `DATABASE ALREADY CONNECTED TO: ${mongoose.connection.db.databaseName}`
            );
        } else {
            await mongoose.connect(configuration.mongoUri);
            // @ts-ignore
            logger.info(
                `DATABASE CONNECTED SUCCESSFULLY TO: '${mongoose.connection.db.databaseName}'`
            );
        }
    } catch (error) {
        logger.error(`INITIAL CONNECTION FAILED: ${error.message}`);
        throw error;
    }
};

// Function to disconnect from the database
const disconnect = async () => {
    try {
        logger.info('DISCONNECTING DATABASE');
        await mongoose.disconnect();
        logger.info('DATABASE DISCONNECTED');
    } catch (error) {
        logger.error(`DISCONNECTION ERROR: ${error.message}`);
        throw error;
    }
};

const startSession = async () => {
    return mongoose.startSession();
};

// Export the DatabaseService with connect and disconnect methods
const mongodb = {
    connect,
    disconnect,
    startSession,
};

export default mongodb;

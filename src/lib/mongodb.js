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
        logger.info('Database reconnected successfully.');
    } catch (error) {
        logger.error(`Database reconnection failed. Reason: ${error.message}`);
    }
};

// Function to connect to the database
const connect = async () => {
    logger.debug('Initializing MongoDB connection...');

    // Set up event listeners for MongoDB events.
    mongoose.connection.on('error', (error) => {
        logger.error(
            `Error: Database connection error. Reason: ${error.message}`
        );
    });

    mongoose.connection.on('disconnecting', () => {
        logger.warn('Database is disconnecting...');
    });

    mongoose.connection.on('disconnected', handleReconnection);

    mongoose.connection.on('reconnected', () => {
        logger.info('Database successfully reconnected.');
    });

    mongoose.connection.on('connected', () => {
        logger.debug('Database connected.');
    });

    mongoose.connection.on('close', () => {
        logger.debug('Database connection closed.');
    });

    mongoose.connection.on('fullsetup', () => {
        logger.debug('Database full setup completed.');
    });

    mongoose.connection.on('all', () => {
        logger.debug('MongoDB replica set is in sync.');
    });

    mongoose.connection.on('reconnectFailed', () => {
        logger.debug('MongoDB failed to reconnect.');
    });

    // Attempt to connect to the database.
    try {
        if (mongoose.connection.readyState === 1) {
            // @ts-ignore
            logger.info(
                `Already connected to database: ${mongoose.connection.db.databaseName}`
            );
        } else {
            await mongoose.connect(mongodbConnectionUri);
            // @ts-ignore
            logger.info(
                `Database connected successfully to: ${mongoose.connection.db.databaseName}`
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
        logger.info('Disconnecting from the database...');
        await mongoose.disconnect();
        logger.info('Database disconnected successfully.');
    } catch (error) {
        logger.error(`Database disconnection failed. Reason: ${error.message}`);
        throw error;
    }
};

// Function to start a new session.
const startSession = async () => {
    try {
        logger.debug('Starting a new MongoDB session...');
        return mongoose.startSession();
    } catch (error) {
        logger.error(
            `Failed to start MongoDB session. Reason: ${error.message}`
        );
        throw error;
    }
};

// Export the MongoDB service with connect, disconnect, and startSession methods.
const mongodb = {
    connect,
    disconnect,
    startSession,
};

export default mongodb;

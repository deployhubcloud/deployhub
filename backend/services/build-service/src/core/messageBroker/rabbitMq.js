import amqp from 'amqplib';
import { buildEnv } from '../../lib/env.js';

const RABBITMQ_URL = buildEnv.RABBITMQ_URL || 'amqp://localhost';
let channel = null;
let connection = null;
let reconnectTimer = null;
let isShuttingDown = false;

const scheduleReconnect = () => {
    if (isShuttingDown || reconnectTimer) {
        return;
    }

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        await initRabbitMQ({ retryOnFailure: true });
    }, 5000);
};

// Initialize RabbitMQ connection
const initRabbitMQ = async ({ retryOnFailure = false } = {}) => {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        isShuttingDown = false;

        console.log('RabbitMQ connected successfully');

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            channel = null;
            connection = null;

            if (isShuttingDown) {
                return;
            }

            console.log('RabbitMQ connection closed. Reconnecting...');
            scheduleReconnect();
        });

    } catch (error) {
        console.error('RabbitMQ connection error:', error);

        if (retryOnFailure) {
            scheduleReconnect();
            return;
        }

        throw error;
    }
};

// Get channel
const getChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized. Call initRabbitMQ() first.');
    }
    return channel;
};

// Send message to queue
const sendToQueue = async (queueName, data) => {
    try {
        const ch = getChannel();
        const message = JSON.stringify(data);

        ch.sendToQueue(queueName, Buffer.from(message), {
            persistent: true
        });

        console.log(`Message sent to queue: ${queueName}`);
        return true;
    } catch (error) {
        console.error(`Error sending message to ${queueName}:`, error);
        throw error;
    }
};

// Close connection
const closeRabbitMQ = async () => {
    try {
        isShuttingDown = true;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        if (channel) await channel.close();
        if (connection) await connection.close();
        console.log('RabbitMQ connection closed');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
};

export {
    initRabbitMQ,
    getChannel,
    sendToQueue,
    closeRabbitMQ
};

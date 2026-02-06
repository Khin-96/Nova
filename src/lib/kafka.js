const { Kafka } = require('kafkajs');

const brokers = (process.env.KAFKA_BROKERS || process.env.RED_PANDA_BROKERS || process.env.REDPANDA_BROKERS || '')
    .split(',')
    .map(b => b.trim())
    .filter(Boolean);
const username = process.env.KAFKA_USERNAME || process.env.RED_PANDA_USER || process.env.KAFKA_USER_KHIN;
const password = process.env.KAFKA_PASSWORD || process.env.RED_PANDA_SECRET || process.env.KAFKA_PASSWORD_KHIN;
const saslMechanism = (process.env.KAFKA_SASL_MECHANISM || process.env.RED_PANDA_SASL_MECHANISM
    || (process.env.RED_PANDA_USER || process.env.RED_PANDA_SECRET ? 'scram-sha-256' : 'plain'))
    .toLowerCase();

// Initialize Kafka client (Redpanda is Kafka-compatible)
const kafka = new Kafka({
    clientId: 'nova-wear-backend',
    brokers,
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: username ? {
        mechanism: saslMechanism,
        username,
        password,
    } : undefined,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'nova-wear-analytics-group' });

let isProducerConnected = false;

// Connect Producer
async function connectProducer() {
    try {
        if (!brokers.length) {
            console.warn('KAFKA_BROKERS/RED_PANDA_BROKERS not set. Kafka producer disabled.');
            return;
        }
        await producer.connect();
        isProducerConnected = true;
        console.log('Kafka Producer connected');
    } catch (error) {
        console.error('Error connecting Kafka Producer:', error);
    }
}

function getKafkaHealth() {
    return {
        brokersConfigured: brokers.length > 0,
        sslEnabled: process.env.KAFKA_SSL === 'true',
        saslEnabled: Boolean(username),
        saslMechanism,
        producerConnected: isProducerConnected,
    };
}

// Send Event
async function sendEvent(topic, data) {
    if (!isProducerConnected) {
        // console.warn('Kafka producer not connected. Skipping event.');
        return;
    }
    try {
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(data) },
            ],
        });
    } catch (error) {
        console.error(`Error sending event to ${topic}:`, error);
    }
}

// Connect Consumer
async function connectConsumer(topic, handler) {
    try {
        if (!brokers.length) return;

        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const value = message.value.toString();
                try {
                    const parsed = JSON.parse(value);
                    await handler(parsed);
                } catch (e) {
                    console.error('Error handling Kafka message:', e);
                }
            },
        });
        console.log(`Kafka Consumer subscribed to ${topic}`);
    } catch (error) {
        console.error('Error connecting Kafka Consumer:', error);
    }
}

module.exports = { connectProducer, sendEvent, connectConsumer, getKafkaHealth };

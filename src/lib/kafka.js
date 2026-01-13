const { Kafka } = require('kafkajs');

// Initialize Kafka client
const kafka = new Kafka({
    clientId: 'nova-wear-backend',
    brokers: (process.env.KAFKA_BROKERS || '').split(','),
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: process.env.KAFKA_USERNAME ? {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
    } : undefined,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'nova-wear-analytics-group' });

let isProducerConnected = false;

// Connect Producer
async function connectProducer() {
    try {
        if (!process.env.KAFKA_BROKERS) {
            console.warn('KAFKA_BROKERS not set. Kafka producer disabled.');
            return;
        }
        await producer.connect();
        isProducerConnected = true;
        console.log('Kafka Producer connected');
    } catch (error) {
        console.error('Error connecting Kafka Producer:', error);
    }
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
        if (!process.env.KAFKA_BROKERS) return;

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

module.exports = { connectProducer, sendEvent, connectConsumer };

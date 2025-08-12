import amqp from 'amqplib';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RABBITMQ_URL = 'amqps://zoosdhlt:z_0FO4vS9miKjNUpAn9ePbKi8Lyo-j-X@puffin.rmq2.cloudamqp.com/zoosdhlt';
const QUEUE = 'image_download_queue';
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

const startConsumer = async () => {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });

    channel.prefetch(1);
    console.log('Waiting for messages...');

    channel.consume(QUEUE, async (msg) => {
        if (msg) {
            const imageUrl = msg.content.toString();
            console.log('Downloading:', imageUrl);

            try {
                const response = await fetch(imageUrl);
                if (!response.ok) throw new Error(`Failed to fetch ${imageUrl}`);

                const urlPath = new URL(imageUrl).pathname;
                const ext = path.extname(urlPath) || '.jpg';
                const fileName = `${Date.now()}${ext}`;
                const filePath = path.join(DOWNLOAD_DIR, fileName);

                const dest = fs.createWriteStream(filePath);
                response.body.pipe(dest);

                dest.on('finish', () => {
                    console.log('Downloaded:', fileName);
                    channel.ack(msg);
                });

                dest.on('error', (err) => {
                    console.error('Download error:', err);
                    channel.nack(msg, false, false);
                });
            } catch (error) {
                console.error('Error:', error.message);
                channel.nack(msg, false, false);
            }
        }
    }, { noAck: false });
};

startConsumer().catch(console.error);

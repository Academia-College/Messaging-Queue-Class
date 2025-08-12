import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csvParser from 'csv-parser';
import amqp from 'amqplib';
import fs from 'fs';

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

const RABBITMQ_URL = 'amqps://chhmhspw:MOxcsavvfTNkTancEqFdnXzAo8J4SH1k@puffin.rmq2.cloudamqp.com/chhmhspw';
const QUEUE = 'image_download_queue';

let channel;

async function setupRabbitMQ() {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
}

await setupRabbitMQ();

app.post('/api/upload', upload.single('csvfile'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => {
            if (row.imageUrl) {
                channel.sendToQueue(QUEUE, Buffer.from(row.imageUrl), { persistent: true });
            }
        })
        .on('end', () => {
            fs.unlinkSync(req.file.path);
            res.json({ message: 'CSV processed and queued successfully' });
        });
});

app.listen(4000, () => {
    console.log('Express server running on http://localhost:4000');
});

import { config } from 'dotenv';
import { connection } from 'mongoose';
import { app } from './app';
import { connectToMongodDb } from './config/db';
import CandleMessageChannel from './messages/candle-message-channel';

async function createServer() {
    config();

    await connectToMongodDb();
    const PORT = process.env.PORT;
    const server = app.listen(PORT, () => console.log('App running on port ', PORT));
    const candleMsgChannel = new CandleMessageChannel(server);
    candleMsgChannel.consumeMessages();

    process.on('SIGINT', async () => {
        await connection.close();
        server.close();
        console.log('Server and connection closed');
    })
}

createServer();

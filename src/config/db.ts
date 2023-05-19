import { connect } from 'mongoose';
import { config } from 'dotenv';

export async function connectToMongodDb(): Promise<void> {
    config();
    await connect(process.env.MONGODB_CONNECTION_URL);
}
import { Channel, connect } from "amqplib";
import { config } from "dotenv";
import CandleController from "../controllers/candle-controller";
import * as http from 'http';
import { Server } from "socket.io";
import { Candle } from "../models/candle-model";

config();

export default class CandleMessageChannel {

    private _channel: Channel;
    private _candleCtrl: CandleController;
    private _io: Server;

    constructor(server: http.Server) {
        this._candleCtrl = new CandleController();
        this._io = new Server(server, {
            cors: {
                origin: process.env.SOCKET_CLIENT_SERVER,
                methods: ["GET", "POST"]
            }
        })
        this._io.on('connection', () => console.log("Web socket connection created"));
    }

    private async createMessageChannel() {
        try {
            const connection = await connect(process.env.AMQP_SERVER);
            this._channel = await connection.createChannel();
            this._channel.assertQueue(process.env.QUEUE_NAME);
        } catch (error) {
            console.log('Connection error: ', error)
        }
    }

    async consumeMessages() {
        await this.createMessageChannel();
        if (this._channel) {
            this._channel.consume(process.env.QUEUE_NAME, async msg => {
                const candleObj = JSON.parse(msg.content.toString());
                console.log('Message received: ', candleObj);
                this._channel.ack(msg);

                const candle: Candle = candleObj;
                await this._candleCtrl.save(candle);
                console.log('Candle saved to database');
                this._io.emit(process.env.SOCKET_EVENT_NAME, candle);
                console.log('new candle emitted by websocket');
            })
            console.log('Candle consumer started');
        }
    }
}
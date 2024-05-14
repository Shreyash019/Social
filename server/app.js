// Module Imports
import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: "./config/.env" });
import http from 'http'
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fileUpload from "express-fileupload";
import errorMiddleware from "./error/error.js";
import { Server as SocketIOServer } from 'socket.io';
import apiTable from './routes/APITable.js';
// Configurations
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));


app.use('/api/v1', apiTable)
app.use(errorMiddleware);


// Create an HTTP server
const appInstance = http.createServer(app); // Assuming you have an Express app instance

// Create a Socket.IO server attached to the HTTP server
const io = new SocketIOServer(appInstance);
// const appInstance = http.createServer(app);
// const io = socket(appInstance);

io.on("connection", (socket) => {
  console.log("user connected...");
  socketConnection(io, socket);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

export default appInstance;

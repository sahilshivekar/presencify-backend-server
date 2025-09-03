import dotenv from "dotenv"
dotenv.config({ path: './.env' })
import app from "./app.js"
import http from 'http';
import { initSocket } from "./socket/index.js";
import { config } from './config/config.js'

const port = config.port || 8000;

const server = http.createServer(app)  // returns a server and give access to it
initSocket(server) // we attach the socket server with our http server


server.listen(port, '0.0.0.0', () => {
    // this don't create a server internally and then listen but rather 
    // listen on already created server instance
    console.log(`Server is running at port: ${port}`);
});
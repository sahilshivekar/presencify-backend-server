import dotenv from "dotenv"
import app from "./app.js"
dotenv.config({ path: './.env' })
import https from 'https';
import http from 'http';
import { initSocket } from "./socket/index.js";
const port = process.env.PORT || 8000;


// for stoping the server instance on render to go down with inactivity
// app.get("/api/v1/self-ping", async (req, res) => {
//     res.status(200).send(null);
// })

// setInterval(() => {
//     https.get(process.env.SERVER_ADDRESS + "/api/v1/self-ping", (res) => {
//         console.log("Self-ping: ", res.statusCode)
//     }).on('error', (err) => {
//         console.log("Error during self-ping: ", err.message)
//     })
// }, 1000 * 60 * 3) // 3 minutes

//! when we do app.listen it directly returns us a http server internally but doesn't allow us to access it to attach web sockets
//! hence we will use another way with https.createServer which will return us a server and then we will call listne on it 
// app.listen(port, '0.0.0.0', () => {
//     console.log(`Server is running at port: ${port}`);
// });


const server = http.createServer(app)  // returns a server and give access to it
initSocket(server) // we attach the socket server with our http server


server.listen(port, '0.0.0.0', () => { 
    // this don't create a server internally and then listen but rather 
    // listen on already created server instance
    console.log(`Server is running at port: ${port}`);
});
import dotenv from "dotenv"
import { app } from "./app.js"
import { connectDB } from "./db/db.js"


dotenv.config({
    path: './.env'
})


const startServer = async () => {
    try {
        await connectDB();

        const port = process.env.PORT || 8000;
        
        app.listen(port, () => {
            console.log(`Server is running at port: ${port}`);
        });

    } catch (error) {
        console.error(`Server initialization failed: ${error.message}`);
        process.exit(1);
    }
};

startServer();
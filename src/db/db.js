import pg from "pg";


const client = new pg.Client({
    user: "postgres",
    host: "localhost", 
    database: "wiet_testing", 
    password: "TBAB@124", 
    port: 5432, 
});


const connectDB = async () => {
    try {
        await client.connect();
        console.log(`POSTGRESQL CONNECTION SUCCESSFUL`)
    } catch (error) {
        console.log(`POSTGRESQL CONNECTION FAILED: ${error.message}`)
        process.exit(1)
    }
}

export { client, connectDB }
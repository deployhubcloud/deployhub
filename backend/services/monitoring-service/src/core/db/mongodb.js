import mongoose from "mongoose";

mongoose.set("strictQuery", true);

export const monitoringDbConnect = async () => {
    try {

        await mongoose.connect(process.env.MONITORING_MONGODB_URI, {
            maxPoolSize: 20,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        })

        mongoose.connection.on("error", (err) => {
            throw new Error("Error connecting to Monitoring DB: " + err.message);
        })

        mongoose.connection.on("connected", () => {
            console.log("Connected to Monitoring DB");
        })

        mongoose.connection.on("disconnected", () => {
            console.warn("Monitoring DB disconnected");
        })

    } catch (error) {
        throw new Error("Error connecting to Monitoring DB: " + error.message);
        process.exit(1);
    }
}


export const monitoringDbClose = async () => {
    await mongoose.connection.close();
    console.log("Monitoring DB connection closed");
}


import mongoose from "mongoose";
import { AUTH_ENV } from "../../lib/env.js";

mongoose.set("strictQuery", true);

export const connectDb = async () => {
    try {
        await mongoose.connect(AUTH_ENV.MONGODB_URI, {
            maxPoolSize: 20,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });

        console.log("MongoDB Connected");

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected");
        });

    } catch (error) {
        console.error("Error connecting to DB:", error.message);
        process.exit(1);
    }
};


process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
});
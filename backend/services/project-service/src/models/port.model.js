import mongoose from 'mongoose';

const PortSchema = new mongoose.Schema({

    port: {
        type: Number,
        required: true,
        unique: true
    }

}, {
    timestamps: true
});

export const Port = mongoose.model("Port", PortSchema)


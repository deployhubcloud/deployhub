import mongoose from "mongoose";

const uptimeLogSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        enum: ['up', 'down'],
        required: true
    },
    responseTime: {
        type: Number
    },
    checkedAt: {
        type: Date,
    },
    statusCode: {
        type: Number
    }
})

export const UptimeLog = mongoose.model('UptimeLog', uptimeLogSchema);
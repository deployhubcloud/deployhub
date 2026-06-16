import mongoose from 'mongoose';

const uptimeSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    interval: {
        type: Number,
        required: true
    },
    lastDownAt: {
        type: Date
    },
    uptimePercentage: {
        type: Number
    },
    failedTries: {
        type: Number,
        default: 0
    },
    intervalSeconds: {
        type: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const Uptime = mongoose.model('Uptime', uptimeSchema);

export default Uptime;
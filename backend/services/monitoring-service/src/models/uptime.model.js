import mongoose from 'mongoose';

const uptimeSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['up', 'down'],
        required: true
    },
    lastChecked: {
        type: Date
    },
    lastDownAt: {
        type: Date
    },
    uptimePercentage: {
        type: Number
    },
    failCount: {
        type: Number,
        default: 0
    },
    alertSent: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const Uptime = mongoose.model('Uptime', uptimeSchema);

export default Uptime;
import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for now as scan might be public/anonymous
    },
    imageBase64: {
        type: String,
        required: true
    },
    imageMimeType: {
        type: String,
        default: 'image/jpeg'
    },
    analysis: {
        type: Object, // Store the full JSON analysis result
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
scanHistorySchema.index({ createdAt: -1 });
scanHistorySchema.index({ userId: 1 });

const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);

export default ScanHistory;

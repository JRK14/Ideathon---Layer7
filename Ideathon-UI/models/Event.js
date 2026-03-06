const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    date: {
        type: String, // Stored as YYYY-MM-DD
        required: true
    },
    start: {
        type: String, // HH:mm
    },
    end: {
        type: String, // HH:mm
    },
    allDay: {
        type: Boolean,
        default: false
    },
    colorCls: {
        type: String,
        default: 'blue-star'
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);

// models/Trip.js
const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['completed', 'missed', 'cancelled'], default: 'completed' }
});

module.exports = mongoose.model('Trip', TripSchema);

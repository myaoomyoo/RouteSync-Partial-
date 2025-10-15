const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  direction: { type: String, enum: ['coming', 'leaving'], required: true },
  time: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'assigned', 'completed'], default: 'pending' },
});

module.exports = mongoose.model('Booking', BookingSchema);
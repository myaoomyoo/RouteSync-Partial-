const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'driver', 'operator'], required: true },
  isActive: { type: Boolean, default: false },
  // Student-specific
  location: String,
  // Driver-specific
  carName: String,
  capacity: Number,
});

module.exports = mongoose.model('User', UserSchema);



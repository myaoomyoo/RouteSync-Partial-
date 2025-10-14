const Trip = require('../models/Trip');

// ---------- Student Dashboard API ---------- //
exports.getStudentTravelHistory = async (req, res) => {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const trips = await Trip.find({
    studentId: req.user._id,
    date: { $gte: lastWeek, $lte: today }
  });

  const counts = Array(7).fill(0);
  trips.forEach(trip => {
    const dayIndex = 6 - Math.floor((today - trip.date) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) counts[dayIndex]++;
  });

  res.json({ data: counts });
};

exports.getStudentAttendance = async (req, res) => {
  const trips = await Trip.find({ studentId: req.user._id });

  let present = 0, late = 0, absent = 0;

  trips.forEach(trip => {
    if (trip.status === 'completed') present++;
    else if (trip.status === 'late') late++;
    else if (trip.status === 'absent') absent++;
  });

  res.json({ present, late, absent });
};

// ---------- Driver Dashboard API ---------- //
exports.getDriverTripHistory = async (req, res) => {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const trips = await Trip.find({
    driverId: req.user._id,
    date: { $gte: lastWeek, $lte: today }
  });

  const counts = Array(7).fill(0);
  trips.forEach(trip => {
    const dayIndex = 6 - Math.floor((today - trip.date) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) counts[dayIndex]++;
  });

  res.json({ data: counts });
};

exports.getDriverStatusSummary = async (req, res) => {
  const trips = await Trip.find({ driverId: req.user._id });

  let completed = 0, delayed = 0, cancelled = 0;

  trips.forEach(trip => {
    if (trip.status === 'completed') completed++;
    else if (trip.status === 'late') delayed++;
    else if (trip.status === 'cancelled') cancelled++;
  });

  res.json({ completed, delayed, cancelled });
};

// ---------- Operator Dashboard API ---------- //
exports.getOperatorDailyTrips = async (req, res) => {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const trips = await Trip.find({
    date: { $gte: lastWeek, $lte: today }
  });

  const counts = Array(7).fill(0);
  trips.forEach(trip => {
    const dayIndex = 6 - Math.floor((today - trip.date) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) counts[dayIndex]++;
  });

  res.json({ data: counts });
};

exports.getOperatorStatusSummary = async (req, res) => {
  const trips = await Trip.find();

  let completed = 0, late = 0, absent = 0;

  trips.forEach(trip => {
    if (trip.status === 'completed') completed++;
    else if (trip.status === 'late') late++;
    else if (trip.status === 'absent') absent++;
  });

  res.json({ completed, late, absent });
};
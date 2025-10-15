const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const { io } = require('../server');

// @route   GET /api/dashboard-data
// @desc    Get all data needed for the operator dashboard
router.get('/dashboard-data', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const drivers = await User.find({ role: 'driver' }).select('-password');
    const bookings = await Booking.find({ date: { $gte: new Date().setHours(0, 0, 0, 0) } }); // Today's bookings
    res.json({ students, drivers, bookings });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/bookings/new
// @desc    Create a new booking
router.post('/bookings/new', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: 'Not authorized' });
  }

  const { direction, time } = req.body;

  try {
    const newBooking = new Booking({
      studentId: req.session.userId,
      direction,
      time,
    });

    await newBooking.save();

    const student = await User.findById(req.session.userId).select('name location');

    // Notify operator dashboard
    io.emit('new-booking', { booking: newBooking, student });

    res.status(201).json(newBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/pools/assign-driver
// @desc    Assign a driver to a pool of students
router.post('/pools/assign-driver', async (req, res) => {
  const { driverId, time, location } = req.body;

  try {
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ success: false, msg: 'Driver not found' });
    }

    // Find all unassigned bookings for this pool
    const bookings = await Booking.find({ time, location, status: 'pending' });

    // Randomly select students up to the driver's capacity
    const assignedBookings = [];
    const shuffled = bookings.sort(() => 0.5 - Math.random());
    const studentsToAssign = shuffled.slice(0, driver.capacity);

    for (const booking of studentsToAssign) {
      booking.driverId = driverId;
      booking.status = 'assigned';
      await booking.save();
      assignedBookings.push(booking);

      // Notify the student
      io.to(booking.studentId.toString()).emit('driver-assigned', {
        driver: { name: driver.name, carName: driver.carName },
        time: booking.time,
      });
    }

    // Notify the driver
    const assignedStudents = await User.find({ '_id': { $in: assignedBookings.map(b => b.studentId) } });
    io.to(driverId).emit('new-assignment', { students: assignedStudents });

    // Notify the operator dashboard to update the UI
    io.emit('pool-updated', { time, location, driverId, assignedStudentIds: assignedStudents.map(s => s._id) });

    res.json({ success: true, assignedBookings });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
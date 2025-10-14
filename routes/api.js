const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Student Dashboard API
router.get('/student/travel-history', isAuthenticated, hasRole(['student']), apiController.getStudentTravelHistory);
router.get('/student/attendance', isAuthenticated, hasRole(['student']), apiController.getStudentAttendance);

// Driver Dashboard API
router.get('/driver/trip-history', isAuthenticated, hasRole(['driver']), apiController.getDriverTripHistory);
router.get('/driver/status-summary', isAuthenticated, hasRole(['driver']), apiController.getDriverStatusSummary);

// Operator Dashboard API
router.get('/operator/daily-trips', isAuthenticated, hasRole(['operator']), apiController.getOperatorDailyTrips);
router.get('/operator/status-summary', isAuthenticated, hasRole(['operator']), apiController.getOperatorStatusSummary);

module.exports = router;
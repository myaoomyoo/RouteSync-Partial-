const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Dashboard Views
router.get('/student', dashboardController.getStudentDashboard);
router.get('/driver', dashboardController.getDriverDashboard);
router.get('/operator', dashboardController.getOperatorDashboard);

module.exports = router;
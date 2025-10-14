const User = require('../models/User');

exports.getStudentDashboard = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'student') return res.redirect('/login');
  res.render('dashboard-student', { user });
};

exports.getDriverDashboard = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'driver') return res.redirect('/login');
  res.render('dashboard-driver', { user });
};

exports.getOperatorDashboard = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'operator') return res.redirect('/login');
  res.render('dashboard-operator', { user });
};
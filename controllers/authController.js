const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getSignup = (req, res) => {
  res.render('signup');
};

exports.postSignup = async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).send('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashedPassword, role });
  await newUser.save();

  res.status(201).send('User created');
};

exports.getLogin = (req, res) => {
  res.render('login');
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('login', { error: 'Invalid credentials' });
  }

  req.session.userId = user._id;

  switch (user.role) {
    case 'student': return res.redirect('/dashboard/student');
    case 'driver': return res.redirect('/dashboard/driver');
    case 'operator': return res.redirect('/dashboard/operator');
    default: return res.redirect('/dashboard');
  }
};

exports.getLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.redirect('/dashboard');
    res.redirect('/login');
  });
};
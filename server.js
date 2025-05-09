const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config(); // Load environment variables

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Schemas and Models
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'driver', 'operator'], required: true },
});

const User = mongoose.model('User', UserSchema);
const Trip = require('./models/Trip'); // Only keep this line at the top

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).send('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashedPassword, role });
  await newUser.save();

  res.status(201).send('User created');
});

// Login Route
app.post('/login', async (req, res) => {
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
});

// Auth Views
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

// Dashboard Views
app.get('/dashboard/student', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'student') return res.redirect('/login');
  res.render('dashboard-student', { user });
});

app.get('/dashboard/driver', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'driver') return res.redirect('/login');
  res.render('dashboard-driver', { user });
});

app.get('/dashboard/operator', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'operator') return res.redirect('/login');
  res.render('dashboard-operator', { user });
});

// ---------- Student Dashboard API ---------- //
app.get('/api/student/travel-history', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'student') return res.status(403).send('Forbidden');

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const trips = await Trip.find({
    studentId: user._id,
    date: { $gte: lastWeek, $lte: today }
  });

  const counts = Array(7).fill(0);
  trips.forEach(trip => {
    const dayIndex = 6 - Math.floor((today - trip.date) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) counts[dayIndex]++;
  });

  res.json({ data: counts });
});

app.get('/api/student/attendance', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'student') return res.status(403).send('Forbidden');

  const trips = await Trip.find({ studentId: user._id });

  let present = 0, late = 0, absent = 0;

  trips.forEach(trip => {
    if (trip.status === 'completed') present++;
    else if (trip.status === 'late') late++;
    else if (trip.status === 'absent') absent++;
  });

  res.json({ present, late, absent });
});

// ---------- Driver Dashboard API ---------- //
app.get('/api/driver/trip-history', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'driver') return res.status(403).send('Forbidden');

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const trips = await Trip.find({
    driverId: user._id,
    date: { $gte: lastWeek, $lte: today }
  });

  const counts = Array(7).fill(0);
  trips.forEach(trip => {
    const dayIndex = 6 - Math.floor((today - trip.date) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) counts[dayIndex]++;
  });

  res.json({ data: counts });
});

app.get('/api/driver/status-summary', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'driver') return res.status(403).send('Forbidden');

  const trips = await Trip.find({ driverId: user._id });

  let completed = 0, delayed = 0, cancelled = 0;

  trips.forEach(trip => {
    if (trip.status === 'completed') completed++;
    else if (trip.status === 'late') delayed++;
    else if (trip.status === 'cancelled') cancelled++;
  });

  res.json({ completed, delayed, cancelled });
});

// ---------- Operator Dashboard API ---------- //
app.get('/api/operator/daily-trips', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'operator') return res.status(403).send('Forbidden');

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
});

app.get('/api/operator/status-summary', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const user = await User.findById(req.session.userId);
  if (user.role !== 'operator') return res.status(403).send('Forbidden');

  const trips = await Trip.find();

  let completed = 0, late = 0, absent = 0;

  trips.forEach(trip => {
    if (trip.status === 'completed') completed++;
    else if (trip.status === 'late') late++;
    else if (trip.status === 'absent') absent++;
  });

  res.json({ completed, late, absent });
});

// ---------- Logout ---------- //
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.redirect('/dashboard');
    res.redirect('/login');
  });
});

// ---------- Server ---------- //
app.listen(3001, () => {
  console.log(`Server running on http://localhost:${3001}`);
});

const express = require('express');
const mongoose = require('mongoose');
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
if (!process.env.SESSION_SECRET) {
  throw new Error('FATAL ERROR: SESSION_SECRET is not defined.');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
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

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.render('index');
});

// ---------- Server ---------- //
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const User = require('./models/User');

// Export io for use in other modules
module.exports.io = io;

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (!userId) return socket.disconnect();

  console.log(`User connected: ${userId}`);
  socket.join(userId); // Join a room for this user

  User.findByIdAndUpdate(userId, { isActive: true }, { new: true }).exec();
  io.emit('user-status-change', { userId, isActive: true });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    User.findByIdAndUpdate(userId, { isActive: false }, { new: true }).exec();
    io.emit('user-status-change', { userId, isActive: false });
  });
});

server.listen(3001, () => {
  console.log(`Server running on http://localhost:${3001}`);
});
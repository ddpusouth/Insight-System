require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startScheduler } = require('./utils/scheduler');
const { testEmailConfig } = require('./utils/emailService');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/infrastructure', require('./routes/infrastructure'));
app.use('/api/college-dashboard', require('./routes/collegeDashboard'));
app.use('/api/ddpu-dashboard', require('./routes/ddpuDashboard'));
app.use('/api/contactus', require('./routes/contactus'));
app.use('/api', require('./routes/register'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/documents', require('./routes/documents'));

// Static Files
app.use('/uploads', express.static('uploads'));
app.use('/uploads/infrastructure', express.static('uploads/infrastructure'));

// Socket.IO Setup
const http = require('http').createServer(app);
const { Server } = require('socket.io');

const io = new Server(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Import routes with socket support
const chatRoutes = require('./routes/chat');
const queriesRoutes = require('./routes/queries');
const circularsRoutes = require('./routes/circulars');
const notificationsRoutes = require('./routes/notifications');

// Set io instance for routes
chatRoutes.setIO(io);
queriesRoutes.setIO(io);
circularsRoutes.setIO(io);
notificationsRoutes.setIO(io);

// API Routes with socket support
app.use('/api/chat', chatRoutes.router);
app.use('/api/queries', queriesRoutes.router);
app.use('/api/circulars', circularsRoutes.router);
app.use('/api/notifications', notificationsRoutes.router);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join college room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('group message', (msg) => {
    io.emit('group message', msg);
  });

  socket.on('query message', (msg) => {
    io.emit('query message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Test email configuration on startup
testEmailConfig().then(isValid => {
  if (isValid) {
    console.log('[Server] Email service is configured correctly');
  } else {
    console.log('[Server] Email service configuration failed - check your .env file');
  }
});

// Start email scheduler
startScheduler();

// Start Server
const PORT = process.env.PORT || 5001;
http.listen(PORT, () => console.log(`Server started on port ${PORT}`));

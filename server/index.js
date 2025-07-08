const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');
const { startReminderService } = require('./services/sms');
const serviceRoutes = require('./routes/services');
const customerRoutes = require('./routes/customers');
const mechanicRoutes = require('./routes/mechanics');
const qrRoutes = require('./routes/qr');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (QR codes, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database and start SMS service
initializeDatabase().then(() => {
  console.log('Database initialized successfully');
  
  // Start SMS reminder service
  startReminderService();
  
}).catch(err => {
  console.error('Database initialization failed:', err);
});

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
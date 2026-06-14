require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const statsRoutes = require('./routes/statsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cronRoutes = require('./routes/cronRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,      // URL Vercel (set di Railway env vars)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (debug)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cron', cronRoutes);
// Root & health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'E-Arsip Backend API', version: '1.0.0', docs: '/api/health' });
});
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'E-Arsip Backend API', version: '1.0.0' });
});
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'E-Arsip API berjalan.', timestamp: new Date().toISOString() });
});

// 404 handler — harus sebelum error handler
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl} — tidak ditemukan`);
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// Global error handler — harus paling bawah
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 E-Arsip Backend berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;

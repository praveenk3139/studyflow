const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db');

const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const pdfRoutes = require('./routes/pdf');
const qpRoutes = require('./routes/questionPapers');
const impQRoutes = require('./routes/importantQuestions');
const testRoutes = require('./routes/tests');
const plannerRoutes = require('./routes/planner');
const focusRoutes = require('./routes/focus');
const wellnessRoutes = require('./routes/wellness');
const mindBreakRoutes = require('./routes/mindBreak');
const socialRoutes = require('./routes/social');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const funCheckupRoutes = require('./routes/funCheckup');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database & Seed
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static files
const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(__dirname, '..', 'uploads');

app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/question-papers', qpRoutes);
app.use('/api/important-questions', impQRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/mind-break', mindBreakRoutes);
app.use('/api/fun-checkup', funCheckupRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'online',
    app: 'StudyFlow AI',
    version: '1.0.0',
    tagline: 'Study smarter. Stay focused. Stay healthy.',
    timestamp: new Date().toISOString()
  });
});

// Single Page Application Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error caught:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal error occurred on the server'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 StudyFlow AI Server running at http://localhost:${PORT}`);
    console.log(`📚 "Study smarter. Stay focused. Stay healthy."`);
    console.log(`=======================================================`);
  });
}

module.exports = app;

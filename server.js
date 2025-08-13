require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const zscoreRoutes = require('./src/routes/zscoreRoutes');

// Middleware for JSON (if needed later)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use Zscore routes
// Limit repeated calls to /zscore/* from same IP
const zscoreLimiter = rateLimit({
    // windowMs: 10 * 1000, // 10 seconds
    windowMs: 2 * 1000, // 10 seconds
    max: 1, // limit each IP to 1 request per windowMs
    message: { error: 'Too many requests. Try again in a few seconds.' },
});
  
app.use('/zscore', zscoreLimiter); // Protect zscore route
app.use(zscoreRoutes);

// 404 handler (custom HTML page)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'src', 'views', '404.html'));
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

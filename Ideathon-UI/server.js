const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  // Options for newer Mongoose versions don't need useNewUrlParser/useUnifiedTopology
})
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Serve static frontend from 'public' directory
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

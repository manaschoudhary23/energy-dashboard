require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const energyRoutes = require('./routes/energy');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/energyDB';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/energy', energyRoutes);

app.get('/', (req,res) => res.send('Smart Energy API running'));

app.listen(PORT, () => console.log(`Server running at http://127.0.0.1:${PORT}`));

const mongoose = require('mongoose');

const energySchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  consumption_kWh: { type: Number, required: true }
});

module.exports = mongoose.model('EnergyReading', energySchema);

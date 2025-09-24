const express = require('express');
const router = express.Router();
const EnergyReading = require('../models/EnergyReading');

let THRESHOLD = 1.5;

router.post('/', async (req, res) => {
  try {
    const entry = new EnergyReading(req.body);
    await entry.save();

    const last5 = await EnergyReading.find({ user_id: req.body.user_id })
      .sort({ timestamp: -1 })
      .limit(5);

    const avg = last5.reduce((a, b) => a + b.consumption_kWh, 0) / last5.length;

    if (req.body.consumption_kWh > avg * 1.5) {
      console.log(`⚠️ Anomaly detected: ${req.body.consumption_kWh} kWh at ${req.body.timestamp}`);
    }

    res.status(201).json({ message: 'Reading added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:user_id', async (req, res) => {
  try {
    const readings = await EnergyReading.find({ user_id: req.params.user_id }).sort({ timestamp: 1 });
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/aggregate/daily/:user_id', async (req, res) => {
  try {
    const userId = Number(req.params.user_id);
    const results = await EnergyReading.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: { year: { $year: "$timestamp" }, month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" } },
          totalKWh: { $sum: "$consumption_kWh" },
          avgKWh: { $avg: "$consumption_kWh" },
          maxKWh: { $max: "$consumption_kWh" },
          minKWh: { $min: "$consumption_kWh" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/forecast/:user_id', async (req, res) => {
  try {
    const readings = await EnergyReading.find({ user_id: req.params.user_id }).sort({ timestamp: 1 });
    const last3 = readings.slice(-3).map(r => r.consumption_kWh);
    if (last3.length < 3) return res.json([]);

    const weights = [0.5, 0.3, 0.2];
    const forecastValue = last3.reduce((sum, val, idx) => sum + val * weights[idx], 0);
    const forecast = Array(5).fill(Number(forecastValue.toFixed(2)));
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

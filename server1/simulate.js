const axios = require('axios');
const API_URL = process.env.API_URL || 'http://127.0.0.1:5000/api/energy';
const USER_ID = 1;
const INTERVAL_MS = 5000;

function randomConsumption() {
  let base = Math.random() * 2;
  if (Math.random() < 0.02) base *= 3;
  return Number(base.toFixed(2));
}

function randomMetrics() {
  return {
    temperature: Number((20 + Math.random() * 10).toFixed(1)),
    humidity: Number((30 + Math.random() * 40).toFixed(1)),
    battery: Number((50 + Math.random() * 50).toFixed(1)),
    status: Math.random() < 0.95 ? 'ON' : 'OFF'
  };
}

function energyCost(consumption) {
  const ratePerKWh = 0.15;
  return Number((consumption * ratePerKWh).toFixed(2));
}

async function sendReading() {
  const timestamp = new Date().toISOString();
  const consumption = randomConsumption();
  const metrics = randomMetrics();
  const payload = {
    user_id: USER_ID,
    timestamp,
    consumption_kWh: consumption,
    energy_cost: energyCost(consumption),
    ...metrics
  };

  try {
    await axios.post(API_URL, payload);
    console.log(new Date().toLocaleTimeString(), 'Sent:', payload.consumption_kWh, 'kWh', 'Cost:$', payload.energy_cost);
    if (payload.consumption_kWh > 3) console.log('⚠️ High consumption detected:', payload.consumption_kWh);
  } catch (err) {
    console.error('Error sending reading:', err.message);
  }
}

async function prefillHistory() {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  for (let i = 0; i < 7 * 24; i++) {
    const timestamp = new Date(start.getTime() + i * 60 * 60 * 1000);
    const consumption = randomConsumption();
    await axios.post(API_URL, {
      user_id: USER_ID,
      timestamp,
      consumption_kWh: consumption,
      energy_cost: energyCost(consumption),
      ...randomMetrics()
    });
  }
  console.log('Prefilled historical data');
}

console.log('Starting IoT simulator...');
setInterval(sendReading, INTERVAL_MS);

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import './App.css';

Chart.register(...registerables, zoomPlugin);

function App() {
  const [readings, setReadings] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [alert, setAlert] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const THRESHOLD = 1.5;
  const WINDOW_SIZE = 20; // number of points to display

  async function fetchData() {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/energy/1");
      const data = res.data;
      // Keep only last WINDOW_SIZE readings
      const recentData = data.slice(-WINDOW_SIZE);
      setReadings(recentData);

      const predicted = recentData.map((r, i, arr) => {
        if (i < 2) return null;
        return Number(((arr[i].consumption_kWh*0.5 + arr[i-1].consumption_kWh*0.3 + arr[i-2].consumption_kWh*0.2)).toFixed(2));
      });
      setPredictions(predicted);

      const last3 = recentData.slice(-3).map(r => r.consumption_kWh);
      if (last3.length === 3) {
        const weightedAvg = Number((last3[2]*0.5 + last3[1]*0.3 + last3[0]*0.2).toFixed(2));
        setForecast(Array(5).fill(weightedAvg));
      }

      const high = recentData.filter(r => r.consumption_kWh > THRESHOLD);
      setAlert(high.length > 0 ? `⚠️ High consumption detected: ${high.length} readings` : null);
    } catch(err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const topPeaks = [...readings]
    .sort((a,b) => b.consumption_kWh - a.consumption_kWh)
    .slice(0,5)
    .map(r => `${new Date(r.timestamp).toLocaleTimeString()}: ${r.consumption_kWh} kWh`);

  function exportCSV() {
    const csvContent = [
      ["Timestamp", "Consumption_kWh"],
      ...readings.map(r => [r.timestamp, r.consumption_kWh])
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "energy_data.csv";
    link.click();
  }

  const chartData = {
    labels: readings.map(r => new Date(r.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Actual (kWh)",
        data: readings.map(r => r.consumption_kWh),
        borderColor: darkMode ? "rgba(52, 152, 219,1)" : "rgba(34,202,236,1)",
        fill: true,
        backgroundColor: darkMode ? "rgba(52, 152, 219,0.1)" : "rgba(34,202,236,0.1)",
        pointBackgroundColor: readings.map(r => r.consumption_kWh > THRESHOLD ? "red" : (darkMode ? "#3498db" : "#22caec")),
        pointRadius: 5,
        pointHoverRadius: 8
      },
      {
        label: "Predicted (kWh)",
        data: predictions,
        borderColor: darkMode ? "rgba(231, 76, 60,1)" : "rgba(255,99,132,1)",
        fill: false,
        borderDash: [5,5],
        pointRadius: 0
      },
      {
        label: "Forecast (Next 5)",
        data: [...Array(readings.length).fill(null), ...forecast],
        borderColor: "orange",
        fill: false,
        borderDash: [5,5],
        pointRadius: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Consumption (kWh)' } }
    }
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark' : ''}`}>
      <h1>Smart Energy Dashboard</h1>
      <button className="dark-btn" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {alert && <div className="alert">{alert}</div>}

      <div className="summary-cards">
        <div className="card">
          <h3>Current Consumption</h3>
          <p>{readings.length ? readings[readings.length-1].consumption_kWh : 0} kWh</p>
        </div>
        <div className="card">
          <h3>Max Consumption</h3>
          <p>{readings.length ? Math.max(...readings.map(r=>r.consumption_kWh)) : 0} kWh</p>
        </div>
        <div className="card">
          <h3>Average Consumption</h3>
          <p>{readings.length ? (readings.reduce((a,b)=>a+b.consumption_kWh,0)/readings.length).toFixed(2) : 0} kWh</p>
        </div>
      </div>

      <div className="line-chart" style={{height: '400px'}}>
        <Line data={chartData} options={chartOptions} />
      </div>

      <h3>Top 5 Peak Hours</h3>
      <ul>{topPeaks.map((t,i)=><li key={i}>{t}</li>)}</ul>

      <button onClick={exportCSV} className="btn">Export CSV</button>
    </div>
  );
}

export default App;

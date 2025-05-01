"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import Papa from "papaparse";

const Dashboard = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {

        const rawData = results.data as any[];
        processCSVData(rawData);
      },
    });
  };

  const processCSVData = (data: any[]) => {
    const counts: Record<string, number> = {};
    const policies: Record<string, Set<string>> = {};

    data.forEach((row) => {
      const rawDate = row.date?.trim();

      if (!rawDate || !rawDate.includes("/")) return;

      const parts = rawDate.split("/");
      const normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

      counts[normalizedDate] = (counts[normalizedDate] || 0) + 1;

      const policy = row.policiesBreached || "";
      if (!policies[normalizedDate]) policies[normalizedDate] = new Set();
      policies[normalizedDate].add(policy);
    });

    const values = Object.values(counts);
    if (values.length === 0) {
      console.warn("No valid dates found in CSV.");
      return;
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / values.length
    );
    const threshold = mean + 1.5 * stdDev;

    const spikes = Object.keys(counts)
      .map((date) => ({
        date,
        count: counts[date],
        isSpike: counts[date] > threshold,
        policies: Array.from(policies[date] || []).join("; "),
      }))
      .filter((alert) => alert.isSpike);

    console.log("Activity counts:", counts);
    console.log("Mean:", mean, "STD DEV:", stdDev, "Threshold:", threshold);
    console.log("Spikes found:", spikes);

    setAlerts(spikes);
  };

  const dismissAlert = (index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📊 Upload Activity CSV</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-6"
      />

      {alerts.length === 0 && <p>No anomalies detected yet.</p>}

      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className="p-4 mb-4 bg-yellow-100 border border-yellow-400 rounded shadow"
        >
          <h4 className="font-semibold">🚨 Spike Detected on {alert.date}</h4>
          <p>📈 Activity Count: {alert.count}</p>
          <p>🛡️ Policies Breached: {alert.policies}</p>
          <button
            onClick={() => dismissAlert(idx)}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;

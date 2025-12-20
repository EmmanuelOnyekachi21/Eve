import React from 'react';
import './RiskMeter.css';

function RiskMeter({ value = 0 }) {
  // Calculate color based on risk value with smooth transitions
  const getColor = (val) => {
    if (val < 40) return '#10b981'; // Green
    if (val < 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  // Get risk level text
  const getRiskLevel = (val) => {
    if (val < 40) return 'Low Risk';
    if (val < 70) return 'Medium Risk';
    return 'High Risk';
  };

  const color = getColor(value);
  const riskLevel = getRiskLevel(value);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="risk-meter">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="15"
        />
        
        {/* Progress circle with animation */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke={color}
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          className="progress-circle"
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease'
          }}
        />
        
        {/* Center text */}
        <text
          x="100"
          y="85"
          textAnchor="middle"
          fontSize="48"
          fontWeight="bold"
          fill={color}
          className="risk-value"
        >
          {value}
        </text>
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fontSize="12"
          fill="#94a3b8"
        >
          out of 100
        </text>
        <text
          x="100"
          y="125"
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill={color}
        >
          {riskLevel}
        </text>
      </svg>
    </div>
  );
}

export default RiskMeter;

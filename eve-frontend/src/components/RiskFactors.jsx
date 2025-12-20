import React from 'react';
import './InfoCards.css';

function RiskFactors({ riskData }) {
  const getFactorColor = (value) => {
    if (value === '--' || value === null || value === undefined) return '#94a3b8';
    const numValue = parseFloat(value);
    if (numValue < 40) return '#10b981';
    if (numValue < 70) return '#f59e0b';
    return '#ef4444';
  };

  const factors = [
    { 
      name: 'Zone Risk', 
      value: riskData?.zone_risk ?? '--', 
      icon: 'bi-geo-alt', 
      color: getFactorColor(riskData?.zone_risk) 
    },
    { 
      name: 'Time Risk', 
      value: riskData?.time_risk ?? '--', 
      icon: 'bi-clock', 
      color: getFactorColor(riskData?.time_risk) 
    },
    { 
      name: 'Speed Risk', 
      value: riskData?.speed_risk ?? '--', 
      icon: 'bi-speedometer', 
      color: getFactorColor(riskData?.speed_risk) 
    },
    { 
      name: 'Anomaly Risk', 
      value: riskData?.anomaly_risk ?? '--', 
      icon: 'bi-exclamation-triangle', 
      color: getFactorColor(riskData?.anomaly_risk) 
    }
  ];

  return (
    <div className="card shadow-sm mb-3 fade-in info-card">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-bar-chart-fill me-2"></i>
          Risk Factors
        </h5>
        <div className="risk-factors-list">
          {factors.map((factor, index) => (
            <div key={index} className="risk-factor-item">
              <div className="factor-icon" style={{ color: factor.color }}>
                <i className={`bi ${factor.icon}`}></i>
              </div>
              <div className="factor-info">
                <div className="factor-name">{factor.name}</div>
                <div className="factor-value" style={{ color: factor.color }}>
                  {typeof factor.value === 'number' ? factor.value.toFixed(1) : factor.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RiskFactors;

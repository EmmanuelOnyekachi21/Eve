import React, { useState, useEffect } from 'react';
import './DashboardHeader.css';

function DashboardHeader({ lastUpdated }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-header-info">
      <div className="time-display">
        <div className="current-time">
          <i className="bi bi-clock me-2"></i>
          {formatTime(currentTime)}
        </div>
        <div className="current-date">{formatDate(currentTime)}</div>
      </div>
      {lastUpdated && (
        <div className="last-updated">
          <i className="bi bi-arrow-clockwise me-2"></i>
          Last Updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}

export default DashboardHeader;

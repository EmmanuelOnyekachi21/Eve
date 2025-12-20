import React, { useState, useEffect } from 'react';
import { getAdminAlerts, getAdminStatistics, resolveAlert, markFalseAlarm, checkExpiredAlerts } from '../services/adminService';
import './AdminDashboard.css';

function AdminDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'critical'
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => {
    document.title = 'Eve - Admin Dashboard';
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadData = async () => {
    try {
      const [alertsData, statsData] = await Promise.all([
        getAdminAlerts(filter === 'critical'),
        getAdminStatistics()
      ]);
      
      setAlerts(alertsData.alerts);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckExpired = async () => {
    try {
      const result = await checkExpiredAlerts();
      alert(`Checked for expired alerts: ${result.alerts_logged} alert(s) logged`);
      loadData(); // Reload data
    } catch (error) {
      alert('Failed to check expired alerts');
    }
  };

  const handleResolve = async (alertId) => {
    if (!window.confirm('Mark this alert as resolved?')) return;
    
    try {
      await resolveAlert(alertId, resolveNotes);
      setResolveNotes('');
      setSelectedAlert(null);
      loadData();
    } catch (error) {
      alert('Failed to resolve alert');
    }
  };

  const handleFalseAlarm = async (alertId) => {
    if (!window.confirm('Mark this alert as false alarm?')) return;
    
    try {
      await markFalseAlarm(alertId, 'Marked as false alarm by admin');
      loadData();
    } catch (error) {
      alert('Failed to mark as false alarm');
    }
  };

  const getAlertBadgeClass = (level) => {
    return level === 'Emergency' ? 'badge-danger' : 'badge-warning';
  };

  const getSourceIcon = (source) => {
    const icons = {
      'Voice': 'bi-mic-fill',
      'Location': 'bi-geo-alt-fill',
      'Manual': 'bi-hand-index-fill',
      'Combined': 'bi-layers-fill',
      'Prediction': 'bi-graph-up'
    };
    return icons[source] || 'bi-exclamation-triangle';
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="admin-title">
              <i className="bi bi-shield-exclamation me-2"></i>
              Admin Alert Dashboard
            </h1>
            <p className="text-muted">Monitor and manage critical safety alerts</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="stat-card critical">
                <div className="stat-icon">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                </div>
                <div className="stat-info">
                  <h3>{statistics.critical_alerts}</h3>
                  <p>Critical Alerts</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card voice">
                <div className="stat-icon">
                  <i className="bi bi-mic-fill"></i>
                </div>
                <div className="stat-info">
                  <h3>{statistics.voice_crisis_alerts}</h3>
                  <p>Voice Crisis</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card emergency">
                <div className="stat-icon">
                  <i className="bi bi-hand-index-fill"></i>
                </div>
                <div className="stat-info">
                  <h3>{statistics.user_triggered_emergencies}</h3>
                  <p>User Triggered</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card no-response">
                <div className="stat-icon">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="stat-info">
                  <h3>{statistics.no_response_alerts}</h3>
                  <p>No Response</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Alerts
              </button>
              <button
                className={`filter-tab ${filter === 'critical' ? 'active' : ''}`}
                onClick={() => setFilter('critical')}
              >
                Critical Only
              </button>
              <button
                className="filter-tab refresh-btn"
                onClick={loadData}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
              <button
                className="filter-tab check-expired-btn"
                onClick={handleCheckExpired}
                title="Check for alerts that haven't received user response"
              >
                <i className="bi bi-clock-history me-2"></i>
                Check Expired
              </button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="row">
          <div className="col-12">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <i className="bi bi-check-circle-fill"></i>
                <h3>No alerts requiring attention</h3>
                <p>All users are safe</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-card ${alert.requires_admin_attention ? 'critical' : ''}`}>
                    <div className="alert-header">
                      <div className="alert-user">
                        <i className="bi bi-person-circle me-2"></i>
                        <strong>{alert.user.name}</strong>
                        <span className="text-muted ms-2">{alert.user.email}</span>
                      </div>
                      <div className="alert-badges">
                        <span className={`badge ${getAlertBadgeClass(alert.alert_level)}`}>
                          {alert.alert_level}
                        </span>
                        <span className="badge badge-secondary">
                          <i className={`${getSourceIcon(alert.alert_source)} me-1`}></i>
                          {alert.alert_source}
                        </span>
                      </div>
                    </div>

                    <div className="alert-body">
                      <div className="alert-reason">
                        <i className="bi bi-info-circle me-2"></i>
                        {alert.reason}
                      </div>
                      
                      <div className="alert-meta">
                        <div className="meta-item">
                          <i className="bi bi-clock me-1"></i>
                          {Math.round(alert.time_elapsed_minutes)} minutes ago
                        </div>
                        <div className="meta-item">
                          <i className="bi bi-speedometer me-1"></i>
                          Risk: {alert.risk_score.toFixed(1)}
                        </div>
                        <div className="meta-item">
                          <i className="bi bi-geo-alt me-1"></i>
                          {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                        </div>
                      </div>

                      {alert.admin_notes && (
                        <div className="alert-notes">
                          <strong>Notes:</strong> {alert.admin_notes}
                        </div>
                      )}

                      {alert.user_response_deadline && (
                        <div className="response-deadline">
                          <i className="bi bi-hourglass-split me-2"></i>
                          Response deadline: {new Date(alert.user_response_deadline).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="alert-actions">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        Resolve
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleFalseAlarm(alert.id)}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        False Alarm
                      </button>
                      <a
                        href={`tel:${alert.user.phone}`}
                        className="btn btn-sm btn-primary"
                      >
                        <i className="bi bi-telephone me-1"></i>
                        Call User
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

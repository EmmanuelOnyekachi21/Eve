import React, { useState, useEffect } from 'react';
import { confirmSafe, triggerEmergency } from '../services/alertService';
import './AlertModal.css';

function AlertModal({ alert, onClose, onConfirm, audioMonitorActive = false }) {
  const [responding, setResponding] = useState(false);
  const [context, setContext] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showContextInput, setShowContextInput] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Update time elapsed every second
    const timer = setInterval(() => {
      if (alert) {
        const elapsed = Math.floor(alert.time_elapsed_minutes || 0);
        setTimeElapsed(elapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alert]);

  const handleConfirmSafe = async () => {
    setResponding(true);
    try {
      // Get current location if available
      let latitude = null;
      let longitude = null;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (err) {
          console.log('Could not get location:', err);
        }
      }

      await confirmSafe(alert?.id, context, latitude, longitude);
      onConfirm('safe');
      onClose();
    } catch (error) {
      console.error('Error confirming safe:', error);
      alert('Failed to confirm. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const handleEmergency = async () => {
    if (!window.confirm('This will send emergency alerts to all your contacts. Continue?')) {
      return;
    }

    setResponding(true);
    try {
      // Get current location if available
      let latitude = null;
      let longitude = null;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (err) {
          console.log('Could not get location:', err);
        }
      }

      const result = await triggerEmergency(context || 'User triggered SOS', latitude, longitude);
      onConfirm('emergency', result);
      onClose();
    } catch (error) {
      console.error('Error triggering emergency:', error);
      alert('Failed to send emergency alert. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  if (!alert) return null;

  return (
    <div className="alert-modal-overlay">
      <div className={`alert-modal ${isMinimized ? 'minimized' : ''}`}>
        <div className="alert-modal-header">
          <button
            className="alert-modal-minimize"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <i className={`bi bi-${isMinimized ? 'chevron-down' : 'dash'}`}></i>
          </button>
          <button
            className="alert-modal-close"
            onClick={onClose}
            title="Dismiss (will reappear if not resolved)"
          >
            <i className="bi bi-x"></i>
          </button>
          <div className="alert-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <h2>Safety Check</h2>
          <p className="alert-time">Alert triggered {timeElapsed} minute{timeElapsed !== 1 ? 's' : ''} ago</p>
        </div>

        <div className="alert-modal-body">
          <div className="alert-info">
            <div className="alert-level">
              <span className={`badge badge-${alert.alert_level.toLowerCase()}`}>
                {alert.alert_level}
              </span>
            </div>
            <p className="alert-reason">{alert.reason}</p>
            {alert.risk_score && (
              <div className="risk-score">
                <span>Risk Score:</span>
                <strong>{alert.risk_score.toFixed(1)}/100</strong>
              </div>
            )}
          </div>

          <div className="safety-question">
            <h3>Are you safe?</h3>
            <p>Please confirm your safety status</p>
            {audioMonitorActive && (
              <div className="audio-status-badge">
                <i className="bi bi-mic-fill me-2"></i>
                Audio monitoring active - listening for distress
              </div>
            )}
          </div>

          {showContextInput && (
            <div className="context-input">
              <textarea
                className="form-control"
                placeholder="Optional: Add context (e.g., 'At the store', 'Walking home')"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows="2"
              />
            </div>
          )}

          {!showContextInput && (
            <button
              className="btn-link"
              onClick={() => setShowContextInput(true)}
            >
              + Add context (optional)
            </button>
          )}
        </div>

        <div className="alert-modal-actions">
          <button
            className="btn btn-safe"
            onClick={handleConfirmSafe}
            disabled={responding}
          >
            {responding ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Confirming...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                I'm Safe
              </>
            )}
          </button>

          <button
            className="btn btn-emergency"
            onClick={handleEmergency}
            disabled={responding}
          >
            {responding ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Sending...
              </>
            ) : (
              <>
                <i className="bi bi-exclamation-octagon me-2"></i>
                I Need Help!
              </>
            )}
          </button>
        </div>

        <div className="alert-modal-footer">
          <small>
            <i className="bi bi-info-circle me-1"></i>
            Your emergency contacts will be notified if you don't respond
          </small>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;

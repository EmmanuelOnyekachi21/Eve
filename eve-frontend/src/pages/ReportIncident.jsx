import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportIncident } from '../services/api';
import './ReportIncident.css';

function ReportIncident() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    incident_type: 'Robbery',
    latitude: '',
    longitude: '',
    occurred_at: '',
    severity: 5,
    description: '',
    anonymous: false
  });

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentLocation(location);
          setFormData(prev => ({
            ...prev,
            latitude: location.latitude.toFixed(6),
            longitude: location.longitude.toFixed(6)
          }));
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setGettingLocation(false);
        }
      );
    } else {
      setGettingLocation(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.latitude || !formData.longitude) {
      setError('Location is required. Please enable location access or enter coordinates manually.');
      setLoading(false);
      return;
    }

    try {
      const response = await reportIncident(formData);
      setSuccess(true);
      
      // Reset form after 3 seconds and redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="report-incident-page">
        <div className="container py-5">
          <div className="success-message">
            <div className="success-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2>Report Submitted Successfully</h2>
            <p>Thank you for helping keep the community safe.</p>
            <p className="text-muted">Your report will help improve our safety predictions.</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-incident-page">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="report-card">
              <div className="report-header">
                <button 
                  className="btn-back"
                  onClick={() => navigate(-1)}
                >
                  <i className="bi bi-arrow-left"></i>
                </button>
                <h1>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Report an Incident
                </h1>
                <p className="subtitle">
                  Help improve safety predictions by reporting incidents in your area
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Incident Type */}
                <div className="form-section">
                  <label className="form-label">
                    <i className="bi bi-tag-fill me-2"></i>
                    Incident Type *
                  </label>
                  <select
                    className="form-select"
                    name="incident_type"
                    value={formData.incident_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="Robbery">Robbery</option>
                    <option value="Assault">Assault</option>
                    <option value="Kidnapping">Kidnapping</option>
                    <option value="Theft">Theft</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Vandalism">Vandalism</option>
                  </select>
                </div>

                {/* Location */}
                <div className="form-section">
                  <label className="form-label">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Location *
                  </label>
                  <div className="location-input-group">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input
                          type="number"
                          className="form-control"
                          name="latitude"
                          placeholder="Latitude"
                          value={formData.latitude}
                          onChange={handleChange}
                          step="any"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="number"
                          className="form-control"
                          name="longitude"
                          placeholder="Longitude"
                          value={formData.longitude}
                          onChange={handleChange}
                          step="any"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm mt-2"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                    >
                      {gettingLocation ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Getting location...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-crosshair me-2"></i>
                          Use Current Location
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="form-section">
                  <label className="form-label">
                    <i className="bi bi-calendar-event me-2"></i>
                    When did this occur?
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="occurred_at"
                    value={formData.occurred_at}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 16)}
                  />
                  <small className="form-text text-muted">
                    Leave blank if it just happened
                  </small>
                </div>

                {/* Severity */}
                <div className="form-section">
                  <label className="form-label">
                    <i className="bi bi-speedometer me-2"></i>
                    Severity: {formData.severity}/10
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    name="severity"
                    min="1"
                    max="10"
                    value={formData.severity}
                    onChange={handleChange}
                  />
                  <div className="severity-labels">
                    <span className="text-success">Minor</span>
                    <span className="text-warning">Moderate</span>
                    <span className="text-danger">Severe</span>
                  </div>
                </div>

                {/* Description */}
                <div className="form-section">
                  <label className="form-label">
                    <i className="bi bi-chat-left-text me-2"></i>
                    Description (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="4"
                    placeholder="Provide any additional details that might help..."
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                {/* Anonymous Reporting */}
                <div className="form-section">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="anonymous"
                      id="anonymous"
                      checked={formData.anonymous}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="anonymous">
                      Submit anonymously
                    </label>
                  </div>
                  <small className="form-text text-muted">
                    Your identity will not be recorded with this report
                  </small>
                </div>

                {/* Info Box */}
                <div className="info-box">
                  <i className="bi bi-info-circle me-2"></i>
                  <div>
                    <strong>How this helps:</strong>
                    <p className="mb-0">
                      Your report trains our AI model to better predict and prevent future incidents.
                      All reports are confidential and used solely for safety improvements.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIncident;

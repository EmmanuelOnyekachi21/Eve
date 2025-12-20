import React from 'react';
import './Predictions.css';

function Predictions() {
  return (
    <div className="predictions-page container fade-in">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="page-title">
            <i className="bi bi-graph-up me-2"></i>
            AI Predictions
          </h1>
          <p className="text-muted">Machine learning-powered threat forecasting</p>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-clock-history me-2"></i>
                Next Hour Prediction
              </h5>
              <div className="prediction-box">
                <div className="prediction-percentage text-muted">--%</div>
                <div className="prediction-status">Calculating...</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-calendar-week me-2"></i>
                24-Hour Forecast
              </h5>
              <div className="prediction-box">
                <div className="prediction-percentage text-muted">--%</div>
                <div className="prediction-status">Calculating...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-cpu me-2"></i>
                Model Information
              </h5>
              <div className="model-info">
                <div className="info-item">
                  <span className="info-label">Model Type:</span>
                  <span className="info-value">LSTM Neural Network</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated:</span>
                  <span className="info-value text-muted">--</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Accuracy:</span>
                  <span className="info-value text-muted">--</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="badge bg-secondary">Initializing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Predictions;

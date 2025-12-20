import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskMeter from '../components/RiskMeter';
import LiveMapComponent from '../components/LiveMapComponent';
import RiskFactors from '../components/RiskFactors';
import NearestDanger from '../components/NearestDanger';
import AIPrediction from '../components/AIPrediction';
import GPSSimulator from '../components/GPSSimulator';
import RealGPSTracker from '../components/RealGPSTracker';
import AlertBanner from '../components/AlertBanner';
import EmergencyContacts from '../components/EmergencyContacts';
import DashboardHeader from '../components/DashboardHeader';
import AudioMonitor from '../components/AudioMonitor';
import RiskDetailsModal from '../components/RiskDetailsModal';
import './Dashboard.css';
import { fetchCrimeZones } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [riskLevel, setRiskLevel] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [riskCategory, setRiskCategory] = useState('Low');
  const [riskData, setRiskData] = useState(null);
  const [crimeZones, setCrimeZones] = useState([]);
  const [userLocation, setUserLocation] = useState([5.125086, 7.356695]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [audioMonitorEnabled, setAudioMonitorEnabled] = useState(true);
  const [showRiskDetails, setShowRiskDetails] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Eve - Dashboard';
  }, []);

  // Load crime zones
  useEffect(() => {
    const loadZones = async () => {
      try {
        const zones = await fetchCrimeZones();
        setCrimeZones(zones);
      } catch (error) {
        console.error('Failed to load crime zones:', error);
      }
    };
    loadZones();
  }, []);

  // Handle risk updates from GPS Simulator
  const handleRiskUpdate = (data) => {
    console.log('Risk update received:', data);
    setRiskData(data);
    
    // Update risk level
    const totalRisk = data.total_risk || data.risk_score || 0;
    setRiskLevel(Math.round(totalRisk));
    
    // Update risk category
    if (totalRisk < 40) {
      setRiskCategory('Low');
      setStatus('SAFE');
    } else if (totalRisk < 75) {
      setRiskCategory('Medium');
      setStatus('CAUTION');
    } else {
      setRiskCategory('High');
      setStatus('DANGER');
    }
    
    // Update last updated timestamp
    setLastUpdated(new Date().toLocaleTimeString());
  };

  // Handle location changes from GPS Simulator
  const handleLocationChange = (lat, lon) => {
    setUserLocation([lat, lon]);
  };

  // Get status class
  const getStatusClass = () => {
    if (riskLevel < 40) return 'status-safe';
    if (riskLevel < 70) return 'status-warning';
    return 'status-emergency';
  };

  return (
    <div className="dashboard-container container-fluid fade-in">
      {/* Alert Banner - Shows when risk > 70 */}
      <AlertBanner 
        riskLevel={riskLevel} 
        riskData={riskData}
        onViewDetails={() => setShowRiskDetails(true)}
      />

      {/* Risk Details Modal */}
      {showRiskDetails && (
        <RiskDetailsModal 
          riskData={riskData}
          onClose={() => setShowRiskDetails(false)}
        />
      )}

      <div className="row mb-4">
        <div className="col-12">
          <h1 className="dashboard-title">
            <i className="bi bi-speedometer2 me-2"></i>
            Safety Dashboard
          </h1>
          <p className="text-muted">Real-time monitoring and AI-powered threat detection</p>
          <DashboardHeader lastUpdated={lastUpdated} />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN - Risk Meter */}
        <div className="dashboard-left">
          <div className="card shadow-sm mb-3 fade-in">
            <div className="card-body text-center">
              <h5 className="card-title mb-4">
                <i className="bi bi-activity me-2"></i>
                Current Risk Level
              </h5>
              <RiskMeter value={riskLevel} />
              
              <div className="mt-4">
                <span className={`badge risk-badge risk-${riskCategory.toLowerCase()} fs-5 px-4 py-2`}>
                  {riskCategory}
                </span>
              </div>
              
              <div className="mt-3">
                <div className="status-indicator">
                  <span className={`status-dot ${getStatusClass()}`}></span>
                  <span className="status-text">{status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN - Live Map */}
        <div className="dashboard-middle">
          <div className="card shadow-sm map-card fade-in">
            <div className="card-body p-0">
              <div className="map-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-geo-alt-fill me-2"></i>
                  Live Location Map
                </h5>
              </div>
              <LiveMapComponent userLocation={userLocation} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Info Cards */}
        <div className="dashboard-right">
          <AudioMonitor 
            riskLevel={riskLevel}
            enabled={audioMonitorEnabled}
          />
          <GPSSimulator 
            crimeZones={crimeZones}
            onLocationChange={handleLocationChange}
            onRiskUpdate={handleRiskUpdate}
          />
          <RealGPSTracker 
            onLocationChange={handleLocationChange}
            onRiskUpdate={handleRiskUpdate}
          />
          <EmergencyContacts 
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
          />
          <RiskFactors riskData={riskData} />
          <NearestDanger riskData={riskData} />
          <AIPrediction riskData={riskData} />
        </div>
      </div>

      {/* Floating Action Button for Incident Reporting */}
      <button 
        className="fab-report-incident"
        onClick={() => navigate('/report-incident')}
        title="Report an Incident"
      >
        <i className="bi bi-exclamation-triangle-fill"></i>
      </button>
    </div>
  );
}

export default Dashboard;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import PredictionsNew from './pages/PredictionsNew';
import EnhancedPredictions from './pages/EnhancedPredictions';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import ReportIncident from './pages/ReportIncident';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AlertMonitor from './components/AlertMonitor';
import { AudioMonitorProvider } from './contexts/AudioMonitorContext';
import { isAuthenticated, logout, getUser } from './services/authService';
import './App.css';

// Navigation component to handle active state
function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navigation on login/register/onboarding pages
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/onboarding') {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold fs-3" to="/dashboard">
          <i className="bi bi-shield-check me-2"></i>
          Eve
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                <i className="bi bi-speedometer2 me-1"></i>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/live-map')}`} to="/live-map">
                <i className="bi bi-map me-1"></i>
                Live Map
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/predictions')}`} to="/predictions">
                <i className="bi bi-graph-up me-1"></i>
                Predictions
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/enhanced')}`} to="/enhanced">
                <i className="bi bi-stars me-1"></i>
                Enhanced
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/report-incident')}`} to="/report-incident">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Report
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/about')}`} to="/about">
                <i className="bi bi-info-circle me-1"></i>
                About
              </Link>
            </li>
            {isAuthenticated() && user?.is_staff && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/admin')}`} to="/admin">
                  <i className="bi bi-shield-exclamation me-1"></i>
                  Admin
                </Link>
              </li>
            )}
            {isAuthenticated() && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.first_name || 'User'}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li>
                    <span className="dropdown-item-text">
                      <strong>{user?.email}</strong>
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person me-2"></i>
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AudioMonitorProvider>
      <Router>
        <div className="App">
          {/* Navigation Bar */}
          <Navigation />
          
          {/* Alert Monitor - Shows safety check modals */}
          {isAuthenticated() && <AlertMonitor />}

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Onboarding Route */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-map" 
              element={
                <ProtectedRoute>
                  <LiveMap />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/predictions" 
              element={
                <ProtectedRoute>
                  <PredictionsNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/enhanced" 
              element={
                <ProtectedRoute>
                  <EnhancedPredictions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/about" 
              element={
                <ProtectedRoute>
                  <About />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/report-incident" 
              element={
                <ProtectedRoute>
                  <ReportIncident />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer bg-dark text-white py-4 mt-5">
          <div className="container text-center">
            <p className="mb-2">
              <i className="bi bi-shield-check me-2"></i>
              <strong>Eve</strong> - AI-Powered Personal Safety System
            </p>
            <p className="text-muted mb-0">
              Built with ❤️ by the Eve Team | © 2024 All Rights Reserved
            </p>
          </div>
        </footer>
        </div>
      </Router>
    </AudioMonitorProvider>
  );
}

export default App;

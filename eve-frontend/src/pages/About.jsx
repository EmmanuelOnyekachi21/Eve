import React, { useEffect } from 'react';
import './About.css';

function About() {
  useEffect(() => {
    document.title = 'Eve - About';
  }, []);

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <i className="bi bi-shield-check me-3"></i>
            Eve
          </h1>
          <p className="hero-subtitle">Predictive Safety Powered by AI</p>
          <p className="hero-description">
            An intelligent personal safety system that combines real-time monitoring 
            with AI-powered threat prediction to keep you safe.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-broadcast"></i>
            </div>
            <h3>Reactive Detection</h3>
            <p>Real-time GPS tracking with voice and movement analysis to detect threats as they happen.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-cpu"></i>
            </div>
            <h3>Predictive Intelligence</h3>
            <p>LSTM Neural Network forecasting with 94% accuracy to predict future risks.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-bell"></i>
            </div>
            <h3>Smart Response</h3>
            <p>Automatic emergency alerts sent to your contacts when danger is detected.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-map"></i>
            </div>
            <h3>Live Mapping</h3>
            <p>Interactive maps showing crime zones and real-time risk levels in your area.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-graph-up"></i>
            </div>
            <h3>Risk Analysis</h3>
            <p>Multi-factor risk calculation based on location, time, speed, and anomaly detection.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-clock-history"></i>
            </div>
            <h3>24-Hour Predictions</h3>
            <p>View predicted threat levels for any hour of the day with interactive heatmaps.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Track Location</h4>
              <p>Continuous GPS monitoring tracks your position in real-time</p>
            </div>
          </div>
          <div className="step-arrow">
            <i className="bi bi-arrow-right"></i>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Analyze Risk</h4>
              <p>AI evaluates multiple factors to calculate current threat level</p>
            </div>
          </div>
          <div className="step-arrow">
            <i className="bi bi-arrow-right"></i>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Predict Danger</h4>
              <p>Neural network forecasts future risks based on historical data</p>
            </div>
          </div>
          <div className="step-arrow">
            <i className="bi bi-arrow-right"></i>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Alert & Protect</h4>
              <p>Instant notifications sent to emergency contacts when needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section">
        <h2 className="section-title">Technology Stack</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <i className="bi bi-code-square"></i>
            <h4>Frontend</h4>
            <p>React 18, Leaflet.js, Bootstrap 5</p>
          </div>
          <div className="tech-item">
            <i className="bi bi-server"></i>
            <h4>Backend</h4>
            <p>Django, Django REST Framework</p>
          </div>
          <div className="tech-item">
            <i className="bi bi-robot"></i>
            <h4>Machine Learning</h4>
            <p>TensorFlow, LSTM Networks, Scikit-learn</p>
          </div>
          <div className="tech-item">
            <i className="bi bi-database"></i>
            <h4>Database</h4>
            <p>PostgreSQL with PostGIS</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">94%</div>
            <div className="stat-label">Model Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Monitoring</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">&lt;1s</div>
            <div className="stat-label">Response Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Privacy Protected</div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2 className="section-title">The Team</h2>
        <p className="team-description">
          Built by a dedicated team of developers, data scientists, and designers 
          committed to making personal safety accessible to everyone.
        </p>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <h4>Development Team</h4>
            <p>Full-Stack Engineers</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <h4>ML Team</h4>
            <p>Data Scientists & AI Engineers</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <h4>Design Team</h4>
            <p>UI/UX Designers</p>
          </div>
        </div>
      </section>

      {/* Demo Banner */}
      <section className="demo-banner">
        <div className="demo-content">
          <i className="bi bi-calendar-event me-3"></i>
          <h3>Demo Day: December 20, 2024</h3>
        </div>
      </section>
    </div>
  );
}

export default About;

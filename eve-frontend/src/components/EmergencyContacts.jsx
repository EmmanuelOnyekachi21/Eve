import React from 'react';
import './EmergencyContacts.css';

function EmergencyContacts({ soundEnabled, onToggleSound }) {
  const contacts = [
    { id: 1, name: 'Emergency Services', phone: '911', status: 'active' },
    { id: 2, name: 'Campus Security', phone: '+234-XXX-XXXX', status: 'active' },
    { id: 3, name: 'Primary Contact', phone: '+234-XXX-XXXX', status: 'inactive' }
  ];

  return (
    <div className="card shadow-sm mb-3 fade-in emergency-card">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-telephone-fill me-2"></i>
          Emergency Contacts
        </h5>
        
        {/* Sound Toggle */}
        <div className="sound-toggle mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="soundToggle"
              checked={soundEnabled}
              onChange={onToggleSound}
            />
            <label className="form-check-label" htmlFor="soundToggle">
              <i className={`bi bi-volume-${soundEnabled ? 'up' : 'mute'}-fill me-2`}></i>
              Alert Sounds
            </label>
          </div>
        </div>

        {/* Contacts List */}
        <div className="contacts-list">
          {contacts.map(contact => (
            <div key={contact.id} className="contact-item">
              <div className="contact-status">
                <span className={`status-dot ${contact.status}`}></span>
              </div>
              <div className="contact-info">
                <div className="contact-name">{contact.name}</div>
                <div className="contact-phone">{contact.phone}</div>
              </div>
              <button className="btn btn-sm btn-outline-primary">
                <i className="bi bi-telephone"></i>
              </button>
            </div>
          ))}
        </div>

        <button className="btn btn-outline-secondary btn-sm w-100 mt-3">
          <i className="bi bi-plus-circle me-2"></i>
          Add Contact
        </button>
      </div>
    </div>
  );
}

export default EmergencyContacts;

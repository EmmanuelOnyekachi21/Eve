import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserProfile,
  updateUserProfile,
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../services/profileService';
import { getUser } from '../services/authService';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // User data
  const user = getUser();

  // Profile data
  const [profile, setProfile] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);

  // Location search states
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeSearchResults, setHomeSearchResults] = useState([]);
  const [homeSearching, setHomeSearching] = useState(false);
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [workSearchResults, setWorkSearchResults] = useState([]);
  const [workSearching, setWorkSearching] = useState(false);

  // Emergency contacts
  const [contacts, setContacts] = useState([]);
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, contactsData] = await Promise.all([
        getUserProfile(),
        getEmergencyContacts(),
      ]);
      setProfile(profileData);
      setContacts(contactsData);
    } catch (err) {
      setError('Failed to load profile data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Location search functionality
  const searchLocation = async (query, locationType) => {
    if (!query || query.length < 3) {
      if (locationType === 'home') {
        setHomeSearchResults([]);
      } else {
        setWorkSearchResults([]);
      }
      return;
    }

    if (locationType === 'home') {
      setHomeSearching(true);
    } else {
      setWorkSearching(true);
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=ng`
      );
      const data = await response.json();

      if (locationType === 'home') {
        setHomeSearchResults(data);
      } else {
        setWorkSearchResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      if (locationType === 'home') {
        setHomeSearching(false);
      } else {
        setWorkSearching(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (homeSearchQuery) {
        searchLocation(homeSearchQuery, 'home');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [homeSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (workSearchQuery) {
        searchLocation(workSearchQuery, 'work');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [workSearchQuery]);

  const handleUseCurrentLocation = (locationType) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();

            if (locationType === 'home') {
              await updateUserProfile({
                home_latitude: lat,
                home_longitude: lng,
              });
              setSuccess('Home location updated successfully');
              loadProfileData();
            } else {
              await updateUserProfile({
                work_latitude: lat,
                work_longitude: lng,
              });
              setSuccess('Work location updated successfully');
              loadProfileData();
            }
            setEditingLocation(null);
          } catch (err) {
            setError('Failed to update location');
          }
        },
        (error) => {
          setError('Unable to get your location');
        }
      );
    }
  };

  const selectLocation = async (result, locationType) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    try {
      if (locationType === 'home') {
        await updateUserProfile({
          home_latitude: lat,
          home_longitude: lng,
        });
        setHomeSearchQuery('');
        setHomeSearchResults([]);
        setSuccess('Home location updated successfully');
      } else {
        await updateUserProfile({
          work_latitude: lat,
          work_longitude: lng,
        });
        setWorkSearchQuery('');
        setWorkSearchResults([]);
        setSuccess('Work location updated successfully');
      }
      setEditingLocation(null);
      loadProfileData();
    } catch (err) {
      setError('Failed to update location');
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      setError('Please fill in all contact fields');
      return;
    }

    if (contacts.length >= 5) {
      setError('Maximum 5 emergency contacts allowed');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await addEmergencyContact({
        ...newContact,
        priority: contacts.length + 1,
      });
      setNewContact({ name: '', phone: '', relationship: '' });
      setSuccess('Emergency contact added successfully');
      loadProfileData();
    } catch (err) {
      setError('Failed to add emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContact = async (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact.name || !contact.phone || !contact.relationship) {
      setError('Please fill in all contact fields');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateEmergencyContact(contactId, {
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
      });
      setEditingContact(null);
      setSuccess('Emergency contact updated successfully');
      loadProfileData();
    } catch (err) {
      setError('Failed to update emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await deleteEmergencyContact(contactId);
      setSuccess('Emergency contact deleted successfully');
      loadProfileData();
    } catch (err) {
      setError('Failed to delete emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleContactChange = (contactId, field, value) => {
    setContacts(
      contacts.map((c) => (c.id === contactId ? { ...c, [field]: value } : c))
    );
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>
          <i className="bi bi-person-circle me-2"></i>
          My Profile
        </h1>
        <p>Manage your personal information and safety settings</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            className="btn-close"
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i>
          {success}
          <button
            className="btn-close"
            onClick={() => setSuccess('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <i className="bi bi-person me-2"></i>
          Personal Info
        </button>
        <button
          className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          <i className="bi bi-geo-alt me-2"></i>
          Locations
        </button>
        <button
          className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <i className="bi bi-people me-2"></i>
          Emergency Contacts
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="tab-panel">
            <h3>Personal Information</h3>
            <div className="info-card">
              <div className="info-row">
                <label>Full Name</label>
                <div className="info-value">{user?.full_name || 'Not set'}</div>
              </div>
              <div className="info-row">
                <label>Email</label>
                <div className="info-value">{user?.email}</div>
              </div>
              <div className="info-row">
                <label>Phone Number</label>
                <div className="info-value">{user?.phone_number || 'Not set'}</div>
              </div>
              <div className="info-row">
                <label>Account Type</label>
                <div className="info-value">
                  <span className={`badge ${user?.is_admin ? 'badge-admin' : 'badge-user'}`}>
                    {user?.is_admin ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && profile && (
          <div className="tab-panel">
            <h3>Your Locations</h3>

            {/* Home Location */}
            <div className="location-card">
              <div className="location-header">
                <h4>
                  <i className="bi bi-house-fill me-2"></i>
                  Home Location
                </h4>
                {editingLocation !== 'home' && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setEditingLocation('home')}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                )}
              </div>

              {editingLocation === 'home' ? (
                <div className="location-edit">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 mb-3"
                    onClick={() => handleUseCurrentLocation('home')}
                  >
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Use Current Location
                  </button>

                  <div className="divider">
                    <span>OR</span>
                  </div>

                  <div className="location-search">
                    <div className="input-group mb-3">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search for your address"
                        value={homeSearchQuery}
                        onChange={(e) => setHomeSearchQuery(e.target.value)}
                      />
                    </div>

                    {homeSearching && (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm"></div>
                      </div>
                    )}

                    {homeSearchResults.length > 0 && (
                      <div className="search-results">
                        {homeSearchResults.map((result, index) => (
                          <div
                            key={index}
                            className="search-result-item"
                            onClick={() => selectLocation(result, 'home')}
                          >
                            <i className="bi bi-geo-alt me-2"></i>
                            <div className="result-name">{result.display_name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-sm btn-secondary mt-3"
                    onClick={() => {
                      setEditingLocation(null);
                      setHomeSearchQuery('');
                      setHomeSearchResults([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="location-display">
                  {profile.home_latitude && profile.home_longitude ? (
                    <>
                      <p>
                        <strong>Coordinates:</strong> {profile.home_latitude.toFixed(6)},{' '}
                        {profile.home_longitude.toFixed(6)}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">Not set</p>
                  )}
                </div>
              )}
            </div>

            {/* Work Location */}
            <div className="location-card">
              <div className="location-header">
                <h4>
                  <i className="bi bi-building me-2"></i>
                  Work/School Location
                </h4>
                {editingLocation !== 'work' && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setEditingLocation('work')}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                )}
              </div>

              {editingLocation === 'work' ? (
                <div className="location-edit">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 mb-3"
                    onClick={() => handleUseCurrentLocation('work')}
                  >
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Use Current Location
                  </button>

                  <div className="divider">
                    <span>OR</span>
                  </div>

                  <div className="location-search">
                    <div className="input-group mb-3">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search for your work/school address"
                        value={workSearchQuery}
                        onChange={(e) => setWorkSearchQuery(e.target.value)}
                      />
                    </div>

                    {workSearching && (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm"></div>
                      </div>
                    )}

                    {workSearchResults.length > 0 && (
                      <div className="search-results">
                        {workSearchResults.map((result, index) => (
                          <div
                            key={index}
                            className="search-result-item"
                            onClick={() => selectLocation(result, 'work')}
                          >
                            <i className="bi bi-geo-alt me-2"></i>
                            <div className="result-name">{result.display_name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-sm btn-secondary mt-3"
                    onClick={() => {
                      setEditingLocation(null);
                      setWorkSearchQuery('');
                      setWorkSearchResults([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="location-display">
                  {profile.work_latitude && profile.work_longitude ? (
                    <>
                      <p>
                        <strong>Coordinates:</strong> {profile.work_latitude.toFixed(6)},{' '}
                        {profile.work_longitude.toFixed(6)}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">Not set</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="tab-panel">
            <h3>Emergency Contacts</h3>
            <p className="text-muted mb-4">
              Manage people who will be notified in case of emergency (maximum 5)
            </p>

            {/* Existing Contacts */}
            <div className="contacts-list">
              {contacts.map((contact) => (
                <div key={contact.id} className="contact-card">
                  {editingContact === contact.id ? (
                    <>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Name"
                            value={contact.name}
                            onChange={(e) =>
                              handleContactChange(contact.id, 'name', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="Phone"
                            value={contact.phone}
                            onChange={(e) =>
                              handleContactChange(contact.id, 'phone', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        className="form-control mb-3"
                        placeholder="Relationship"
                        value={contact.relationship}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'relationship', e.target.value)
                        }
                      />
                      <div className="contact-actions">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateContact(contact.id)}
                          disabled={saving}
                        >
                          <i className="bi bi-check me-1"></i>
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingContact(null);
                            loadProfileData();
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="contact-info">
                        <div className="contact-priority">#{contact.priority}</div>
                        <div className="contact-details">
                          <h5>{contact.name}</h5>
                          <p>
                            <i className="bi bi-telephone me-2"></i>
                            {contact.phone}
                          </p>
                          <p className="text-muted">
                            <i className="bi bi-person me-2"></i>
                            {contact.relationship}
                          </p>
                        </div>
                      </div>
                      <div className="contact-actions">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setEditingContact(contact.id)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={saving}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Contact */}
            {contacts.length < 5 && (
              <div className="add-contact-card">
                <h4>
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Contact
                </h4>
                <div className="row mb-2">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name"
                      value={newContact.name}
                      onChange={(e) =>
                        setNewContact({ ...newContact, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Phone Number"
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact({ ...newContact, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Relationship (e.g., Mother, Friend, Spouse)"
                  value={newContact.relationship}
                  onChange={(e) =>
                    setNewContact({ ...newContact, relationship: e.target.value })
                  }
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddContact}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Add Contact
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

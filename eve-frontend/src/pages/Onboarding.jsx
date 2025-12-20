import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile, addEmergencyContact } from '../services/profileService';
import './Onboarding.css';

function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: Home Location
  const [homeLocation, setHomeLocation] = useState(null);
  const [homeAddress, setHomeAddress] = useState('');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeSearchResults, setHomeSearchResults] = useState([]);
  const [homeSearching, setHomeSearching] = useState(false);

  // Step 3: Work Location
  const [workLocation, setWorkLocation] = useState(null);
  const [workAddress, setWorkAddress] = useState('');
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [workSearchResults, setWorkSearchResults] = useState([]);
  const [workSearching, setWorkSearching] = useState(false);
  const [skipWork, setSkipWork] = useState(false);

  // Step 4: Emergency Contacts
  const [contacts, setContacts] = useState([
    { name: '', phone: '', relationship: '', priority: 1 }
  ]);

  const totalSteps = 5;

  // Get current location
  const handleUseCurrentLocation = (locationType) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (locationType === 'home') {
            setHomeLocation([lat, lng]);
            // Reverse geocode to get address
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
              );
              const data = await response.json();
              setHomeAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            } catch (err) {
              setHomeAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          } else {
            setWorkLocation([lat, lng]);
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
              );
              const data = await response.json();
              setWorkAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            } catch (err) {
              setWorkAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          }
        },
        (error) => {
          setError('Unable to get your location. Please search for your address instead.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  // Search for location
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
      // Using Nominatim (OpenStreetMap) for geocoding - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ng`
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

  // Debounce search
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

  const selectLocation = (result, locationType) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (locationType === 'home') {
      setHomeLocation([lat, lng]);
      setHomeAddress(result.display_name);
      setHomeSearchQuery('');
      setHomeSearchResults([]);
    } else {
      setWorkLocation([lat, lng]);
      setWorkAddress(result.display_name);
      setWorkSearchQuery('');
      setWorkSearchResults([]);
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleAddContact = () => {
    if (contacts.length < 5) {
      setContacts([
        ...contacts,
        { name: '', phone: '', relationship: '', priority: contacts.length + 1 }
      ]);
    }
  };

  const handleRemoveContact = (index) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    // Update priorities
    newContacts.forEach((contact, i) => {
      contact.priority = i + 1;
    });
    setContacts(newContacts);
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };

  const validateStep = () => {
    if (currentStep === 2) {
      if (!homeLocation) {
        setError('Please set your home location');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!skipWork && !workLocation) {
        setError('Please set your work location or skip this step');
        return false;
      }
    }
    if (currentStep === 4) {
      // Validate at least one contact
      const validContacts = contacts.filter(
        c => c.name.trim() && c.phone.trim() && c.relationship.trim()
      );
      if (validContacts.length === 0) {
        setError('Please add at least one emergency contact');
        return false;
      }
    }
    return true;
  };

  const handleComplete = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      // Update profile with locations
      const profileData = {
        home_latitude: homeLocation[0],
        home_longitude: homeLocation[1],
        profile_completed: true,
      };

      if (!skipWork) {
        profileData.work_latitude = workLocation[0];
        profileData.work_longitude = workLocation[1];
      }

      await updateUserProfile(profileData);

      // Add emergency contacts
      const validContacts = contacts.filter(
        c => c.name.trim() && c.phone.trim() && c.relationship.trim()
      );

      for (const contact of validContacts) {
        await addEmergencyContact(contact);
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to complete setup. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="onboarding-step">
            <div className="step-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <h2>Welcome to Eve!</h2>
            <p className="lead">
              Let's set up your profile to keep you safe. This will only take a few minutes.
            </p>
            <div className="features-list">
              <div className="feature-item">
                <i className="bi bi-geo-alt-fill"></i>
                <span>Set your home and work locations</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-people-fill"></i>
                <span>Add emergency contacts</span>
              </div>
              <div className="feature-item">
                <i className="bi bi-bell-fill"></i>
                <span>Get real-time safety alerts</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="onboarding-step">
            <h2>Set Your Home Location</h2>
            <p>Search for your address or use your current location</p>
            
            {/* Current Location Button */}
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

            {/* Search Input */}
            <div className="location-search">
              <div className="input-group mb-3">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search for your address (e.g., Uyo, Akwa Ibom)"
                  value={homeSearchQuery}
                  onChange={(e) => setHomeSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results */}
              {homeSearching && (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Searching...</span>
                  </div>
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
                      <div>
                        <div className="result-name">{result.display_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Location */}
            {homeLocation && (
              <div className="selected-location">
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>
                  <strong>Selected:</strong>
                  <div className="mt-1">{homeAddress}</div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <h2>Set Your Work/School Location</h2>
            <p>Search for your work or school address (optional)</p>
            
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="skipWork"
                checked={skipWork}
                onChange={(e) => setSkipWork(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="skipWork">
                Skip this step
              </label>
            </div>

            {!skipWork && (
              <>
                {/* Current Location Button */}
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

                {/* Search Input */}
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

                  {/* Search Results */}
                  {workSearching && (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Searching...</span>
                      </div>
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
                          <div>
                            <div className="result-name">{result.display_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Location */}
                {workLocation && (
                  <div className="selected-location">
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle me-2"></i>
                      <strong>Selected:</strong>
                      <div className="mt-1">{workAddress}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="onboarding-step">
            <h2>Add Emergency Contacts</h2>
            <p>Add people who should be notified in case of emergency (minimum 1, maximum 5)</p>
            
            <div className="contacts-list">
              {contacts.map((contact, index) => (
                <div key={index} className="contact-form">
                  <div className="contact-header">
                    <h5>Contact {index + 1}</h5>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveContact(index)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="tel"
                        className="form-control mb-2"
                        placeholder="Phone Number"
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Relationship (e.g., Mother, Friend, Spouse)"
                    value={contact.relationship}
                    onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                  />
                </div>
              ))}
            </div>

            {contacts.length < 5 && (
              <button
                type="button"
                className="btn btn-outline-primary mt-3"
                onClick={handleAddContact}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Another Contact
              </button>
            )}
          </div>
        );

      case 5:
        return (
          <div className="onboarding-step">
            <div className="step-icon success">
              <i className="bi bi-check-circle"></i>
            </div>
            <h2>Review Your Information</h2>
            <p>Please review your setup before completing</p>
            
            <div className="review-section">
              <h5><i className="bi bi-house-fill me-2"></i>Home Location</h5>
              <p>{homeAddress || `${homeLocation[0].toFixed(6)}, ${homeLocation[1].toFixed(6)}`}</p>
            </div>

            <div className="review-section">
              <h5><i className="bi bi-building me-2"></i>Work Location</h5>
              <p>
                {skipWork 
                  ? 'Not set' 
                  : (workAddress || `${workLocation[0].toFixed(6)}, ${workLocation[1].toFixed(6)}`)
                }
              </p>
            </div>

            <div className="review-section">
              <h5><i className="bi bi-people-fill me-2"></i>Emergency Contacts</h5>
              {contacts
                .filter(c => c.name.trim() && c.phone.trim())
                .map((contact, index) => (
                  <div key={index} className="contact-review">
                    <strong>{contact.name}</strong> - {contact.phone}
                    <br />
                    <small>{contact.relationship}</small>
                  </div>
                ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="onboarding-actions">
          {currentStep > 1 && (
            <button
              className="btn btn-outline-secondary"
              onClick={handleBack}
              disabled={loading}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={loading}
            >
              Next
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Completing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;

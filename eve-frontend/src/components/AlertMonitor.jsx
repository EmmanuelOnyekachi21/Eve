import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startAlertPolling } from '../services/alertService';
import { useAudioMonitor } from '../contexts/AudioMonitorContext';
import AlertModal from './AlertModal';

function AlertMonitor() {
  const { isAudioMonitorActive } = useAudioMonitor();
  const [activeAlert, setActiveAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hasShownAlert, setHasShownAlert] = useState(new Set());
  const location = useLocation();

  // Don't monitor personal alerts if on admin dashboard
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdminPage) return;

    // Start polling for alerts every 30 seconds
    const cleanup = startAlertPolling((data) => {
      if (data.has_active_alerts && data.alerts.length > 0) {
        // Get the most recent alert
        const latestAlert = data.alerts[0];

        // Only show if we haven't shown this alert before
        if (!hasShownAlert.has(latestAlert.id)) {
          setActiveAlert(latestAlert);
          setShowModal(true);
          setHasShownAlert(prev => new Set([...prev, latestAlert.id]));
        }
      }
    }, 30000); // Poll every 30 seconds

    return cleanup;
  }, [hasShownAlert, isAdminPage]);

  const handleClose = () => {
    setShowModal(false);
  };

  const handleConfirm = (status, result) => {
    console.log('User confirmed:', status, result);
    setShowModal(false);

    if (status === 'emergency') {
      // Show success message
      alert(`Emergency alert sent to ${result.contacts_notified} contacts!`);
    } else {
      // Show confirmation
      console.log('User confirmed safe');
    }
  };

  if (isAdminPage) return null;

  return (
    <>
      {showModal && activeAlert && (
        <AlertModal
          alert={activeAlert}
          onClose={handleClose}
          onConfirm={handleConfirm}
          audioMonitorActive={isAudioMonitorActive}
        />
      )}
    </>
  );
}

export default AlertMonitor;

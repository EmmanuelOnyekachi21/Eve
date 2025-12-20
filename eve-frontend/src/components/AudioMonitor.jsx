import React, { useState, useEffect, useRef } from 'react';
import { analyzeAudio } from '../services/api';
import { useAudioMonitor } from '../contexts/AudioMonitorContext';
import './AudioMonitor.css';

/**
 * AudioMonitor Component
 * 
 * Conditionally monitors audio when risk level exceeds 70
 * Automatically records and analyzes for crisis keywords
 */
function AudioMonitor({ riskLevel, enabled = true }) {
  const { setIsAudioMonitorActive } = useAudioMonitor();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [recordingCount, setRecordingCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Threshold for activation
  const RISK_THRESHOLD = 70;
  const RECORDING_DURATION = 5000; // 5 seconds per recording
  const RECORDING_INTERVAL = 10000; // Record every 10 seconds when active

  // Start/stop monitoring based on risk level
  useEffect(() => {
    if (!enabled) {
      stopMonitoring();
      return;
    }

    if (riskLevel > RISK_THRESHOLD) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [riskLevel, enabled]);

  const startMonitoring = async () => {
    if (isRecording) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      console.log('🎤 Audio monitoring activated (Risk > 70)');
      setIsAudioMonitorActive(true);
      
      // Start first recording immediately
      startRecording();

      // Set up interval for continuous monitoring
      recordingIntervalRef.current = setInterval(() => {
        if (riskLevel > RISK_THRESHOLD) {
          startRecording();
        }
      }, RECORDING_INTERVAL);

    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access required for audio monitoring');
      setIsAudioMonitorActive(false);
    }
  };

  const stopMonitoring = () => {
    // Clear interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Stop recording if active
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsAudioMonitorActive(false);
    console.log('🎤 Audio monitoring deactivated');
  };

  const startRecording = async () => {
    if (!streamRef.current || isRecording) return;

    try {
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await analyzeAudioSample(audioBlob);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingCount(prev => prev + 1);

      // Stop after duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, RECORDING_DURATION);

    } catch (err) {
      console.error('Recording failed:', err);
      setError('Recording failed');
      setIsRecording(false);
    }
  };

  const analyzeAudioSample = async (audioBlob) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeAudio(audioBlob);
      
      setLastAnalysis({
        timestamp: new Date(),
        transcript: result.transcript,
        crisisDetected: result.crisis_detected,
        keywords: result.keywords_found,
        confidence: result.confidence,
        alertCreated: result.alert_created
      });

      if (result.crisis_detected) {
        console.warn('🚨 CRISIS DETECTED:', result.keywords_found);
        // Alert will be created by backend
      }

    } catch (err) {
      console.error('Audio analysis failed:', err);
      setError('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Don't render if not enabled
  if (!enabled) return null;

  // Only show when risk is high
  const isActive = riskLevel > RISK_THRESHOLD;

  return (
    <div className={`audio-monitor ${isActive ? 'active' : 'inactive'}`}>
      <div className="audio-monitor-header">
        <div className="audio-monitor-icon">
          {isRecording ? (
            <i className="bi bi-mic-fill recording-pulse"></i>
          ) : (
            <i className="bi bi-mic-mute-fill"></i>
          )}
        </div>
        <div className="audio-monitor-info">
          <h6 className="mb-0">Audio Monitoring</h6>
          <small className={isActive ? 'text-danger' : 'text-muted'}>
            {isActive ? 'Active - Listening for distress' : 'Standby (Risk < 70)'}
          </small>
        </div>
      </div>

      {isActive && (
        <div className="audio-monitor-status">
          {isRecording && (
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              Recording...
            </div>
          )}
          
          {isAnalyzing && (
            <div className="analyzing-indicator">
              <span className="spinner-border spinner-border-sm me-2"></span>
              Analyzing...
            </div>
          )}

          {lastAnalysis && (
            <div className={`last-analysis ${lastAnalysis.crisisDetected ? 'crisis' : 'normal'}`}>
              {lastAnalysis.crisisDetected ? (
                <>
                  <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                  <strong>Crisis detected!</strong>
                  <div className="keywords">
                    Keywords: {lastAnalysis.keywords.join(', ')}
                  </div>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  No distress detected
                </>
              )}
            </div>
          )}

          {error && (
            <div className="alert alert-warning alert-sm mb-0 mt-2">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          <div className="monitor-stats">
            <small className="text-muted">
              Samples analyzed: {recordingCount}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioMonitor;

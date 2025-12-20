# Audio Monitoring Integration Guide

## Overview

The Audio Monitoring feature has been integrated into the frontend to automatically detect distress signals when the user is in a high-risk situation.

## How It Works

### Conditional Activation
- **Threshold**: Automatically activates when risk level > 70
- **Standby Mode**: Remains inactive when risk < 70
- **Real-time**: Monitors risk level continuously

### Recording Cycle
1. **Activation**: When risk exceeds 70, requests microphone access
2. **Recording**: Captures 5-second audio samples
3. **Interval**: Records every 10 seconds while risk remains high
4. **Analysis**: Sends audio to backend for crisis detection
5. **Deactivation**: Stops when risk drops below 70

### Crisis Detection
The backend analyzes audio for distress keywords:
- "help"
- "emergency"
- "police"
- "fire"
- "ambulance"
- "danger"
- "attack"
- "stop"

## Features

### Visual Indicators
- **Microphone Icon**: Shows recording status
- **Pulsing Animation**: Active when recording
- **Status Text**: "Active" or "Standby"
- **Recording Dot**: Blinks during recording
- **Analysis Spinner**: Shows when processing

### Crisis Response
When crisis is detected:
- ✅ Alert is automatically created in backend
- ✅ Emergency contacts are notified
- ✅ Location is captured
- ✅ Audio transcript is saved
- ✅ Keywords are logged

### User Control
- **Enable/Disable**: Toggle audio monitoring on/off
- **Privacy**: Only activates in high-risk situations
- **Automatic**: No manual intervention needed

## Component Structure

```
AudioMonitor Component
├── Props
│   ├── riskLevel (number) - Current risk score
│   └── enabled (boolean) - Master enable/disable
├── State
│   ├── isRecording - Recording status
│   ├── isAnalyzing - Analysis status
│   ├── lastAnalysis - Last detection result
│   └── recordingCount - Number of samples
└── Refs
    ├── mediaRecorderRef - MediaRecorder instance
    ├── streamRef - MediaStream instance
    └── recordingIntervalRef - Interval timer
```

## API Integration

### Endpoint
```
POST /api/v1/safety/audio/analyze/
```

### Request
```javascript
FormData {
  audio: Blob (audio/wav)
}
```

### Response
```json
{
  "transcript": "help me please",
  "language": "en",
  "crisis_detected": true,
  "keywords_found": ["help"],
  "confidence": 0.95,
  "alert_created": true,
  "alert_id": 456
}
```

## Usage in Dashboard

```jsx
import AudioMonitor from '../components/AudioMonitor';

function Dashboard() {
  const [riskLevel, setRiskLevel] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);

  return (
    <AudioMonitor 
      riskLevel={riskLevel}
      enabled={audioEnabled}
    />
  );
}
```

## Browser Compatibility

### Requirements
- Modern browser with MediaRecorder API
- Microphone access permission
- HTTPS (required for getUserMedia in production)

### Supported Browsers
- ✅ Chrome 49+
- ✅ Firefox 25+
- ✅ Safari 14+
- ✅ Edge 79+

## Privacy & Security

### Microphone Access
- Only requested when risk > 70
- User must grant permission
- Can be revoked at any time

### Data Handling
- Audio sent to backend for analysis
- Not stored permanently (unless crisis detected)
- Transcripts saved only for alerts
- Anonymous processing

### User Control
- Master enable/disable toggle
- Clear visual indicators
- Automatic deactivation

## Testing

### Manual Test
1. Set risk level > 70 (use GPS Simulator)
2. Grant microphone permission
3. Speak distress keywords
4. Verify alert creation
5. Check emergency contact notifications

### Test Keywords
Try saying:
- "Help me!"
- "Emergency!"
- "Call the police!"
- "I need help!"

### Expected Behavior
- Component activates at risk > 70
- Recording indicator appears
- Audio is analyzed every 10 seconds
- Crisis keywords trigger alerts
- Deactivates when risk < 70

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS in production
- Verify microphone hardware
- Check browser console for errors

### No Crisis Detection
- Speak clearly and loudly
- Use exact keywords
- Check backend Whisper service
- Verify API endpoint is running

### High Battery Usage
- Adjust RECORDING_INTERVAL (default: 10s)
- Reduce RECORDING_DURATION (default: 5s)
- Disable when not needed

## Configuration

### Adjust Thresholds
```javascript
const RISK_THRESHOLD = 70;        // Activation threshold
const RECORDING_DURATION = 5000;  // 5 seconds per sample
const RECORDING_INTERVAL = 10000; // Record every 10 seconds
```

### Customize Keywords
Backend: `apps/safety/audio_services.py`
```python
CRISIS_KEYWORDS = [
    'help', 'emergency', 'police', 'fire',
    'ambulance', 'danger', 'attack', 'stop'
]
```

## Performance

### Resource Usage
- **CPU**: Low (only during recording)
- **Memory**: ~5MB per recording
- **Network**: ~50KB per analysis
- **Battery**: Moderate impact when active

### Optimization
- Records only when risk > 70
- 5-second samples (not continuous)
- 10-second intervals (not constant)
- Automatic cleanup

## Future Enhancements

### Planned Features
- [ ] Adjustable sensitivity
- [ ] Custom keyword training
- [ ] Offline detection
- [ ] Multi-language support
- [ ] Voice recognition
- [ ] Background recording

### Potential Improvements
- Reduce latency
- Improve accuracy
- Add more languages
- Better battery optimization
- Enhanced privacy controls

## Support

For issues or questions:
1. Check browser console for errors
2. Verify microphone permissions
3. Test with different keywords
4. Check backend logs
5. Review API responses

---

**Status**: ✅ Fully Integrated
**Version**: 1.0
**Last Updated**: December 2025

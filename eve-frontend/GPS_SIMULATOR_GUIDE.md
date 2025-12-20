# GPS Simulator & Real-Time Risk Calculation Guide

## Overview

The GPS Simulator allows you to test the Eve safety system by simulating user movement and tracking real-time risk calculations.

## Features

### 1. GPS Simulator Control Panel
Located at the top of the right column on the Dashboard.

**Controls:**
- **Start Tracking** - Begins sending location data every 10 seconds
- **Stop Tracking** - Stops all tracking
- **Simulate Stop** - Sets speed to 0 (for testing anomaly detection)
- **Teleport to Zone** - Jump to any crime zone instantly

### 2. Real-Time Risk Calculation
Every 10 seconds while tracking:
- Sends location to backend: `POST /api/v1/safety/location/`
- Calculates risk: `POST /api/v1/safety/risk/calculate/`
- Updates dashboard with results

### 3. Live Dashboard Updates
- **Risk Meter** - Circular gauge (0-100) with color transitions
- **Risk Level Badge** - Low/Medium/High
- **Status Indicator** - SAFE (green) / CAUTION (yellow) / DANGER (red)
- **Risk Factors** - Zone, Time, Speed, and Anomaly risks
- **Nearest Danger Zone** - Name, distance, and risk level
- **Anomaly Detection** - Shows detected anomalies with red warnings

## Testing Instructions

### Test 1: Basic Tracking

1. Open Dashboard: http://localhost:3000/dashboard
2. Click **"Start Tracking"** in GPS Simulator
3. Observe:
   - Speed changes to 10-25 km/h
   - "Tracking Active" badge appears
   - Location sent every 10 seconds
   - Risk meter updates

**Expected Result:**
- Risk factors populate with values
- Status shows current safety level
- Nearest danger zone displays

### Test 2: High Risk Zone

1. Click **"Start Tracking"**
2. Select **"Generator House"** from dropdown (or any high-risk zone)
3. Wait for risk calculation

**Expected Result:**
- Risk meter shows HIGH value (70-100)
- Badge shows "High"
- Status shows "DANGER" (red)
- Zone risk factor is high

### Test 3: Low Risk Zone

1. Keep tracking active
2. Select **"Reception"** from dropdown (or any low-risk zone)
3. Wait for risk calculation

**Expected Result:**
- Risk meter shows LOW value (0-40)
- Badge shows "Low"
- Status shows "SAFE" (green)
- Zone risk factor is low

### Test 4: Anomaly Detection

1. Select **"Generator House"** (high-risk zone)
2. Click **"Start Tracking"**
3. Click **"Simulate Stop"** (sets speed to 0)
4. Wait 2 minutes

**Expected Result:**
- After 2 minutes, anomaly detected
- "Anomaly Detection" card shows red alert
- Anomaly risk factor increases
- Total risk increases

### Test 5: Movement Simulation

1. Click **"Start Tracking"**
2. Rapidly switch between zones:
   - North Area
   - South Area
   - East Area
   - Crime Zone Center
3. Watch risk meter update

**Expected Result:**
- Map marker moves to each location
- Risk recalculates for each position
- Nearest danger zone updates
- Speed shows 10-25 km/h (moving)

## Dashboard Components

### Risk Meter
- **0-40**: Green (Low Risk)
- **41-70**: Yellow (Medium Risk)
- **71-100**: Red (High Risk)
- Animates smoothly with 0.5s transition
- Shows "out of 100" text

### Status Indicator
- **SAFE** (Green dot) - Risk < 40
- **CAUTION** (Yellow dot) - Risk 40-70
- **DANGER** (Red dot) - Risk > 70
- Pulses animation

### Risk Factors Card
Shows breakdown of risk components:
- **Zone Risk** - Based on crime zone data
- **Time Risk** - Based on time of day
- **Speed Risk** - Based on movement speed
- **Anomaly Risk** - Based on detected anomalies

Each factor color-coded (green/yellow/red)

### Nearest Danger Zone Card
- Zone name
- Distance in meters
- Risk level badge

### Anomaly Detection Card
- Shows "Normal" when no anomalies
- Lists all detected anomalies with red icons
- Shows count: "X Anomalies Detected!"

## API Endpoints Used

### 1. Send Location
```
POST /api/v1/safety/location/
Body: {
  "latitude": 5.125086,
  "longitude": 7.356695,
  "speed": 15.5,
  "battery_level": 100,
  "timestamp": "2024-12-17T10:30:00Z"
}
```

### 2. Calculate Risk
```
POST /api/v1/safety/risk/calculate/
Body: {
  "latitude": 5.125086,
  "longitude": 7.356695,
  "speed": 15.5
}

Response: {
  "total_risk": 45.5,
  "zone_risk": 60.0,
  "time_risk": 30.0,
  "speed_risk": 20.0,
  "anomaly_risk": 0.0,
  "nearest_danger_zone": {
    "name": "Zone A",
    "distance": 150.5,
    "risk_level": 75.0
  },
  "anomalies": []
}
```

## Speed Simulation

- **Moving**: Random 10-25 km/h
- **Stopped**: 0 km/h
- **Simulate Stop**: Forces 0 km/h for anomaly testing

## Collapsible Panel

Click the GPS Simulator header to collapse/expand:
- Saves screen space
- Keeps tracking active when collapsed
- Click again to expand

## Troubleshooting

### Issue: Risk not updating
**Solution:**
- Check backend is running
- Check browser console for errors
- Verify API endpoints are correct

### Issue: Anomalies not detected
**Solution:**
- Ensure you're in a high-risk zone
- Wait full 2 minutes after stopping
- Check backend anomaly detection logic

### Issue: Map not centering on location
**Solution:**
- Check userLocation prop is passed correctly
- Verify coordinates are valid
- Check MapUpdater component

### Issue: Tracking stops unexpectedly
**Solution:**
- Check for API errors in console
- Verify backend is responding
- Check network tab for failed requests

## Performance

- **Update Interval**: 10 seconds
- **API Response Time**: < 500ms expected
- **Animation Duration**: 0.5s smooth transitions
- **Memory Usage**: Minimal (clears intervals on unmount)

## Production Considerations

1. **Remove GPS Simulator** in production or add authentication
2. **Use real GPS** from device instead of simulation
3. **Add WebSocket** for real-time updates instead of polling
4. **Implement battery monitoring** from actual device
5. **Add offline support** with local storage
6. **Implement geofencing** alerts

## Next Steps

- [ ] Add route history tracking
- [ ] Implement heatmap visualization
- [ ] Add emergency SOS button
- [ ] Implement contact alerts
- [ ] Add voice commands
- [ ] Implement background tracking

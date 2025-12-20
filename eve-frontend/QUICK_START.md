# Quick Start Guide - GPS Simulator & Risk Calculation

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Backend
```bash
cd /path/to/eve
python manage.py runserver
```
✅ Backend running at http://localhost:8000

### Step 2: Start the Frontend
```bash
cd eve-frontend
npm start
```
✅ Frontend opens at http://localhost:3000

### Step 3: Open Dashboard
Navigate to: **http://localhost:3000/dashboard**

### Step 4: Start Tracking
1. Look at the **right column** - find "GPS Simulator" panel
2. Click **"Start Tracking"** button (green)
3. Watch the dashboard come alive! 🎉

## 🎯 Quick Tests

### Test 1: See Risk Calculation (30 seconds)
1. Click "Start Tracking"
2. Wait 10 seconds
3. Watch:
   - Risk Meter updates
   - Risk Factors populate
   - Nearest Danger Zone appears

### Test 2: High Risk Zone (1 minute)
1. Open "Teleport to Zone" dropdown
2. Select any zone with high risk (70+)
3. Watch:
   - Risk Meter turns RED
   - Badge shows "High"
   - Status shows "DANGER"

### Test 3: Low Risk Zone (1 minute)
1. Select a zone with low risk (0-40)
2. Watch:
   - Risk Meter turns GREEN
   - Badge shows "Low"
   - Status shows "SAFE"

### Test 4: Anomaly Detection (3 minutes)
1. Select a high-risk zone
2. Click "Simulate Stop"
3. Wait 2 minutes
4. Watch:
   - Anomaly Detection card shows RED alert
   - "X Anomalies Detected!" appears

## 📊 What You'll See

### Risk Meter (Left Column)
- Big circular gauge (0-100)
- Changes color: Green → Yellow → Red
- Shows risk level badge

### Live Map (Middle Column)
- Blue marker = Your location
- Colored circles = Crime zones
- Click circles for details

### GPS Simulator (Right Column - Top)
- Control panel for testing
- Shows current coordinates
- Shows speed (km/h)

### Risk Factors (Right Column)
- Zone Risk
- Time Risk
- Speed Risk
- Anomaly Risk

### Nearest Danger Zone (Right Column)
- Name of closest danger zone
- Distance in meters
- Risk level

### Anomaly Detection (Right Column - Bottom)
- Shows "Normal" or detected anomalies
- Red alerts when anomalies found

## 🎮 Controls

| Button | Action |
|--------|--------|
| Start Tracking | Begin sending location every 10s |
| Stop Tracking | Stop all tracking |
| Simulate Stop | Set speed to 0 (test anomalies) |
| Teleport to Zone | Jump to any crime zone |

## 🎨 Color Guide

| Color | Meaning | Risk Range |
|-------|---------|------------|
| 🟢 Green | SAFE | 0-40 |
| 🟡 Yellow | CAUTION | 41-70 |
| 🔴 Red | DANGER | 71-100 |

## ⚡ Pro Tips

1. **Collapse the panel**: Click "GPS Simulator" header to save space
2. **Quick zone switching**: Use dropdown to test different areas
3. **Watch the console**: Open browser DevTools (F12) to see API calls
4. **Test movement**: Rapidly switch zones to simulate walking

## 🐛 Troubleshooting

### "Cannot connect to backend"
- ✅ Check Django is running: http://localhost:8000/api/v1/safety/zones/
- ✅ Check CORS is enabled in Django settings

### Risk not updating
- ✅ Click "Start Tracking" first
- ✅ Wait 10 seconds for first update
- ✅ Check browser console for errors

### No crime zones visible
- ✅ Run: `python generate_crime_zones.py`
- ✅ Check database has zones
- ✅ Verify API returns data

### Map not showing location
- ✅ Select a zone from dropdown
- ✅ Check coordinates are valid
- ✅ Refresh the page

## 📱 Mobile Testing

For mobile devices:
1. Find your computer's IP address
2. Open: `http://YOUR_IP:3000/dashboard`
3. Allow location access
4. GPS will be more accurate on mobile!

## 🎓 Learn More

- **Full Testing Guide**: See `GPS_SIMULATOR_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **API Documentation**: See `API_INTEGRATION.md`

## 🎉 You're Ready!

Start tracking and watch Eve protect you in real-time! 🛡️

# Real GPS Tracking Guide

## 🚶 Walk Around with Eve!

Now you can use **Real GPS Tracking** to test Eve while physically walking around your campus or area.

## 🎯 What's the Difference?

### GPS Simulator (Demo Mode)
- **Purpose**: Testing without moving
- **How**: Click zones on map to teleport
- **Best for**: Development, demos, presentations
- **Location**: Simulated/manual

### Real GPS Tracker (Live Mode)
- **Purpose**: Actual field testing
- **How**: Walk around with your device
- **Best for**: Real-world testing, validation
- **Location**: Your actual GPS coordinates

## 🚀 How to Use Real GPS

### Step 1: Add to Dashboard

```jsx
// In Dashboard.jsx, import:
import RealGPSTracker from '../components/RealGPSTracker';

// In the right column, add:
<RealGPSTracker 
  onLocationChange={handleLocationChange}
  onRiskUpdate={handleRiskUpdate}
/>
```

### Step 2: Enable Location Permissions

**On Mobile (Recommended):**
1. Open the app on your phone
2. Browser will ask: "Allow location access?"
3. Click **"Allow"** or **"While Using the App"**

**On Desktop:**
1. Browser will show location permission prompt
2. Click **"Allow"**
3. Note: Desktop GPS is less accurate (uses WiFi/IP)

### Step 3: Start Tracking

1. Click **"Start Real GPS Tracking"** button
2. Wait for GPS lock (may take 10-30 seconds)
3. You'll see:
   - Your current coordinates
   - Speed (km/h)
   - GPS accuracy (±meters)
   - Distance traveled

### Step 4: Walk Around!

1. **Start walking** around your campus/area
2. Watch the map update in real-time
3. See risk scores change as you move
4. Get alerts when entering high-risk zones

## 📱 Best Practices

### For Accurate Tracking:

1. **Use a Mobile Device**
   - Phones have better GPS than laptops
   - Tablets work well too
   - Desktop uses WiFi location (less accurate)

2. **Go Outdoors**
   - GPS works best outside
   - Buildings can block signals
   - Open areas = better accuracy

3. **Keep App Open**
   - Don't minimize the browser
   - Keep screen on
   - Disable battery saver mode

4. **Walk Steadily**
   - Updates trigger every 5 meters
   - Walking speed: 3-5 km/h is ideal
   - Standing still won't trigger updates

5. **Check Accuracy**
   - Look at "Accuracy: ±Xm" display
   - Good: ±5-10m
   - Okay: ±10-20m
   - Poor: >20m (try moving to open area)

## 🗺️ Testing Scenarios

### Scenario 1: Campus Walk
**Goal**: Test risk changes across campus

1. Start at a safe area (e.g., library)
2. Walk towards known high-risk zones
3. Watch risk meter increase
4. Get alert when risk > 70
5. Walk back to safe area
6. Watch risk decrease

### Scenario 2: Time-Based Risk
**Goal**: Test how risk changes by time

1. Test during daytime (lower risk)
2. Note the risk scores
3. Test same route at night (higher risk)
4. Compare the differences

### Scenario 3: Speed Detection
**Goal**: Test anomaly detection

1. Walk normally (3-5 km/h)
2. Stop in a high-risk zone
3. Wait 2 minutes
4. Should trigger "stopped in danger zone" anomaly

### Scenario 4: Distance Tracking
**Goal**: Track your movement

1. Start tracking
2. Walk a known distance (e.g., 100m)
3. Check "Distance" counter
4. Verify accuracy

## 📊 What You'll See

### Real-Time Updates:

**Location Display:**
```
Latitude: 5.125086
Longitude: 7.356695
```

**Movement Stats:**
```
Speed: 4.2 km/h
Accuracy: ±8m
Distance: 156m
```

**Risk Updates:**
- Risk meter changes color
- Risk factors update
- Nearest danger zone updates
- Alerts trigger when risk > 70

### On the Map:
- Blue marker follows your position
- Crime zones visible around you
- Map auto-centers on your location
- Zoom in/out to see more detail

## 🔧 Troubleshooting

### "Location permission denied"
**Solution:**
- Go to browser settings
- Enable location for the site
- Reload the page
- Try again

### "Location unavailable"
**Solution:**
- Check GPS is enabled on device
- Move to an open area
- Wait 30 seconds for GPS lock
- Try restarting the app

### "Accuracy is poor (>50m)"
**Solution:**
- Move outdoors
- Wait for better satellite lock
- Check if GPS is in high-accuracy mode
- Restart device GPS

### "Not updating when I walk"
**Solution:**
- Walk at least 5 meters
- Check "Last update" timestamp
- Ensure app is in foreground
- Check internet connection

### "Speed shows 0 when walking"
**Solution:**
- Some devices don't report speed
- Speed calculated from position changes
- Walk faster (>3 km/h)
- Normal behavior on some devices

## 🎓 Understanding the Data

### Speed:
- **0 km/h**: Standing still
- **3-5 km/h**: Walking
- **8-12 km/h**: Jogging
- **>15 km/h**: Running/cycling

### Accuracy:
- **±5m**: Excellent (outdoor, clear sky)
- **±10m**: Good (normal conditions)
- **±20m**: Fair (some obstacles)
- **±50m+**: Poor (indoors/urban canyon)

### Distance:
- Cumulative total since tracking started
- Calculated using Haversine formula
- Resets when you stop/start tracking

## 🔋 Battery Considerations

Real GPS tracking uses more battery:

**Tips to Save Battery:**
1. Use only when needed
2. Stop tracking when stationary
3. Reduce screen brightness
4. Close other apps
5. Use power-saving mode (but not ultra)

**Expected Battery Usage:**
- Light: ~5-10% per hour (occasional checks)
- Moderate: ~10-20% per hour (continuous tracking)
- Heavy: ~20-30% per hour (high-accuracy + screen on)

## 📱 Mobile vs Desktop

### Mobile (Recommended):
✅ Accurate GPS (satellite-based)
✅ Speed detection
✅ Better for walking around
✅ Real-time updates
✅ Battery powered (portable)

### Desktop:
⚠️ WiFi/IP-based location
⚠️ Less accurate (±50-500m)
⚠️ No speed detection
⚠️ Can't walk around with it
✅ Good for stationary testing

## 🎯 Demo Day Usage

### For Presentations:

**Option 1: Live Demo (Risky)**
- Walk around during presentation
- Shows real-time tracking
- Impressive but unpredictable
- Have backup plan!

**Option 2: Pre-Recorded (Safe)**
- Record a walk beforehand
- Show the video
- Explain what's happening
- More reliable

**Option 3: Hybrid (Best)**
- Use GPS Simulator for main demo
- Show Real GPS as "bonus feature"
- Explain both modes
- Demonstrate versatility

## 🔄 Switching Between Modes

You can use both modes:

1. **GPS Simulator**: For quick testing
2. **Real GPS Tracker**: For field validation

**Pro Tip**: Keep both components in Dashboard:
- GPS Simulator at top (collapsed)
- Real GPS Tracker below it
- Use whichever you need!

## 📈 Data Collection

Real GPS tracking sends data to backend:

**Every Update Sends:**
```json
{
  "latitude": 5.125086,
  "longitude": 7.356695,
  "speed": 4.2,
  "battery_level": 85,
  "timestamp": "2024-12-17T10:30:00Z"
}
```

**Backend Calculates:**
- Zone risk
- Time risk
- Speed risk
- Anomaly detection
- Nearest danger zone

## 🎉 Success Stories

### "I walked across campus..."
*"Started at the library (risk: 15%), walked past the generator house (risk jumped to 85!), got an alert, then walked to the reception (risk dropped to 20%). The system works!"*

### "Tested at night..."
*"Same route, different time. Daytime risk was 30%, nighttime risk was 75%. The time-based prediction is accurate!"*

### "Stopped in danger zone..."
*"Stood still in a high-risk area for 2 minutes. Got an anomaly alert: 'Stopped in high-risk zone'. Exactly as designed!"*

## 🚀 Ready to Walk!

1. Add `RealGPSTracker` to Dashboard
2. Click "Start Real GPS Tracking"
3. Walk around your area
4. Watch Eve protect you in real-time!

**Remember**: This is the real deal - you're testing the actual safety system as it would work in production! 🛡️

---

**Questions?** Check the troubleshooting section or test with GPS Simulator first to understand the features.

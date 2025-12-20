# Testing Guide - Crime Zones API Integration

## Prerequisites

1. **Django Backend Running**
   ```bash
   cd /path/to/eve
   python manage.py runserver
   ```
   Backend should be accessible at: http://localhost:8000

2. **React Frontend Running**
   ```bash
   cd eve-frontend
   npm start
   ```
   Frontend should open at: http://localhost:3000

## Test Checklist

### ✅ Test 1: Crime Zones Loading

**Expected Behavior:**
- Map loads centered at latitude 5.125086, longitude 7.356695
- Zoom level 16
- Top-right badge shows "X zones loaded" (should be ~60 zones)
- Colored circles appear on the map

**How to Test:**
1. Open http://localhost:3000/dashboard
2. Wait for map to load
3. Check top-right corner for zones badge
4. Verify circles are visible on the map

**Success Criteria:**
- Badge shows "60 zones loaded" (or similar number)
- Multiple colored circles visible
- No error messages

### ✅ Test 2: Risk Level Color Coding

**Expected Colors:**
- **Green circles**: Risk level 0-40 (Low risk)
- **Yellow circles**: Risk level 41-70 (Medium risk)
- **Red circles**: Risk level 71-100 (High risk)

**How to Test:**
1. Look at the map
2. Identify circles of different colors
3. Click on each circle to see popup
4. Verify risk level matches color

**Success Criteria:**
- Green circles show risk_level ≤ 40
- Yellow circles show risk_level 41-70
- Red circles show risk_level ≥ 71

### ✅ Test 3: Zone Tooltips

**Expected Behavior:**
- Clicking a circle shows a popup
- Popup displays zone name and risk level

**How to Test:**
1. Click on any colored circle
2. Read the popup content

**Success Criteria:**
- Popup shows zone name (e.g., "Zone A")
- Popup shows risk level number
- Risk level is color-coded

### ✅ Test 4: User Location

**Expected Behavior:**
- Browser asks for location permission
- Blue marker shows user's actual location
- Map centers on user location (if permission granted)

**How to Test:**
1. Reload the page
2. Click "Allow" when browser asks for location
3. Wait for map to update

**Success Criteria:**
- Blue marker appears at your location
- Map centers on your location
- Marker popup shows your coordinates

### ✅ Test 5: Error Handling - Backend Down

**Expected Behavior:**
- Error banner appears
- Message: "Cannot connect to backend..."
- "Retry" button is visible

**How to Test:**
1. Stop Django server (Ctrl+C)
2. Reload the frontend page
3. Observe error message
4. Click "Retry" button
5. Start Django server again
6. Click "Retry" button again

**Success Criteria:**
- Error banner appears when backend is down
- "Retry" button works
- Zones load after backend restarts

### ✅ Test 6: Map Controls

**Expected Features:**
- Zoom controls (top-right)
- Scale control (bottom-left)
- Draggable map
- Clickable zones

**How to Test:**
1. Click zoom in/out buttons
2. Drag the map around
3. Check scale indicator at bottom-left

**Success Criteria:**
- All controls work smoothly
- Map is responsive
- Scale updates when zooming

### ✅ Test 7: Live Map Page

**How to Test:**
1. Navigate to http://localhost:3000/live-map
2. Verify full-screen map
3. Check legend at bottom

**Success Criteria:**
- Map fills the screen
- Legend shows color meanings
- All zones visible

## Browser Console Checks

Open browser console (F12) and check for:

1. **Successful API Call:**
   ```
   Loaded crime zones: 60
   ```

2. **User Location:**
   ```
   Got user location: [latitude] [longitude]
   ```

3. **No Errors:**
   - No red error messages
   - No CORS errors
   - No 404 errors

## Common Issues

### Issue: "Cannot connect to backend"
**Solution:** 
- Verify Django is running: http://localhost:8000/api/v1/safety/zones/
- Check CORS settings in Django settings.py

### Issue: No zones visible
**Solution:**
- Check browser console for errors
- Verify API returns data: http://localhost:8000/api/v1/safety/zones/
- Run: `python generate_crime_zones.py` to create zones

### Issue: Map not centering on user location
**Solution:**
- Allow location permission in browser
- Check browser console for geolocation errors
- Try in a different browser

### Issue: Circles not colored correctly
**Solution:**
- Verify risk_level field in API response
- Check getRiskColor() function in api.js

## API Response Verification

Test the API directly in browser:

1. **All Zones:**
   http://localhost:8000/api/v1/safety/zones/

2. **Nearby Zones:**
   http://localhost:8000/api/v1/safety/zones/nearby/?lat=5.125086&lon=7.356695&radius=5000

Expected response format:
```json
[
  {
    "id": 1,
    "name": "Zone_1",
    "latitude": 5.125086,
    "longitude": 7.356695,
    "radius": 500,
    "risk_level": 45
  }
]
```

## Performance Expectations

- **Initial Load:** < 2 seconds
- **Zone Rendering:** < 1 second for 60 zones
- **Map Interaction:** Smooth, no lag
- **API Response:** < 500ms

## Success Metrics

✅ All 60 zones load and display
✅ Colors match risk levels
✅ User location works
✅ Error handling works
✅ Map is interactive and smooth
✅ No console errors

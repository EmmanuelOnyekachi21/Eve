# Predictions Page - Troubleshooting Guide

## Issue: Heatmap Takes Forever to Load

### Solution Implemented ✅

The page now has automatic fallback to mock data:

1. **3-second timeout**: If API doesn't respond in 3 seconds, mock data loads automatically
2. **Demo mode notification**: Blue banner shows when using simulated data
3. **Realistic mock data**: 441 points with 24 hours of predictions each

### What You'll See

**When Backend is Available:**
- Heatmap loads from API
- No notification banner
- Real prediction data

**When Backend is Unavailable:**
- After 3 seconds, mock data loads
- Blue "Demo Mode" banner appears
- Simulated but realistic data

### Mock Data Characteristics

- **Grid**: 21x21 points around center (5.125086, 7.356695)
- **Coverage**: ~2km x 2km area
- **Hours**: All 24 hours (0-23)
- **Risk Pattern**: 
  - Higher risk further from center
  - Higher risk at night (20:00-02:00)
  - Random variation for realism

## Other Common Issues

### Issue: "Cannot read property 'length' of undefined"

**Cause**: Heatmap data not loaded yet

**Solution**: 
- Wait for loading to complete
- Check browser console for errors
- Refresh the page

### Issue: No circles visible on map

**Cause**: 
- Data loaded but filtered to 0 points
- Wrong hour selected
- Map zoom too far out

**Solution**:
1. Move hour slider to different times
2. Check "Total Predictions" in summary (should be > 0)
3. Zoom in on map
4. Check browser console: `console.log(filteredData)`

### Issue: Prediction button doesn't work

**Cause**: No location selected

**Solution**:
1. Click anywhere on the map first
2. Blue circle should appear
3. Then click "Get Prediction"

### Issue: High risk zones list is empty

**Cause**: No zones with risk > 70% at selected hour

**Solution**:
- Try different hours (especially 20:00-02:00)
- This is normal for safe hours
- Check summary card for "High Risk Zones" count

## Checking Backend Status

### 1. Test Heatmap Endpoint
```bash
curl http://localhost:8000/api/v1/safety/heatmap/?lat=5.125086&lon=7.356695
```

**Expected**: JSON array with prediction points

**If fails**: Mock data will be used automatically

### 2. Test Prediction Endpoint
```bash
curl -X POST http://localhost:8000/api/v1/safety/predict/ \
  -H "Content-Type: application/json" \
  -d '{"latitude": 5.125086, "longitude": 7.356695, "hour": 14, "day_of_week": 2}'
```

**Expected**: JSON object with risk_percentage, confidence, etc.

**If fails**: Mock prediction will be generated

## Performance Issues

### Slow Map Rendering

**Symptoms**: Map lags when moving slider

**Causes**:
- Too many points (>1000)
- Browser performance
- Large circle radius

**Solutions**:
1. Reduce point density in mock data
2. Increase circle radius (fewer circles)
3. Use Chrome/Firefox (better performance)
4. Close other browser tabs

### Memory Issues

**Symptoms**: Browser becomes slow/unresponsive

**Causes**:
- Too much data in memory
- Memory leak

**Solutions**:
1. Refresh the page
2. Clear browser cache
3. Restart browser
4. Reduce mock data size

## Browser Console Debugging

Open DevTools (F12) and check console for:

### Successful Load
```
Heatmap data loaded from API: 500
```

### Mock Data Fallback
```
API timeout - using mock data
Using mock data due to API error
```

### Prediction Success
```
Prediction result from API: {risk_percentage: 45.5, ...}
```

### Prediction Fallback
```
Prediction API timeout - using mock data
Using mock prediction due to API error
```

## Network Tab Debugging

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for:
   - `heatmap/` request
   - `predict/` request

### Check Status Codes
- **200**: Success
- **404**: Endpoint not found
- **500**: Server error
- **Failed**: Network error / CORS issue

## CORS Issues

### Symptoms
```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

### Solution
Check Django settings.py:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

## Mock Data Configuration

### Adjust Grid Size
In `PredictionsNew.jsx`:
```javascript
// Change loop ranges to adjust density
for (let i = -10; i <= 10; i++) {  // Change -10 and 10
  for (let j = -10; j <= 10; j++) {  // Change -10 and 10
```

### Adjust Risk Calculation
```javascript
const baseRisk = Math.min(100, (distance * 3) + timeRisk + (Math.random() * 20));
// Change multipliers to adjust risk levels
```

### Adjust Timeout
```javascript
const timeoutId = setTimeout(() => {
  // ...
}, 3000); // Change 3000 (milliseconds)
```

## Quick Fixes

### Force Mock Data Immediately
Comment out API call:
```javascript
// const data = await getHeatmap(mapCenter[0], mapCenter[1]);
const mockData = generateMockHeatmap();
setHeatmapData(mockData);
setUsingMockData(true);
```

### Disable Mock Data Fallback
Remove timeout:
```javascript
// Comment out the setTimeout block
// const timeoutId = setTimeout(() => { ... }, 3000);
```

### Hide Demo Mode Banner
```javascript
{usingMockData && false && (  // Add "&& false"
  <div className="alert alert-info">...</div>
)}
```

## Getting Help

1. **Check browser console** for error messages
2. **Check network tab** for failed requests
3. **Verify backend is running**: http://localhost:8000
4. **Test API endpoints** with curl/Postman
5. **Check Django logs** for server errors

## Expected Behavior

### Normal Flow
1. Page loads → Shows loading spinner
2. After 0-3 seconds → Heatmap appears
3. Move slider → Map updates instantly
4. Click map → Blue circle appears
5. Click "Get Prediction" → Results show in 0-2 seconds

### Demo Mode Flow
1. Page loads → Shows loading spinner
2. After 3 seconds → Mock data loads
3. Blue banner appears: "Demo Mode"
4. Everything else works normally
5. Predictions use simulated data

## Success Indicators

✅ Heatmap loads within 3 seconds
✅ Circles appear on map
✅ Hour slider updates map instantly
✅ Click-to-select works
✅ Predictions return results
✅ No console errors
✅ Smooth performance

## When to Use Mock Data

**Development**: Always available as fallback
**Testing**: Test UI without backend
**Demo**: Show features without API
**Production**: Should use real API only

## Disabling Mock Data for Production

In `PredictionsNew.jsx`, remove the timeout and fallback:
```javascript
try {
  const data = await getHeatmap(mapCenter[0], mapCenter[1]);
  if (data && data.length > 0) {
    setHeatmapData(data);
  } else {
    // Show error instead of mock data
    setError('No prediction data available');
  }
} catch (error) {
  // Show error instead of mock data
  setError('Failed to load predictions');
}
```

This ensures production only uses real data.

# Route Search Architecture

## How Location Search Works with Backend Route Analysis

### Complete Flow

```
User Types Location Name
        ↓
Frontend: OpenStreetMap Geocoding API
        ↓
Converts "University of Port Harcourt" → (5.125086, 7.356695)
        ↓
User Clicks "Analyze Route"
        ↓
Frontend: getSafeRoute(startLat, startLon, endLat, endLon)
        ↓
Backend: POST /api/safety/suggest-route/
        ↓
Backend: ThreatPredictor analyzes route
        ↓
Backend: Returns safety analysis with waypoints
        ↓
Frontend: Displays results on map
```

## Components

### 1. Frontend Location Search (NEW)
**File**: `eve-frontend/src/components/SafeRoutePanel.jsx`

**Purpose**: Help users find destinations by name instead of coordinates

**How it works**:
- User types location name (e.g., "Port Harcourt Mall")
- Calls OpenStreetMap Nominatim API
- Returns up to 5 matching locations with coordinates
- User selects one → coordinates auto-populate

**API Used**: `https://nominatim.openstreetmap.org/search`

**Example**:
```javascript
// User searches: "University of Port Harcourt"
// API returns:
{
  "display_name": "University of Port Harcourt, Rivers State, Nigeria",
  "lat": "5.125086",
  "lon": "7.356695"
}
// These coordinates are then used for route analysis
```

### 2. Frontend Route Service (EXISTING)
**File**: `eve-frontend/src/services/enhancedPredictionService.js`

**Function**: `getSafeRoute(startLat, startLon, endLat, endLon)`

**Purpose**: Send coordinates to backend for route analysis

**Request**:
```javascript
POST /api/safety/suggest-route/
{
  "start_lat": 5.125086,
  "start_lon": 7.356695,
  "end_lat": 5.130000,
  "end_lon": 7.360000,
  "departure_time": "2024-12-18T22:00:00Z"  // optional
}
```

### 3. Backend Route Analyzer (EXISTING)
**File**: `apps/safety/views.py`

**Endpoint**: `POST /api/safety/suggest-route/`

**Purpose**: Analyze route safety using ML predictions

**What it does**:
1. Generates waypoints along the route (6 points)
2. For each waypoint:
   - Calls `ThreatPredictor.predict(lat, lon, hour, day_of_week)`
   - Gets risk probability and confidence
3. Finds nearby safe zones (CrimeZone with risk_level ≤ 30)
4. Generates recommendations based on:
   - Average risk along route
   - Maximum risk point
   - Time of day (night = higher risk)
   - Available safe zones
5. Calculates:
   - Overall safety score (0-100)
   - Distance (km)
   - Estimated travel time

**Response**:
```json
{
  "route_analysis": {
    "average_risk": 45.2,
    "maximum_risk": 75.0,
    "safety_score": 55,
    "distance_km": 2.5
  },
  "waypoints": [
    {
      "latitude": 5.125086,
      "longitude": 7.356695,
      "risk_probability": 0.35,
      "risk_percentage": 35,
      "confidence": "High"
    },
    // ... more waypoints
  ],
  "safe_zones_nearby": [
    {
      "name": "Market Square",
      "latitude": 5.126,
      "longitude": 7.357,
      "distance_meters": 150.5,
      "risk_level": 15
    }
  ],
  "recommendations": [
    "⚠️ High-risk area detected (risk: 75%)",
    "🌙 Night time travel - extra caution advised",
    "✅ 2 safe zone(s) available along route"
  ],
  "overall_safety_score": 55,
  "estimated_travel_time_minutes": 37,
  "departure_info": {
    "hour": 22,
    "day_of_week": 4,
    "is_night": true
  }
}
```

### 4. ML Prediction Model (EXISTING)
**File**: `ml/prediction_service.py`

**Class**: `ThreatPredictor`

**Purpose**: LSTM model that predicts crime risk

**Input Features**:
- Latitude
- Longitude
- Hour of day (0-23)
- Day of week (0-6)

**Output**:
- Risk probability (0.0 - 1.0)
- Risk percentage (0 - 100)
- Confidence level (Low/Medium/High/Very High)

**Training Data**: Historical incident reports from `apps/prediction/models.py`

## Data Flow Example

### Scenario: User wants to go to "University of Port Harcourt"

**Step 1: Location Search**
```
User Input: "University of Port Harcourt"
↓
OpenStreetMap API Call
↓
Result: lat=5.125086, lon=7.356695
```

**Step 2: Route Analysis Request**
```javascript
// Frontend calls
getSafeRoute(
  5.120000, 7.350000,  // Current location
  5.125086, 7.356695   // University (from search)
)
```

**Step 3: Backend Processing**
```python
# Backend generates 6 waypoints
waypoints = [
  (5.120000, 7.350000),  # Start
  (5.121017, 7.351139),  # Point 1
  (5.122034, 7.352278),  # Point 2
  (5.123051, 7.353417),  # Point 3
  (5.124068, 7.354556),  # Point 4
  (5.125086, 7.356695)   # End (University)
]

# For each waypoint, predict risk
for waypoint in waypoints:
    prediction = threat_predictor.predict(
        lat=waypoint[0],
        lon=waypoint[1],
        hour=22,  # 10 PM
        day_of_week=4  # Friday
    )
    # Returns: risk_probability, confidence
```

**Step 4: Risk Analysis**
```python
# Calculate metrics
average_risk = 0.45  # 45%
maximum_risk = 0.75  # 75% (at waypoint 3)
safety_score = 55    # (1 - 0.45) * 100

# Find safe zones nearby
safe_zones = CrimeZone.objects.filter(
    risk_level__lte=30,
    location__distance_lte=(route_center, 500m)
)

# Generate recommendations
if max_risk > 0.7:
    recommendations.append("⚠️ High-risk area detected")
if hour >= 22:
    recommendations.append("🌙 Night time - extra caution")
```

**Step 5: Frontend Display**
```
Map shows:
- Route line with color-coded risk
- Waypoint markers (green/yellow/red)
- Safe zone markers (blue)
- Current location (user icon)

Panel shows:
- Safety Score: 55/100 (Medium)
- Distance: 2.5 km
- Est. Time: 37 minutes
- Recommendations list
- Safe zones list
```

## Key Points

### ✅ What Location Search Does
- Makes it easy for users to find destinations
- Converts place names to coordinates
- No backend changes needed

### ✅ What Location Search Does NOT Do
- Does NOT analyze routes (that's the backend's job)
- Does NOT predict crime risk (that's the ML model's job)
- Does NOT store location data (just passes coordinates)

### ✅ Backend Route Analyzer Already Handles
- ML-based risk prediction for each waypoint
- Finding nearby safe zones
- Generating safety recommendations
- Calculating optimal routes
- Time-based risk adjustments
- Distance and travel time estimates

## Why This Architecture Works

1. **Separation of Concerns**
   - Frontend: User interface and location lookup
   - Backend: Business logic and ML predictions
   - ML Model: Risk calculations

2. **Scalability**
   - Can swap geocoding providers without changing backend
   - Can improve ML model without changing frontend
   - Can add more route analysis features in backend

3. **Performance**
   - Geocoding happens client-side (no backend load)
   - Route analysis cached on backend
   - ML predictions optimized with batch processing

4. **User Experience**
   - Fast location search (OpenStreetMap is quick)
   - Accurate route analysis (ML model trained on real data)
   - Clear safety recommendations (backend generates context-aware tips)

## Future Enhancements

### Frontend
- [ ] Recent searches history
- [ ] Favorite locations
- [ ] Voice search
- [ ] Offline location cache

### Backend
- [ ] Alternative route suggestions
- [ ] Real-time traffic integration
- [ ] Weather-based risk adjustments
- [ ] Community-reported incidents

### ML Model
- [ ] More training data
- [ ] Additional features (weather, events, etc.)
- [ ] Real-time model updates
- [ ] Ensemble predictions

## Testing the Complete Flow

### 1. Test Location Search
```javascript
// In browser console
fetch('https://nominatim.openstreetmap.org/search?format=json&q=University+of+Port+Harcourt')
  .then(r => r.json())
  .then(console.log)
```

### 2. Test Route Analysis
```bash
curl -X POST http://localhost:8000/api/safety/suggest-route/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "start_lat": 5.120000,
    "start_lon": 7.350000,
    "end_lat": 5.125086,
    "end_lon": 7.356695
  }'
```

### 3. Test Complete Flow
1. Open app → Navigate to Safe Route Planner
2. Search for "University of Port Harcourt"
3. Select result from dropdown
4. Click "Analyze Route"
5. Verify map shows route with waypoints
6. Verify panel shows safety score and recommendations

## Troubleshooting

### Location Search Not Working
- Check internet connection (needs OpenStreetMap access)
- Check browser console for CORS errors
- Verify search query is not empty

### Route Analysis Fails
- Check backend is running
- Verify ML model is loaded (`threat_predictor` not None)
- Check coordinates are valid (lat: -90 to 90, lon: -180 to 180)
- Verify user is authenticated

### Wrong Risk Predictions
- Check ML model training data
- Verify waypoint generation is correct
- Check time/day parameters are accurate
- Review CrimeZone data in database

## Summary

The location search feature is a **frontend enhancement** that makes the existing backend route analyzer more user-friendly. It doesn't change how routes are analyzed - it just makes it easier for users to specify destinations. The backend's ML-powered route analysis remains the core of the safety system.

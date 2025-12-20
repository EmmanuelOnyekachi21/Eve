# API Integration Guide

## Overview

The Eve frontend now connects to the Django backend API to display real crime zones on the map.

## API Endpoints Used

### 1. Fetch All Crime Zones
```
GET http://localhost:8000/api/v1/safety/zones/
```

**Response Format:**
```json
[
  {
    "id": 1,
    "name": "Zone Name",
    "latitude": 5.125086,
    "longitude": 7.356695,
    "radius": 500,
    "risk_level": 45
  },
  ...
]
```

### 2. Fetch Nearby Zones
```
GET http://localhost:8000/api/v1/safety/zones/nearby/?lat=5.125086&lon=7.356695&radius=5000
```

**Parameters:**
- `lat` - Latitude (required)
- `lon` - Longitude (required)
- `radius` - Search radius in meters (default: 5000)

## Map Display

### Risk Level Color Coding

The map displays crime zones with color-coded circles based on risk level:

- **Green** (0-40): Low risk
  - Color: `#10b981`
  - Fill: `rgba(16, 185, 129, 0.3)`

- **Yellow** (41-70): Medium risk
  - Color: `#f59e0b`
  - Fill: `rgba(245, 158, 11, 0.3)`

- **Red** (71-100): High risk
  - Color: `#ef4444`
  - Fill: `rgba(239, 68, 68, 0.3)`

### Map Configuration

- **Default Center**: Latitude 5.125086, Longitude 7.356695
- **Zoom Level**: 16
- **Map Height**: 600px
- **Tile Provider**: OpenStreetMap (free, no API key required)

### Features

- ✅ Real-time crime zone loading from backend
- ✅ User location tracking with GPS
- ✅ Interactive circles for each crime zone
- ✅ Hover tooltips showing zone name and risk level
- ✅ Zoom and scale controls
- ✅ Zone count badge
- ✅ Error handling with retry button
- ✅ Loading states

## Error Handling

### Backend Connection Error

If the backend is not running, users will see:
```
Cannot connect to backend. Make sure Django server is running at localhost:8000
```

A "Retry" button allows users to attempt reconnection.

### Location Permission Denied

If users deny location access:
```
Location access denied. Showing default location.
```

The map will center on the default location (5.125086, 7.356695).

## Testing

### 1. Start the Django Backend
```bash
cd /path/to/eve
python manage.py runserver
```

### 2. Start the React Frontend
```bash
cd eve-frontend
npm start
```

### 3. Verify Crime Zones

1. Open http://localhost:3000
2. Allow location access when prompted
3. Check the top-right badge showing "X zones loaded"
4. Verify colored circles appear on the map
5. Click on circles to see zone details

### 4. Test Error Handling

1. Stop the Django server
2. Reload the page
3. Verify error message appears
4. Click "Retry" button
5. Start Django server
6. Click "Retry" again - zones should load

## Files Modified

- `src/services/api.js` - API service functions
- `src/components/LiveMapComponent.jsx` - Map component with API integration
- `src/components/LiveMapComponent.css` - Styling for badges and error messages

## Next Steps

## Available Backend Endpoints

Based on the Django backend structure:

- `POST /api/v1/safety/location/` - Location tracking
- `GET /api/v1/safety/zones/` - Get all crime zones
- `GET /api/v1/safety/zones/nearby/` - Get nearby zones
- `POST /api/v1/safety/risk/calculate/` - Calculate risk
- `POST /api/v1/safety/audio/analyze/` - Audio analysis
- `POST /api/v1/safety/predict/` - Threat prediction
- `GET /api/v1/safety/heatmap/` - Get heatmap data

## Next Steps

- [ ] Implement real-time risk calculation API
- [ ] Add WebSocket support for live updates
- [ ] Implement nearest danger zone calculation
- [ ] Add AI prediction API integration
- [ ] Add user authentication

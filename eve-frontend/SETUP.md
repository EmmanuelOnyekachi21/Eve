# Eve Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd eve-frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   
   The app will open at `http://localhost:3000`

3. **Ensure Backend is Running**
   
   The Django backend should be running at `http://localhost:8000`
   
   Make sure CORS is configured in Django settings:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
   ]
   ```

## What's Included

### Pages
- **Dashboard** (`/dashboard`) - Main monitoring interface with 3-column layout
- **Live Map** (`/live-map`) - Full-screen interactive map
- **Predictions** (`/predictions`) - AI forecasting interface
- **About** (`/about`) - System information

### Components
- **RiskMeter** - Circular gauge showing risk score (0-100)
- **LiveMapComponent** - Leaflet map with user location and crime zones
- **RiskFactors** - Card showing zone, time, speed risks and anomalies
- **NearestDanger** - Card showing closest danger zone info
- **AIPrediction** - Card showing AI model predictions

## Current State

The application is fully functional with:
- ✅ Complete UI/UX design
- ✅ Responsive layout (mobile-friendly)
- ✅ Interactive map with Leaflet.js
- ✅ Placeholder data displayed
- ✅ Modern animations and hover effects
- ⏳ API integration (to be implemented)

## Next Steps

To connect to the backend API:

1. Add axios for HTTP requests:
   ```bash
   npm install axios
   ```

2. Create an API service file (`src/services/api.js`)

3. Update components to fetch real data from:
   - `/api/safety/current-risk/`
   - `/api/safety/crime-zones/`
   - `/api/prediction/predict/`

## Troubleshooting

**Map not loading?**
- Check browser console for errors
- Ensure Leaflet CSS is loaded in `public/index.html`

**Styles not working?**
- Verify Bootstrap 5 CDN is loaded
- Check that CSS files are imported in components

**Port already in use?**
- Change port: `PORT=3001 npm start`

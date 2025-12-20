# Eve Frontend - AI-Powered Personal Safety System

React-based frontend for the Eve personal safety application.

## Features

- **Dashboard**: Real-time risk monitoring with interactive map
- **Live Map**: Full-screen location tracking with crime zone visualization
- **Predictions**: AI-powered threat forecasting
- **About**: Information about the system and team

## Tech Stack

- React 18+ (Functional Components & Hooks)
- React Router DOM v6
- Bootstrap 5 (CDN)
- Leaflet.js for maps
- React-Leaflet

## Installation

```bash
cd eve-frontend
npm install
```

## Running the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Backend API

The frontend expects the Django backend to be running at `http://localhost:8000/api`

Make sure CORS is enabled on the backend to allow requests from `http://localhost:3000`

## Project Structure

```
eve-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── RiskMeter.jsx
│   │   ├── LiveMapComponent.jsx
│   │   ├── RiskFactors.jsx
│   │   ├── NearestDanger.jsx
│   │   └── AIPrediction.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── LiveMap.jsx
│   │   ├── Predictions.jsx
│   │   └── About.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
└── package.json
```

## Color Scheme

- Primary: #2563eb (blue)
- Success: #10b981 (green)
- Warning: #f59e0b (yellow)
- Danger: #ef4444 (red)
- Background: #f8fafc (light gray)

## Notes

- Currently displays placeholder data
- API integration to be implemented
- Responsive design for mobile devices
- Uses free Leaflet.js maps (no API key required)

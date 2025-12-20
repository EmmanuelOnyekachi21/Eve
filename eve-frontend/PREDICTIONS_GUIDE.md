# AI Threat Predictions - User Guide

## Overview

The Predictions page provides 24-hour threat forecasting using machine learning. It displays a heatmap showing predicted risk levels across different locations and times.

## Features

### 1. Summary Dashboard
At the top of the page, you'll see four key metrics:

- **Model Accuracy**: 94% - The accuracy of the LSTM neural network
- **Total Predictions**: Number of prediction points for the selected hour
- **High Risk Zones**: Count of areas with risk > 70%
- **Current Status**: Overall safety status (Safe/Warning/Danger)

### 2. Interactive Heatmap (Left Column - 60%)

#### Map Display
- Shows prediction points as colored circles
- **Green**: Low threat (0-30%)
- **Yellow**: Moderate threat (31-60%)
- **Red**: High threat (61-100%)
- Intensity increases with risk level

#### Hour Slider
- Located at the bottom of the map
- Drag to select any hour (0-23)
- Map updates in real-time to show predictions for that hour
- Current selection displayed: "Predictions for [Day] [Hour]:00"

#### Map Interaction
- **Click anywhere** on the map to select a location
- Selected location marked with blue circle
- Click "Get Prediction" to analyze that specific point

#### Legend
- Shows color scale from 0% (green) to 100% (red)
- Helps interpret risk levels at a glance

### 3. Prediction Details (Right Column - 40%)

#### Location Selection
- Click on map to select a point
- Coordinates displayed in the card
- Hour selector dropdown (00:00 - 23:00)
- "Get Prediction" button to analyze

#### Results Display
When you click "Get Prediction", you'll see:

- **Large Risk Percentage**: Color-coded number (0-100%)
- **Confidence Badge**: 
  - Very High (90%+) - Green
  - High (75-89%) - Blue
  - Medium (60-74%) - Yellow
  - Low (<60%) - Gray
- **Nearest Zone**: Closest crime zone to selected point
- **Predicted For**: Day and time of prediction

### 4. High Risk Zones List

- Shows top 10 highest risk locations for selected hour
- Ranked by risk percentage
- Click any zone to zoom to it on map (coming soon)
- Updates when you change the hour

### 5. Safest Routes

- Placeholder for future feature
- Will show optimal routes avoiding high-risk areas

## How to Use

### Basic Usage

1. **Open Predictions Page**
   - Click "Predictions" in navigation bar
   - Wait for heatmap data to load

2. **Explore Different Times**
   - Move the hour slider at bottom of map
   - Watch heatmap update for each hour
   - Notice how risk patterns change throughout the day

3. **Get Specific Prediction**
   - Click any location on the map
   - Select desired hour from dropdown
   - Click "Get Prediction"
   - View detailed risk analysis

### Advanced Usage

#### Finding High-Risk Times
1. Move slider through all 24 hours
2. Watch "High Risk Zones" count in summary
3. Note hours with most red zones
4. Plan activities to avoid those times

#### Comparing Locations
1. Click first location, get prediction
2. Note the risk percentage
3. Click second location, get prediction
4. Compare risk levels

#### Route Planning
1. Identify your start and end points
2. Check predictions for your travel time
3. Look for green (safe) zones along the way
4. Avoid red (high-risk) areas

## Understanding the Data

### Risk Percentage
- **0-30%**: Low risk - Generally safe
- **31-60%**: Moderate risk - Exercise caution
- **61-100%**: High risk - Avoid if possible

### Confidence Level
Indicates how certain the AI model is about the prediction:
- **Very High**: Model is very confident
- **High**: Model is confident
- **Medium**: Moderate confidence
- **Low**: Less reliable prediction

### Time Patterns
Risk levels typically vary by:
- **Early Morning (0-6)**: Generally lower risk
- **Daytime (6-18)**: Variable, depends on location
- **Evening (18-24)**: Often higher risk in certain areas

## API Endpoints

### Get Prediction
```
POST /api/v1/safety/predict/
Body: {
  "latitude": 5.125086,
  "longitude": 7.356695,
  "hour": 14,
  "day_of_week": 2
}

Response: {
  "risk_percentage": 45.5,
  "confidence": 85.0,
  "nearest_zone": "Zone A",
  "predicted_for": "Wednesday 14:00"
}
```

### Get Heatmap
```
GET /api/v1/safety/heatmap/?lat=5.125086&lon=7.356695

Response: [
  {
    "latitude": 5.125086,
    "longitude": 7.356695,
    "hour": 14,
    "risk_percentage": 45.5
  },
  ...
]
```

## Tips & Best Practices

### For Daily Use
1. **Check before leaving**: View predictions for your departure time
2. **Plan ahead**: Look at predictions for your entire journey
3. **Stay flexible**: If risk is high, consider delaying or changing route

### For Route Planning
1. **Check multiple hours**: Risk changes throughout the day
2. **Look for patterns**: Some areas are consistently safer
3. **Consider alternatives**: Multiple routes may have different risk levels

### For Emergency Planning
1. **Identify safe zones**: Areas with consistently low risk
2. **Note high-risk times**: When to be extra cautious
3. **Plan escape routes**: Know safe paths from any location

## Troubleshooting

### Heatmap not loading
- Check backend is running: http://localhost:8000/api/v1/safety/heatmap/
- Check browser console for errors
- Refresh the page

### Predictions not updating
- Ensure you clicked "Get Prediction" button
- Check selected location is valid
- Verify backend API is responding

### Map not responding to clicks
- Ensure map has fully loaded
- Try clicking in different areas
- Check browser console for errors

### Hour slider not working
- Refresh the page
- Check if heatmap data loaded successfully
- Try different browser

## Performance

- **Initial Load**: 2-3 seconds for heatmap data
- **Hour Change**: Instant (client-side filtering)
- **Prediction Request**: < 1 second
- **Map Rendering**: Smooth for up to 1000 points

## Future Enhancements

- [ ] Click high-risk zones to zoom
- [ ] Route optimization algorithm
- [ ] Historical comparison
- [ ] Export predictions as PDF
- [ ] Mobile app with notifications
- [ ] Real-time updates via WebSocket
- [ ] Dark mode toggle
- [ ] Custom time range selection
- [ ] Multi-day forecasting

## Technical Details

### Model Information
- **Type**: LSTM Neural Network
- **Accuracy**: 94%
- **Training Data**: Historical crime incidents
- **Features**: Location, time, day of week, weather, etc.
- **Update Frequency**: Daily retraining

### Data Points
- Each point represents a 10m x 10m area
- Predictions generated for all 24 hours
- Coverage area: ~2km radius from center
- Total points: ~500-1000 per hour

### Color Gradient
- Uses RGB interpolation
- Smooth transitions between risk levels
- Opacity increases with risk
- Optimized for colorblind accessibility

## Privacy & Security

- No personal data collected
- Predictions are anonymous
- Location data not stored
- All processing server-side
- HTTPS encryption (production)

## Support

For issues or questions:
- Check browser console (F12)
- Review API documentation
- Contact development team
- Submit bug report on GitHub

## Credits

Built with:
- React 18
- Leaflet.js
- Django REST Framework
- PyTorch LSTM Model
- Bootstrap 5

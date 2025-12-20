# 📝 Incident Reporting Feature

## Overview

The Incident Reporting feature allows users to report safety incidents in their area, which helps train and improve the AI prediction model. This creates a feedback loop where real-world data continuously enhances the system's accuracy.

## How It Works

### User Flow

1. **Access the Feature**
   - Click the red floating action button (FAB) on the Dashboard
   - Or navigate to "Report" in the main navigation menu
   - Or go directly to `/report-incident`

2. **Fill Out the Report**
   - **Incident Type**: Select from Robbery, Assault, Kidnapping, Theft, Harassment, or Vandalism
   - **Location**: Automatically uses current GPS location (or enter manually)
   - **Date/Time**: When the incident occurred (defaults to now)
   - **Severity**: Rate from 1-10 using the slider
   - **Description**: Optional details about what happened
   - **Anonymous**: Option to submit without linking to your account

3. **Submit**
   - Report is saved to the database
   - Data is used to retrain the ML model
   - Success confirmation is shown

### Backend Integration

**Endpoint**: `POST /api/v1/safety/report-incident/`

**Request Body**:
```json
{
  "incident_type": "Robbery",
  "latitude": 5.125086,
  "longitude": 7.356695,
  "occurred_at": "2024-12-18T22:30:00Z",
  "severity": 7,
  "description": "Armed robbery near market",
  "anonymous": false
}
```

**Response**:
```json
{
  "success": true,
  "incident_id": 123,
  "message": "Thank you for reporting. This helps keep the community safe.",
  "reported_by": "User Alert",
  "will_improve_predictions": true,
  "incident_details": {
    "type": "Robbery",
    "severity": 7,
    "occurred_at": "2024-12-18T22:30:00Z",
    "location": {
      "latitude": 5.125086,
      "longitude": 7.356695
    }
  }
}
```

## Database Model

Reports are saved to the `IncidentReport` model:

```python
class IncidentReport(models.Model):
    incident_type = models.CharField(max_length=50)  # Type of incident
    location = gis_models.PointField(geography=True)  # GPS coordinates
    occurred_at = models.DateTimeField()  # When it happened
    severity = models.IntegerField()  # 1-10 scale
    day_of_week = models.IntegerField()  # 0=Monday, 6=Sunday
    hour_of_day = models.IntegerField()  # 0-23
    reported_by = models.CharField(max_length=20)  # Source: "User Alert"
    verified = models.BooleanField(default=False)  # Needs verification
    description = models.TextField(blank=True)  # Optional details
    created_at = models.DateTimeField(auto_now_add=True)
```

## ML Model Training

### How Reports Improve Predictions

1. **Data Collection**: User reports are stored with:
   - Location (lat/lon)
   - Time (hour, day of week)
   - Incident type
   - Severity

2. **Feature Engineering**: The model uses:
   - Spatial features (location coordinates)
   - Temporal features (time patterns)
   - Historical incident density
   - Severity weighting

3. **Model Retraining**: 
   - Run `python train_model.py` to retrain with new data
   - Model learns patterns from real incidents
   - Predictions become more accurate over time

### Training Command

```bash
# Retrain the model with all incident reports
python train_model.py

# The model will:
# - Load all IncidentReport records
# - Extract features (location, time, severity)
# - Train LSTM neural network
# - Save updated model to ml/models/threat_model_v3.h5
```

## UI Components

### ReportIncident Page (`eve-frontend/src/pages/ReportIncident.jsx`)

Features:
- Clean, user-friendly form
- Auto-location detection
- Date/time picker
- Severity slider (1-10)
- Anonymous reporting option
- Success confirmation with auto-redirect

### Floating Action Button

- Fixed position on Dashboard
- Red gradient with pulse animation
- Quick access to reporting
- Visible on all screen sizes

### Navigation Link

- Added to main navigation bar
- Icon: `bi-exclamation-triangle`
- Label: "Report"

## API Service

Added to `eve-frontend/src/services/api.js`:

```javascript
export const reportIncident = async (incidentData) => {
  const response = await fetch(`${BASE_URL}/safety/report-incident/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(incidentData),
  });
  return await response.json();
};
```

## Privacy & Security

### Anonymous Reporting
- Users can choose to submit anonymously
- No user ID is linked to anonymous reports
- Helps encourage reporting of sensitive incidents

### Data Verification
- All reports start with `verified=False`
- Admin can review and verify reports
- Prevents spam and false reports from affecting the model

### Location Privacy
- Only coordinates are stored, not addresses
- No reverse geocoding by default
- Users control what location data they share

## Testing

### Manual Testing

1. **Submit a Report**:
   ```bash
   # Navigate to http://localhost:3000/report-incident
   # Fill out the form
   # Submit and verify success message
   ```

2. **Check Database**:
   ```bash
   python manage.py shell
   >>> from apps.prediction.models import IncidentReport
   >>> IncidentReport.objects.all()
   >>> # Should see your report
   ```

3. **Verify API**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/safety/report-incident/ \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "incident_type": "Theft",
       "latitude": 5.125,
       "longitude": 7.356,
       "severity": 5
     }'
   ```

## Future Enhancements

### Planned Features

1. **Photo Upload**: Allow users to attach photos
2. **Voice Recording**: Record audio descriptions
3. **Witness Reports**: Multiple users can report same incident
4. **Real-time Alerts**: Notify nearby users of fresh reports
5. **Report Verification**: Community voting on report accuracy
6. **Heatmap Overlay**: Show recent reports on map
7. **Report History**: Users can view their past reports
8. **Admin Dashboard**: Review and manage reports

### Model Improvements

1. **Weighted Learning**: Give more weight to verified reports
2. **Temporal Decay**: Older incidents have less influence
3. **Clustering**: Identify crime hotspots automatically
4. **Pattern Recognition**: Detect emerging trends
5. **Multi-model Ensemble**: Combine multiple prediction models

## Troubleshooting

### Common Issues

**Location not detected**:
- Ensure browser has location permissions
- Check HTTPS is enabled (required for geolocation)
- Manually enter coordinates if needed

**Report not saving**:
- Check authentication token is valid
- Verify backend server is running
- Check browser console for errors

**Model not improving**:
- Ensure enough reports exist (minimum 100 recommended)
- Retrain model with `python train_model.py`
- Check data quality and distribution

## Impact Metrics

Track the effectiveness of incident reporting:

```python
# Get reporting statistics
from apps.prediction.models import IncidentReport
from django.db.models import Count, Avg

stats = IncidentReport.objects.aggregate(
    total_reports=Count('id'),
    avg_severity=Avg('severity'),
    verified_count=Count('id', filter=Q(verified=True))
)

# Get reports by type
by_type = IncidentReport.objects.values('incident_type').annotate(
    count=Count('id')
).order_by('-count')
```

## Conclusion

The Incident Reporting feature creates a crucial feedback loop that continuously improves the AI model's accuracy. By crowdsourcing real-world incident data, Eve becomes smarter and more effective at protecting users over time.

**Key Benefits**:
- ✅ Improves ML model accuracy
- ✅ Empowers community participation
- ✅ Creates real-time safety awareness
- ✅ Builds comprehensive incident database
- ✅ Enables data-driven safety decisions

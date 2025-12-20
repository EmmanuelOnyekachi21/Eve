# Testing Locations Guide

## Manual Location Override Feature

Since the web app uses browser geolocation (which can be inaccurate with WiFi), we've added a **Manual Location Override** feature for testing and development.

## How to Use

### 1. Open the Map
Navigate to the Dashboard or Live Map page.

### 2. Click "Set Test Location" Button
Look for the button in the bottom-left corner of the map.

### 3. Choose a Location

You have two options:

#### Option A: Use Preset Locations
Click any of the preset buttons:
- **Crime Zone Center** (5.125086, 7.356695) - Main area
- **North Area** (5.130, 7.360) - Northern section
- **South Area** (5.120, 7.350) - Southern section
- **East Area** (5.125, 7.365) - Eastern section

#### Option B: Enter Custom Coordinates
1. Enter latitude in the first field
2. Enter longitude in the second field
3. Click "Go"

### 4. Test Movement
- Switch between different preset locations to simulate movement
- Watch how the map updates and centers on your new position
- See how crime zones appear around your location

## Testing Scenarios

### Scenario 1: Safe Area
```
Location: Crime Zone Center (5.125086, 7.356695)
Expected: Low-risk zones (green circles) nearby
```

### Scenario 2: Moving Through Areas
1. Start at Crime Zone Center
2. Move to North Area
3. Move to East Area
4. Observe how zones change around you

### Scenario 3: Custom Location
```
Enter coordinates near a specific crime zone
Watch the risk assessment update
```

## For Mobile Testing

When testing on actual mobile devices:
- The GPS will be more accurate
- The manual override is still available for testing
- You can simulate different locations without physically moving

## For Production

In production, you should:
- Remove or hide the manual location feature
- Rely on actual GPS data
- Consider adding location history tracking
- Implement geofencing alerts

## Browser Geolocation Accuracy

Different browsers and devices have varying accuracy:

| Method | Accuracy | Use Case |
|--------|----------|----------|
| GPS (Mobile) | 5-10m | Production |
| WiFi Positioning | 20-100m | Desktop testing |
| IP Address | 1-5km | Fallback only |
| Manual Override | Exact | Development/Testing |

## Tips for Testing

1. **Test in different areas**: Use presets to see how zones appear in different locations
2. **Check zone colors**: Verify green/yellow/red zones display correctly
3. **Test edge cases**: Try locations far from crime zones
4. **Simulate movement**: Quickly switch between locations to test real-time updates
5. **Check marker popup**: Verify it shows "Manual Test Location" when using override

## Keyboard Shortcuts (Future Enhancement)

Consider adding:
- `Ctrl + L` - Open location picker
- `Ctrl + R` - Reset to GPS location
- Arrow keys - Move location slightly

## API Integration

The manual location can be used to test:
- `/api/v1/safety/zones/nearby/` endpoint
- Risk calculation based on location
- Nearest danger zone detection
- AI predictions for specific areas

## Troubleshooting

**Issue**: Manual location not updating map
**Solution**: Check browser console for errors, refresh page

**Issue**: Can't see crime zones at custom location
**Solution**: Ensure coordinates are within the crime zones area (around 5.125, 7.356)

**Issue**: Button not visible
**Solution**: Check z-index in CSS, ensure map is fully loaded

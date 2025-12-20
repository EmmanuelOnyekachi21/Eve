from rest_framework.response import Response
from rest_framework import status
from rest_framework import status
from .models import LocationTracking, CrimeZone, AudioRecording, Alert
from apps.accounts.models import UserProfile
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import (
    LocationTrackingSerializer,
    CrimeZoneSerializer,
    RiskCalculatorSerializer
)
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from datetime import datetime, timedelta
from django.utils import timezone
from apps.anomaly_detection import (
    TimePatternDetector,
    RouteDeviationDetector,
    StoppedMovementDetector
)
from .audio_services import AudioAnalyzer
from ml.prediction_service import ThreatPredictor
from math import radians, sin, cos
from apps.prediction.models import IncidentReport

# Trigger reload for new model v3

@api_view(['POST'])
def location_tracking(request):
    """
    POST /safety/location/
    Saves GPS location from phone
    """
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = LocationTrackingSerializer(data=request.data, context={'user_profile': user_profile})
    if serializer.is_valid():
        location = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_crimezones(request):
    """
    Returns all crime zones
    """
    crimezones = CrimeZone.objects.all()
    serializer = CrimeZoneSerializer(crimezones, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_crimezones_nearby(request):
    """
    GET /safety/zones/nearby/?lat=5.12&lon=7.35&radius=300
    Returns crime zones within given radius (meters)
    """
    lat = request.query_params.get('lat')
    lon = request.query_params.get('lon')
    radius = request.query_params.get('radius', 100)

    if not lat or not lon:
        return Response(
            {"error": "lat and lon query parameters are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        lat = float(lat)
        lon = float(lon)
        radius = float(radius)
    except ValueError:
        return Response(
            {"error": "lat, lon and radius must be numbers"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # IMPORTANT: Point(lon, lat)
    user_location = Point(lon, lat, srid=4326)

    nearby_zones = CrimeZone.objects.filter(
        location__distance_lte=(user_location, D(m=radius))
    ).order_by('-risk_level')

    serializer = CrimeZoneSerializer(nearby_zones, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
def calculate_risk(request):
    """
    POST /api/risk/calculate/
    Calculates risk score for current location

    Expected input:
        {
            "latitude": 5.125086,
            "longitude": 7.356695,
            "speed": 5.0  // optional
        }
        
        Returns:
        {
            "risk_score": 75,
            "risk_level": "High",
            "nearest_danger_zone": {
                "name": "Generator House",
                "distance_meters": 45,
                "risk_level": 70
            },
            "factors": {
                "zone_risk": 70,
                "time_risk": 20,
                "speed_risk": 10
            },
            "reason": "High risk zone (Generator House: 70) + Night time + Slow movement",
            "should_alert": true
        }
    """
    serializer = RiskCalculatorSerializer(data=request.data)

    if serializer.is_valid():
        user_location = Point(serializer.validated_data['longitude'], serializer.validated_data['latitude'], srid=4326)
        nearest_zone = CrimeZone.objects.annotate(
            distance=Distance('location', user_location)
        ).order_by('distance').first()

        speed = serializer.validated_data['speed']
        
        # Initialize default values for zone analysis
        zone_risk = 0
        distance_m = 0
        nearest_zone_name = "None"
        nearest_zone_risk = 0

        if nearest_zone:
            distance_m = nearest_zone.location.distance(user_location) * 111000  # degrees to meters
            nearest_zone_name = nearest_zone.name
            nearest_zone_risk = nearest_zone.risk_level

            # Calculate zone risk
            # Zone risk (40% of total)
            # Logic: Closer to high-risk zone = higher risk
            # If within zone radius, use full zone risk
            # If outside, decrease based on distance

            if distance_m <= nearest_zone.radius:
                # inside danger zone
                zone_risk = nearest_zone.risk_level
            else:
                # Outside, but nearby - decrease risk with distance
                # Max influence: 500m
                distance_factor = max(0, 1 - (distance_m / 500))
                zone_risk = nearest_zone.risk_level * 0.4 * distance_factor
        else:
            # no zones defined in system
            pass
        
        # Calculate time risk
        current_hour = datetime.now().hour

        # Night time (22:00 - 05:00) = high risk
        if 22 <= current_hour or current_hour <= 5:
            time_risk = 20  # 20% of total (full weight)
        elif 18 <= current_hour <= 21:
            time_risk = 10  # Evening (medium risk)
        else:
            time_risk = 5   # Daytime (low risk)
        

        # Calculate speed risk
        # Slow movement or stopped = suspicious
        if speed < 2:  # Walking very slowly or stopped
            speed_risk = 20  # Full weight
        elif speed < 5:
            speed_risk = 10  # Walking slowly
        else:
            speed_risk = 0   # Normal speed, no risk
        
        # Calculate Anomaly risk
        try:
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            user_profile = None

        anomaly_risk = 0

        anomalies_detected = []

        if user_profile:
            # Run detectors
            stopped = StoppedMovementDetector.detect(user_profile)
            route = RouteDeviationDetector.detect(user_profile)
            time = TimePatternDetector.detect(user_profile)

            # Collect anomalies
            for detector_result in [stopped, route, time]:
                if detector_result['is_anomaly']:
                    anomalies_detected.append(detector_result['reason'])
                    anomaly_risk += detector_result['risk_increase']
        

        # Check for recent voice crisis
        voice_crisis_risk = 0
        voice_crisis_reason = ""

        if user_profile:
            recent_voice_alert = Alert.objects.filter(
                user_profile=user_profile,
                alert_source='Voice',
                triggered_at__gte=timezone.now() - timedelta(minutes=5),
                status='Active'
            ).first()

            if recent_voice_alert:
                voice_crisis_risk = 50

                # Get keywords from audio recording.
                if hasattr(recent_voice_alert, 'audio'):
                    keywords = recent_voice_alert.audio.crisis_keywords_detected
                    voice_crisis_reason = ", ".join(keywords)
                else:
                    voice_crisis_reason = "Voice crisis detected."

        # Calculate Prediction Risk
        prediction_risk = 0
        prediction_reason = ""
        prediction_data = {}

        if threat_predictor:
            try:
                current_hour = datetime.now().hour
                current_day = datetime.now().weekday()
                
                # Get coords from validated data
                lat = serializer.validated_data['latitude']
                lon = serializer.validated_data['longitude']

                prediction = threat_predictor.predict(
                    lat, lon, current_hour, current_day
                )
                
                # Prediction contributes 20% to total risk
                # Only if prediction is high enough to be relevant
                if prediction['risk_probability'] > 0.3:
                    prediction_risk = prediction['risk_probability'] * 20
                
                if prediction['risk_probability'] > 0.7:
                    prediction_reason = f"High threat predicted ({prediction['risk_percentage']}%)"
                elif prediction['risk_probability'] > 0.4:
                    prediction_reason = f"Moderate threat predicted ({prediction['risk_percentage']}%)"
                    
                prediction_data = {
                    "enabled": True,
                    "risk_probability": prediction.get('risk_probability', 0),
                    "risk_percentage": prediction.get('risk_percentage', 0),
                    "confidence": prediction.get('confidence', 'N/A')
                }
            except Exception as e:
                print(f"Prediction error: {e}")
                prediction_data = {"enabled": False, "error": str(e)}
        else:
             prediction_data = {"enabled": False, "error": "Model not loaded"}

        # Combine and respond
        total_risk = zone_risk + time_risk + speed_risk + anomaly_risk + voice_crisis_risk + prediction_risk
                    
        # Scale to 100 (temporary until we add prediction)
        risk_score = min(100, total_risk * 1.25)

        # Determine alert threshold
        should_alert = total_risk > 70
        
        # TRIGGER ALERT IF NEEDED
        alert_triggered = False
        alert_id = None
        
        if should_alert and user_profile:
            # Check if there's already an active alert in last 5 minutes
            existing_alert = Alert.objects.filter(
                user_profile=user_profile,
                status__in=['Active', 'Pending Response'],
                triggered_at__gte=timezone.now() - timedelta(minutes=5)
            ).first()
            
            if not existing_alert:
                # Create new alert
                from apps.alert_services import AlertService
                from apps.admin_alert_service import AdminAlertService
                
                alert = Alert.objects.create(
                    user_profile=user_profile,
                    alert_level='Emergency' if total_risk > 85 else 'Warning',
                    alert_source='Combined',
                    trigger_location=Point(serializer.validated_data['longitude'], 
                                         serializer.validated_data['latitude'], 
                                         srid=4326),
                    risk_score=total_risk,
                    reason=f"High risk detected: Zone={zone_risk:.1f}, Time={time_risk}, Speed={speed_risk}",
                    status='Active'
                )
                
                # Send WhatsApp alerts
                alert_service = AlertService()
                contacts_alerted = alert_service.trigger_emergency_alert(alert)
                
                # Handle admin logging based on alert source
                if voice_crisis_risk > 0:
                    # Voice crisis detected - log immediately to admin
                    AdminAlertService.handle_voice_crisis_alert(alert)
                else:
                    # High risk but no voice crisis - set response deadline
                    AdminAlertService.handle_high_risk_alert(alert)
                
                alert_triggered = True
                alert_id = alert.id
                
                print(f"🚨 Alert {alert.id} triggered, {contacts_alerted} contacts notified")

        # Build reason string
        reasons = []
        if zone_risk > 20:
            reasons.append(f"Near {nearest_zone_name} (risk: {nearest_zone_risk})")
        if time_risk > 10:
            reasons.append("Night time")
        if speed_risk > 10:
            reasons.append("Slow/stopped movement")
        if prediction_reason:
            reasons.append(prediction_reason)

        reason = " + ".join(reasons) if reasons else "Low risk area"

        if anomalies_detected:
            reason += " | ANOMALIES: " + "; ".join(anomalies_detected)
        
        if voice_crisis_reason:
            reason = f"🚨 {voice_crisis_reason} | " + reason

        # Response
        return Response({
            "risk_score": round(min(100, total_risk), 1),
            "risk_level": "High" if total_risk > 70 else "Medium" if total_risk > 40 else "Low",
            "nearest_danger_zone": {
                "name": nearest_zone_name,
                "distance_meters": round(distance_m, 1),
                "risk_level": nearest_zone_risk
            },
            "factors": {
                "zone_risk": round(zone_risk, 1),
                "time_risk": time_risk,
                "speed_risk": speed_risk,
                "prediction_risk": round(prediction_risk, 1)
            },
            "prediction": prediction_data,
            "reason": reason,
            "anomalies": {
                "detected": len(anomalies_detected) > 0,
                "count": len(anomalies_detected),
                "details": anomalies_detected,
                "risk_added": anomaly_risk
            },
            "should_alert": should_alert,
            "alert": {
                "triggered": alert_triggered,
                "alert_id": alert_id,
                "should_alert": should_alert
            }
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def audio_analyze(request):
    """
    POST /api/audio/analyze/
    Analyzes audio for crisis detection

    =================================
    Expected: Audio file in 'audio' field
        
    Form data:
    - audio: audio file (.wav, .mp3, .m4a)
    - user_id: optional (for now, use first user)
    
    Returns:
    {
        "transcript": "help me please",
        "crisis_detected": true,
        "keywords_found": ["help"],
        "confidence": 0.95,
        "alert_created": true,
        "alert_id": 456
    }
    """
    # Get audio file
    audio_file =  request.FILES.get('audio')

    if not audio_file:
        return Response(
            {"error": "No audio file provided"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type
    allowed_types = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wave']
    if audio_file.content_type not in allowed_types:
        return Response(
            {"error": f"Invalid audio type: {audio_file.content_type}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Analyze audio
        result = AudioAnalyzer.analyze(audio_file)
    except Exception as e:
        return Response(
            {"error": f"Audio analysis failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    alert_created = False
    alert_id = None
    logged_to_admin = False
    
    # Create alert if crisis detected
    if result['crisis_detected']:
        # Get user profile
        try:
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            user_profile = None

        if user_profile:
            # Get current location (last location from tracking)
            last_location = LocationTracking.objects.filter(
                user_profile=user_profile
            ).first()

            if last_location:
                # Create emergency alert
                alert = Alert.objects.create(
                    user_profile=user_profile,
                    alert_level='Emergency',
                    alert_source='Voice',
                    trigger_location=last_location.location,
                    risk_score=95,  # Voice crisis = very high risk
                    reason=f"Voice crisis detected: {', '.join(result['keywords_found'])}",
                    status='Active'
                )

                # Save Audio recording
                AudioRecording.objects.create(
                    alert=alert,
                    file_path=f"audio_{alert.id}.wav",
                    duration_seconds=3,
                    transcript=result['transcript'],
                    crisis_keywords_detected=result['keywords_found'],
                )
                
                # LOG TO ADMIN DASHBOARD IMMEDIATELY (voice crisis)
                from apps.admin_alert_service import AdminAlertService
                AdminAlertService.handle_voice_crisis_alert(alert)
                logged_to_admin = True
                
                alert_created = True
                alert_id = alert.id
    
    # Return response (whether crisis detected or not)
    return Response({
        "transcript": result['transcript'],
        "language": result.get('language', 'en'),
        "crisis_detected": result['crisis_detected'],
        "keywords_found": result['keywords_found'],
        "confidence": result['confidence'],
        "alert_created": alert_created,
        "alert_id": alert_id,
        "logged_to_admin": logged_to_admin
    }, status=status.HTTP_200_OK)

try:
    threat_predictor = ThreatPredictor()
except:
    threat_predictor = None
    print("⚠️ Warning: Could not load LSTM model")

@api_view(['POST'])
def predict_threat(request):
    """
    POST /api/predict_threat/
    Predicts threat level based on location and time

    Input:
    {
        "latitude": 5.124511,
        "longitude": 7.357246,
        "hour": 22,  # optional, defaults to current hour
        "day_of_week": 4  # optional, defaults to current day (0=Mon, 6=Sun)
    }
    
    Output:
    {
        "risk_probability": 0.87,
        "risk_percentage": 87,
        "confidence": "Very High",
        "location": "Generator House area",
        "predicted_for": "Friday 10:00 PM"
    }
    """
    if not threat_predictor:
        return Response(
            {"error": "Prediction model not loaded"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Get input
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if not latitude or not longitude:
        return Response(
            {"error": "latitude and longitude required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get time (use current if not provided)
    hour = request.data.get('hour', datetime.now().hour)
    day_of_week = request.data.get('day_of_week', datetime.now().weekday())

    # Predict
    try:
        prediction = threat_predictor.predict(
            float(latitude),
            float(longitude),
            int(hour),
            int(day_of_week)
        )
    except Exception as e:
        return Response(
            {"error": f"Prediction failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Find nearest zone for context
    user_location = Point(float(longitude), float(latitude), srid=4326)
    nearest_zone = CrimeZone.objects.annotate(
        distance=Distance('location', user_location)
    ).order_by('distance').first()
    
    # Format time
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    time_str = f"{days[day_of_week]} {hour:02d}:00"
    
    return Response({
        "risk_probability": prediction['risk_probability'],
        "risk_percentage": prediction['risk_percentage'],
        "confidence": prediction['confidence'],
        "location_context": nearest_zone.name if nearest_zone else "Unknown area",
        "predicted_for": time_str,
        "features_used": prediction['features_used']
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def heatmap(request):
    """
    GET /api/predict/heatmap/?lat=5.125&lon=7.356
    Generate 24-hour prediction heatmap

    Returns grid of predictions for visualization
    """
    if not threat_predictor:
        return Response(
            {"error": "Prediction model not loaded"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    lat = request.query_params.get('lat')
    lon = request.query_params.get('lon')

    if not lat or not lon:
        return Response(
            {"error": "lat and lon parameters required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Generate grid predictions around this point
        predictions = threat_predictor.predict_24h_grid(
            float(lat), 
            float(lon)
        )
        return Response(predictions, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": f"Heatmap generation failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    






@api_view(['POST'])
def generate_crime_zones_api(request):
    """
    POST /safety/zones/generate/
    
    Dynamically generate crime zones around a location.
    Admin only endpoint for setting up crime zones.
    
    Request body:
    {
        "latitude": 5.125086,
        "longitude": 7.356695,
        "grid_size": 7,          // optional, default 7
        "spacing_km": 0.5,       // optional, default 0.5
        "clear_existing": true   // optional, default false
    }
    
    Returns:
    {
        "success": true,
        "zones_created": 49,
        "center": {"lat": 5.125086, "lon": 7.356695},
        "grid_size": 7,
        "spacing_km": 0.5,
        "coverage_km": 3.5,
        "statistics": {
            "total": 49,
            "safe": 15,
            "medium": 20,
            "high": 14
        }
    }
    """
    # Check if user is admin (optional - remove if you want all users to access)
    # if not request.user.is_staff:
    #     return Response(
    #         {"error": "Admin access required"},
    #         status=status.HTTP_403_FORBIDDEN
    #     )
    
    # Get parameters
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    grid_size = request.data.get('grid_size', 7)
    spacing_km = request.data.get('spacing_km', 0.5)
    clear_existing = request.data.get('clear_existing', False)
    
    # Validate required parameters
    if latitude is None or longitude is None:
        return Response(
            {"error": "latitude and longitude are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        latitude = float(latitude)
        longitude = float(longitude)
        grid_size = int(grid_size)
        spacing_km = float(spacing_km)
    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid parameter types"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate ranges
    if not (-90 <= latitude <= 90):
        return Response(
            {"error": "Latitude must be between -90 and 90"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not (-180 <= longitude <= 180):
        return Response(
            {"error": "Longitude must be between -180 and 180"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not (3 <= grid_size <= 15):
        return Response(
            {"error": "Grid size must be between 3 and 15"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not (0.1 <= spacing_km <= 2.0):
        return Response(
            {"error": "Spacing must be between 0.1 and 2.0 km"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Import the generation function
    import random
    
    # Clear existing zones if requested
    if clear_existing:
        old_count = CrimeZone.objects.count()
        CrimeZone.objects.all().delete()
    else:
        old_count = 0
    
    # Calculate spacing in degrees
    lat_spacing = spacing_km / 111.0
    lon_spacing = spacing_km / (111.0 * abs(latitude / 90.0 + 0.5))
    
    # Generate zones
    zones_created = 0
    half_grid = grid_size // 2
    
    for i in range(-half_grid, half_grid + 1):
        for j in range(-half_grid, half_grid + 1):
            lat = latitude + (i * lat_spacing)
            lon = longitude + (j * lon_spacing)
            
            distance_from_center = (i**2 + j**2) ** 0.5
            
            # Assign risk based on distance
            if distance_from_center < 1.5:
                risk = random.randint(10, 35)
                name_prefix = "Safe Zone"
                radius = 200
            elif distance_from_center < 3:
                risk = random.randint(30, 60)
                name_prefix = "Moderate Risk"
                radius = 250
            else:
                risk = random.randint(55, 90)
                name_prefix = "High Risk"
                radius = 300
            
            risk = min(100, max(0, risk + random.randint(-10, 10)))
            
            CrimeZone.objects.create(
                name=f"{name_prefix} ({i:+d},{j:+d})",
                location=Point(lon, lat),
                risk_level=risk,
                radius=radius,
                description=f"Grid zone at offset ({i}, {j}) from center"
            )
            
            zones_created += 1
    
    # Get statistics
    total = CrimeZone.objects.count()
    safe = CrimeZone.objects.filter(risk_level__lte=30).count()
    medium = CrimeZone.objects.filter(risk_level__gt=30, risk_level__lte=60).count()
    high = CrimeZone.objects.filter(risk_level__gt=60).count()
    
    coverage_km = grid_size * spacing_km
    
    return Response({
        "success": True,
        "zones_created": zones_created,
        "zones_cleared": old_count if clear_existing else 0,
        "center": {
            "latitude": latitude,
            "longitude": longitude
        },
        "grid_size": grid_size,
        "spacing_km": spacing_km,
        "coverage_km": round(coverage_km, 2),
        "statistics": {
            "total": total,
            "safe": safe,
            "medium": medium,
            "high": high
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def generate_zones_for_current_user(request):
    """
    POST /safety/zones/generate-for-me/
    
    Automatically generate crime zones around the logged-in user's home location.
    No parameters needed - uses user's profile data.
    
    Optional parameters:
    {
        "force": true,           // Force regeneration even if zones exist
        "grid_size": 7,          // Optional, default 7
        "spacing_km": 0.5        // Optional, default 0.5
    }
    
    Returns:
    {
        "success": true,
        "message": "Generated 49 zones around user location",
        "zones_created": 49,
        "center": {"latitude": 5.125, "longitude": 7.356},
        "statistics": {...}
    }
    """
    from apps.accounts.models import UserProfile
    from .zone_generator import generate_zones_for_user_location, should_regenerate_zones
    
    # Get user profile
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user has home location
    if not user_profile.home_latitude or not user_profile.home_longitude:
        return Response(
            {
                "error": "Home location not set",
                "message": "Please set your home location in your profile first"
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get optional parameters
    force = request.data.get('force', False)
    grid_size = request.data.get('grid_size', 7)
    spacing_km = request.data.get('spacing_km', 0.5)
    
    # Check if regeneration is needed
    if not force and not should_regenerate_zones(user_profile):
        existing_count = CrimeZone.objects.count()
        return Response(
            {
                "success": False,
                "message": f"Crime zones already exist in your area ({existing_count} zones)",
                "zones_created": 0,
                "tip": "Use 'force: true' to regenerate zones"
            },
            status=status.HTTP_200_OK
        )
    
    # Generate zones
    try:
        result = generate_zones_for_user_location(
            latitude=user_profile.home_latitude,
            longitude=user_profile.home_longitude,
            grid_size=grid_size,
            spacing_km=spacing_km,
            clear_existing=force
        )
        
        return Response(
            {
                "success": True,
                "message": f"Generated {result['zones_created']} zones around your home location",
                **result
            },
            status=status.HTTP_201_CREATED
        )
    
    except Exception as e:
        return Response(
            {
                "error": "Failed to generate zones",
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def user_confirmation(request):
    """
    POST /safety/alerts/confirm/
    
    User responds to safety check.
    
    Request body:
    {
        "is_safe": true,
        "context": "Shopping at market",
        "alert_id": 123,  // optional
        "latitude": 5.125,  // optional
        "longitude": 7.356  // optional
    }
    
    Returns:
    {
        "status": "confirmed_safe",
        "message": "Thank you for confirming. Stay safe!",
        "alert_cancelled": true
    }
    """
    from .serializers import UserConfirmationSerializer
    from apps.accounts.models import UserProfile
    from .models import SafetyAction
    from apps.alert_services import AlertService
    
    serializer = UserConfirmationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    is_safe = serializer.validated_data['is_safe']
    context = serializer.validated_data.get('context', '')
    alert_id = serializer.validated_data.get('alert_id')
    latitude = serializer.validated_data.get('latitude')
    longitude = serializer.validated_data.get('longitude')
    
    # Get user profile
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Determine location
    if latitude and longitude:
        location = Point(longitude, latitude, srid=4326)
    else:
        # Try to get last known location
        last_location = LocationTracking.objects.filter(
            user_profile=user_profile
        ).order_by('-timestamp').first()
        
        if last_location:
            location = last_location.location
        else:
            # Default to (0, 0) if no location available
            location = Point(0, 0, srid=4326)
    
    if is_safe:
        # User confirmed safe
        from apps.admin_alert_service import AdminAlertService
        alert_cancelled = False
        
        if alert_id:
            # Cancel specific alert
            try:
                alert = Alert.objects.get(id=alert_id, user_profile=user_profile)
                # Use admin service to mark as resolved
                AdminAlertService.user_confirmed_safe(alert, context)
                alert_cancelled = True
                
                print(f"✅ Alert {alert_id} cancelled by user")
            except Alert.DoesNotExist:
                pass
        else:
            # Cancel all active/pending alerts for this user
            active_alerts = Alert.objects.filter(
                user_profile=user_profile,
                status__in=['Active', 'Pending Response']
            )
            for alert in active_alerts:
                AdminAlertService.user_confirmed_safe(alert, context)
            alert_cancelled = active_alerts.count() > 0
        
        # Log safety confirmation
        SafetyAction.objects.create(
            user_profile=user_profile,
            action_type='Route Followed',
            location=location,
            outcome='Safe',
            notes=f"User confirmed safe: {context}"
        )
        
        return Response({
            "status": "confirmed_safe",
            "message": "Thank you for confirming. Stay safe!",
            "alert_cancelled": alert_cancelled
        }, status=status.HTTP_200_OK)
    
    else:
        # User needs help - escalate
        from apps.admin_alert_service import AdminAlertService
        
        try:
            alert = Alert.objects.create(
                user_profile=user_profile,
                alert_level='Emergency',
                alert_source='Manual',
                trigger_location=location,
                risk_score=100,
                reason=f"🚨 USER TRIGGERED SOS: {context}",
                status='Active'
            )
            
            print(f"✅ Created emergency alert: {alert.id}")
            
            # Send alerts immediately
            alert_service = AlertService()
            contacts_alerted = alert_service.trigger_emergency_alert(alert)
            
            print(f"✅ Notified {contacts_alerted} emergency contacts")
            
            # Log to admin dashboard immediately (user triggered emergency)
            AdminAlertService.user_triggered_emergency(alert, context)
            
            print(f"🚨 EMERGENCY: User {user_profile.user.email} triggered SOS - Alert {alert.id} logged to admin")
            
            return Response({
                "status": "emergency_triggered",
                "message": "Emergency alert sent to your contacts",
                "alert_id": alert.id,
                "contacts_notified": contacts_alerted,
                "logged_to_admin": alert.logged_to_admin
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error creating emergency alert: {e}")
            import traceback
            traceback.print_exc()
            
            return Response({
                "error": "Failed to create emergency alert",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def alert_history(request):
    """
    GET /safety/alerts/history/
    
    Get user's alert history.
    
    Query params:
    - limit: Number of alerts to return (default 20)
    - status: Filter by status (Active, Resolved, False Alarm)
    
    Returns:
    [
        {
            "id": 123,
            "alert_level": "Warning",
            "alert_source": "Combined",
            "risk_score": 75.5,
            "reason": "High risk zone + Night time",
            "status": "Resolved",
            "triggered_at": "2024-01-15T20:30:00Z",
            "resolved_at": "2024-01-15T20:35:00Z",
            "latitude": 5.125,
            "longitude": 7.356
        }
    ]
    """
    from apps.accounts.models import UserProfile
    
    # Get user profile
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response([], status=status.HTTP_200_OK)
    
    # Get query params
    limit = int(request.query_params.get('limit', 20))
    status_filter = request.query_params.get('status')
    
    # Query alerts
    alerts = Alert.objects.filter(user_profile=user_profile)
    
    if status_filter:
        alerts = alerts.filter(status=status_filter)
    
    alerts = alerts.order_by('-triggered_at')[:limit]
    
    # Serialize
    data = []
    for alert in alerts:
        alert_data = {
            'id': alert.id,
            'alert_level': alert.alert_level,
            'alert_source': alert.alert_source,
            'risk_score': alert.risk_score,
            'reason': alert.reason,
            'status': alert.status,
            'triggered_at': alert.triggered_at.isoformat(),
            'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None,
            'latitude': alert.trigger_location.y if alert.trigger_location else None,
            'longitude': alert.trigger_location.x if alert.trigger_location else None
        }
        data.append(alert_data)
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
def active_alerts(request):
    """
    GET /safety/alerts/active/
    
    Get user's currently active alerts.
    
    Returns:
    {
        "has_active_alerts": true,
        "count": 2,
        "alerts": [...]
    }
    """
    from apps.accounts.models import UserProfile
    
    # Get user profile
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response({
            "has_active_alerts": False,
            "count": 0,
            "alerts": []
        }, status=status.HTTP_200_OK)
    
    # Get active alerts
    alerts = Alert.objects.filter(
        user_profile=user_profile,
        status='Active'
    ).order_by('-triggered_at')
    
    # Serialize
    data = []
    for alert in alerts:
        alert_data = {
            'id': alert.id,
            'alert_level': alert.alert_level,
            'alert_source': alert.alert_source,
            'risk_score': alert.risk_score,
            'reason': alert.reason,
            'triggered_at': alert.triggered_at.isoformat(),
            'latitude': alert.trigger_location.y if alert.trigger_location else None,
            'longitude': alert.trigger_location.x if alert.trigger_location else None,
            'time_elapsed_minutes': (timezone.now() - alert.triggered_at).total_seconds() / 60
        }
        data.append(alert_data)
    
    return Response({
        "has_active_alerts": alerts.count() > 0,
        "count": alerts.count(),
        "alerts": data
    }, status=status.HTTP_200_OK)


# ============================================================================
# ENHANCED PREDICTION FEATURES
# ============================================================================

@api_view(['POST'])
def suggest_safe_route(request):
    """
    POST /api/safety/suggest-route/
    
    Suggests the safest route between two points based on threat predictions.
    Logs predictions and route analysis to database.
    
    Request body:
    {
        "start_lat": 5.125086,
        "start_lon": 7.356695,
        "end_lat": 5.130000,
        "end_lon": 7.360000,
        "departure_time": "2024-12-18T22:00:00Z"  // optional, defaults to now
    }
    
    Returns:
    {
        "route_analysis": {
            "direct_route_risk": 75,
            "recommended_route": "via_safe_zones",
            "risk_reduction": 45
        },
        "waypoints": [
            {"lat": 5.125, "lon": 7.356, "risk": 20, "confidence": "High"},
            {"lat": 5.127, "lon": 7.358, "risk": 35, "confidence": "High"},
            {"lat": 5.130, "lon": 7.360, "risk": 25, "confidence": "Medium"}
        ],
        "safe_zones_nearby": [
            {"name": "Police Station", "lat": 5.126, "lon": 7.357, "distance_m": 150}
        ],
        "recommendations": [
            "Route passes through medium-risk area at waypoint 2",
            "Consider traveling during daylight hours (risk drops to 25%)",
            "Police station available 150m from route"
        ],
        "overall_safety_score": 65,
        "estimated_travel_time_minutes": 15,
        "route_id": 123  // ID of saved RouteAnalysis
    }
    """
    if not threat_predictor:
        return Response(
            {"error": "Prediction model not available"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Parse input
    start_lat = request.data.get('start_lat')
    start_lon = request.data.get('start_lon')
    end_lat = request.data.get('end_lat')
    end_lon = request.data.get('end_lon')
    departure_time = request.data.get('departure_time')
    
    if not all([start_lat, start_lon, end_lat, end_lon]):
        return Response(
            {"error": "start_lat, start_lon, end_lat, end_lon are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_lat = float(start_lat)
        start_lon = float(start_lon)
        end_lat = float(end_lat)
        end_lon = float(end_lon)
    except ValueError:
        return Response(
            {"error": "Invalid coordinate values"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse departure time
    if departure_time:
        try:
            from dateutil import parser
            dt = parser.parse(departure_time)
            hour = dt.hour
            day_of_week = dt.weekday()
        except:
            hour = datetime.now().hour
            day_of_week = datetime.now().weekday()
    else:
        hour = datetime.now().hour
        day_of_week = datetime.now().weekday()
    
    # Generate waypoints (simple linear interpolation for now)
    num_waypoints = 5
    waypoints = []
    
    # Calculate prediction datetime
    if departure_time:
        try:
            from dateutil import parser
            prediction_datetime = parser.parse(departure_time)
        except:
            prediction_datetime = timezone.now()
    else:
        prediction_datetime = timezone.now()
    
    for i in range(num_waypoints + 1):
        t = i / num_waypoints
        lat = start_lat + t * (end_lat - start_lat)
        lon = start_lon + t * (end_lon - start_lon)
        
        # Get prediction for this waypoint
        prediction = threat_predictor.predict(lat, lon, hour, day_of_week)
        
        waypoints.append({
            'latitude': round(lat, 6),
            'longitude': round(lon, 6),
            'risk_probability': prediction['risk_probability'],
            'risk_percentage': prediction['risk_percentage'],
            'confidence': prediction['confidence']
        })
        
        # LOG PREDICTION TO DATABASE
        from apps.prediction.models import ThreatPrediction
        ThreatPrediction.objects.create(
            location=Point(lon, lat, srid=4326),
            prediction_for_datetime=prediction_datetime,
            predicted_risk_score=prediction['risk_percentage'],
            prediction_confidence=prediction['risk_probability'] * 100,
            incident_type_predicted='General Threat'
        )
    
    # Calculate overall route risk
    avg_risk = sum(w['risk_probability'] for w in waypoints) / len(waypoints)
    max_risk = max(w['risk_probability'] for w in waypoints)
    
    # Find nearby safe zones (low-risk areas)
    safe_zones = []
    center_lat = (start_lat + end_lat) / 2
    center_lon = (start_lon + end_lon) / 2
    
    # Check crime zones for safe areas
    center_point = Point(center_lon, center_lat, srid=4326)
    nearby_zones = CrimeZone.objects.annotate(
        distance=Distance('location', center_point)
    ).filter(
        risk_level__lte=30  # Safe zones only
    ).order_by('distance')[:3]
    
    for zone in nearby_zones:
        distance_m = zone.location.distance(center_point) * 111000
        safe_zones.append({
            'name': zone.name,
            'latitude': zone.location.y,
            'longitude': zone.location.x,
            'distance_meters': round(distance_m, 1),
            'risk_level': zone.risk_level
        })
    
    # Generate recommendations
    recommendations = []
    
    if max_risk > 0.7:
        recommendations.append(f"⚠️ High-risk area detected (risk: {int(max_risk*100)}%)")
        recommendations.append("Consider alternative route or travel with companion")
    
    if hour >= 22 or hour <= 5:
        recommendations.append("🌙 Night time travel - extra caution advised")
        # Calculate daytime risk
        daytime_predictions = [
            threat_predictor.predict(w['latitude'], w['longitude'], 14, day_of_week)
            for w in waypoints
        ]
        daytime_avg = sum(p['risk_probability'] for p in daytime_predictions) / len(daytime_predictions)
        if daytime_avg < avg_risk * 0.7:
            recommendations.append(f"💡 Traveling at 2 PM would reduce risk by {int((avg_risk - daytime_avg)*100)}%")
    
    if safe_zones:
        recommendations.append(f"✅ {len(safe_zones)} safe zone(s) available along route")
    
    if avg_risk < 0.3:
        recommendations.append("✅ This route is generally safe")
    elif avg_risk < 0.6:
        recommendations.append("⚠️ Moderate risk - stay alert")
    else:
        recommendations.append("🚨 High risk route - strongly consider alternatives")
    
    # Calculate safety score (inverse of risk)
    safety_score = int((1 - avg_risk) * 100)
    
    # Estimate travel time (rough calculation)
    from math import radians, cos, sin, asin, sqrt
    
    def haversine(lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        return km
    
    distance_km = haversine(start_lon, start_lat, end_lon, end_lat)
    estimated_time = int(distance_km / 4 * 60)  # Assuming 4 km/h walking speed
    
    # LOG ROUTE ANALYSIS TO DATABASE
    from apps.prediction.models import RouteAnalysis
    
    # Get user profile if authenticated
    user_profile = None
    if request.user.is_authenticated:
        try:
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            pass
    
    # Count danger zones crossed
    danger_zones_count = 0
    for waypoint in waypoints:
        wp_point = Point(waypoint['longitude'], waypoint['latitude'], srid=4326)
        nearby_danger = CrimeZone.objects.filter(
            location__distance_lte=(wp_point, D(m=100)),
            risk_level__gte=60
        ).count()
        danger_zones_count += nearby_danger
    
    # Count predicted threats (high risk waypoints)
    predicted_threats_count = sum(1 for w in waypoints if w['risk_probability'] > 0.6)
    
    route_analysis = RouteAnalysis.objects.create(
        user_profile=user_profile,
        start_location=Point(start_lon, start_lat, srid=4326),
        end_location=Point(end_lon, end_lat, srid=4326),
        route_points=[{'lat': w['latitude'], 'lon': w['longitude']} for w in waypoints],
        total_distance_meters=int(distance_km * 1000),
        estimated_duration_minutes=estimated_time,
        risk_score=round(avg_risk * 100, 1),
        crosses_danger_zones=danger_zones_count,
        crosses_predicted_threats=predicted_threats_count
    )
    
    return Response({
        "route_analysis": {
            "average_risk": round(avg_risk * 100, 1),
            "maximum_risk": round(max_risk * 100, 1),
            "safety_score": safety_score,
            "distance_km": round(distance_km, 2)
        },
        "waypoints": waypoints,
        "safe_zones_nearby": safe_zones,
        "recommendations": recommendations,
        "overall_safety_score": safety_score,
        "estimated_travel_time_minutes": estimated_time,
        "departure_info": {
            "hour": hour,
            "day_of_week": day_of_week,
            "is_night": hour >= 22 or hour <= 5
        },
        "route_id": route_analysis.id,
        "logged": {
            "predictions_saved": len(waypoints),
            "route_saved": True,
            "danger_zones_crossed": danger_zones_count,
            "predicted_threats": predicted_threats_count
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def nearby_safe_zones(request):
    """
    GET /api/safety/safe-zones-nearby/?lat=5.125&lon=7.356&radius=500
    
    Find nearest predicted-safe areas for emergency escape.
    
    Query params:
    - lat: Current latitude
    - lon: Current longitude
    - radius: Search radius in meters (default: 500)
    
    Returns:
    {
        "current_location": {
            "latitude": 5.125086,
            "longitude": 7.356695,
            "current_risk": 85,
            "confidence": "High"
        },
        "safe_zones": [
            {
                "name": "Market Square",
                "latitude": 5.126,
                "longitude": 7.357,
                "distance_meters": 150,
                "bearing": "Northeast",
                "risk_level": 15,
                "confidence": "High",
                "directions": "Head northeast for 150m"
            }
        ],
        "emergency_contacts": [
            {"type": "Police", "distance_m": 300, "lat": 5.127, "lon": 7.358}
        ],
        "escape_recommendation": "Nearest safe zone: Market Square (150m northeast)"
    }
    """
    if not threat_predictor:
        return Response(
            {"error": "Prediction model not available"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Parse input
    lat = request.query_params.get('lat')
    lon = request.query_params.get('lon')
    radius = request.query_params.get('radius', 500)
    
    if not lat or not lon:
        return Response(
            {"error": "lat and lon parameters required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        lat = float(lat)
        lon = float(lon)
        radius = float(radius)
    except ValueError:
        return Response(
            {"error": "Invalid parameter values"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get current risk
    current_hour = datetime.now().hour
    current_day = datetime.now().weekday()
    current_prediction = threat_predictor.predict(lat, lon, current_hour, current_day)
    
    # Find nearby safe zones
    from django.contrib.gis.geos import Point
    from django.contrib.gis.db.models.functions import Distance
    from math import atan2, degrees
    
    user_location = Point(lon, lat, srid=4326)
    
    # Get low-risk crime zones nearby
    nearby_zones = CrimeZone.objects.annotate(
        distance=Distance('location', user_location)
    ).filter(
        location__distance_lte=(user_location, D(m=radius)),
        risk_level__lte=40  # Only relatively safe zones
    ).order_by('distance')[:5]
    
    safe_zones = []
    
    for zone in nearby_zones:
        distance_m = zone.location.distance(user_location) * 111000
        
        # Calculate bearing
        lat1, lon1 = lat, lon
        lat2, lon2 = zone.location.y, zone.location.x
        
        dLon = lon2 - lon1
        y = sin(radians(dLon)) * cos(radians(lat2))
        x = cos(radians(lat1)) * sin(radians(lat2)) - sin(radians(lat1)) * cos(radians(lat2)) * cos(radians(dLon))
        bearing_deg = (degrees(atan2(y, x)) + 360) % 360
        
        # Convert bearing to direction
        directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest']
        direction = directions[int((bearing_deg + 22.5) / 45) % 8]
        
        # Get prediction for this zone
        zone_prediction = threat_predictor.predict(
            zone.location.y, 
            zone.location.x, 
            current_hour, 
            current_day
        )
        
        safe_zones.append({
            'name': zone.name,
            'latitude': zone.location.y,
            'longitude': zone.location.x,
            'distance_meters': round(distance_m, 1),
            'bearing_degrees': round(bearing_deg, 1),
            'direction': direction,
            'risk_level': zone.risk_level,
            'predicted_risk': zone_prediction['risk_percentage'],
            'confidence': zone_prediction['confidence'],
            'directions': f"Head {direction.lower()} for {int(distance_m)}m"
        })
    
    # Generate escape recommendation
    if safe_zones:
        nearest = safe_zones[0]
        escape_rec = f"Nearest safe zone: {nearest['name']} ({int(nearest['distance_meters'])}m {nearest['direction'].lower()})"
    else:
        escape_rec = "No safe zones found nearby. Move to well-lit, populated areas."
    
    return Response({
        "current_location": {
            "latitude": lat,
            "longitude": lon,
            "current_risk": current_prediction['risk_percentage'],
            "confidence": current_prediction['confidence']
        },
        "safe_zones": safe_zones,
        "escape_recommendation": escape_rec,
        "search_radius_meters": radius,
        "zones_found": len(safe_zones)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def prediction_confidence_map(request):
    """
    GET /api/safety/confidence-map/?lat=5.125&lon=7.356
    
    Returns prediction confidence levels for areas around a location.
    Helps users understand how reliable the predictions are.
    
    Query params:
    - lat: Center latitude
    - lon: Center longitude
    
    Returns:
    {
        "center": {"lat": 5.125, "lon": 7.356},
        "confidence_zones": [
            {
                "area": "North",
                "confidence": "High",
                "data_points": 45,
                "reliability": 0.92,
                "description": "Predictions very reliable (45 historical incidents)"
            }
        ],
        "overall_confidence": "High",
        "data_quality": {
            "total_incidents_nearby": 120,
            "coverage": "Good",
            "recommendation": "Predictions are reliable for this area"
        }
    }
    """
    if not threat_predictor:
        return Response(
            {"error": "Prediction model not available"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Parse input
    lat = request.query_params.get('lat')
    lon = request.query_params.get('lon')
    
    if not lat or not lon:
        return Response(
            {"error": "lat and lon parameters required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return Response(
            {"error": "Invalid coordinate values"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check data availability in different directions
    from django.contrib.gis.geos import Point
    
    center = Point(lon, lat, srid=4326)
    
    # Define areas to check (8 directions)
    directions = [
        ('North', 0.002, 0),
        ('Northeast', 0.0014, 0.0014),
        ('East', 0, 0.002),
        ('Southeast', -0.0014, 0.0014),
        ('South', -0.002, 0),
        ('Southwest', -0.0014, -0.0014),
        ('West', 0, -0.002),
        ('Northwest', 0.0014, -0.0014),
    ]
    
    confidence_zones = []
    total_incidents = 0
    
    for direction_name, lat_offset, lon_offset in directions:
        check_point = Point(lon + lon_offset, lat + lat_offset, srid=4326)
        
        # Count incidents near this point
        incidents_count = IncidentReport.objects.filter(
            location__distance_lte=(check_point, D(m=200))
        ).count()
        
        total_incidents += incidents_count
        
        # Determine confidence based on data availability
        if incidents_count >= 30:
            confidence = "Very High"
            reliability = 0.95
            description = f"Excellent data coverage ({incidents_count} incidents)"
        elif incidents_count >= 15:
            confidence = "High"
            reliability = 0.85
            description = f"Good data coverage ({incidents_count} incidents)"
        elif incidents_count >= 5:
            confidence = "Medium"
            reliability = 0.70
            description = f"Moderate data coverage ({incidents_count} incidents)"
        else:
            confidence = "Low"
            reliability = 0.50
            description = f"Limited data ({incidents_count} incidents)"
        
        confidence_zones.append({
            'area': direction_name,
            'confidence': confidence,
            'data_points': incidents_count,
            'reliability': reliability,
            'description': description
        })
    
    # Overall confidence
    avg_incidents = total_incidents / len(directions)
    
    if avg_incidents >= 20:
        overall_confidence = "Very High"
        coverage = "Excellent"
        recommendation = "Predictions are highly reliable for this area"
    elif avg_incidents >= 10:
        overall_confidence = "High"
        coverage = "Good"
        recommendation = "Predictions are reliable for this area"
    elif avg_incidents >= 5:
        overall_confidence = "Medium"
        coverage = "Moderate"
        recommendation = "Predictions available but use with caution"
    else:
        overall_confidence = "Low"
        coverage = "Limited"
        recommendation = "Limited data - predictions may be less accurate"
    
    return Response({
        "center": {
            "latitude": lat,
            "longitude": lon
        },
        "confidence_zones": confidence_zones,
        "overall_confidence": overall_confidence,
        "data_quality": {
            "total_incidents_nearby": total_incidents,
            "average_per_direction": round(avg_incidents, 1),
            "coverage": coverage,
            "recommendation": recommendation
        },
        "interpretation": {
            "very_high": "95%+ accuracy expected",
            "high": "85%+ accuracy expected",
            "medium": "70%+ accuracy expected",
            "low": "50%+ accuracy expected"
        }
    }, status=status.HTTP_200_OK)


# ============================================================================
# INCIDENT REPORTING & ROUTE SELECTION
# ============================================================================

@api_view(['POST'])
def report_incident(request):
    """
    POST /api/safety/report-incident/
    
    Allow users to report actual incidents that occurred.
    This data is used to train and improve the ML model.
    
    Request body:
    {
        "incident_type": "Robbery",  // Robbery, Assault, Kidnapping, Theft, Harassment, Vandalism
        "latitude": 5.125086,
        "longitude": 7.356695,
        "occurred_at": "2024-12-18T22:30:00Z",  // optional, defaults to now
        "severity": 7,  // 1-10 scale, optional, defaults to 5
        "description": "Armed robbery near market",  // optional
        "anonymous": false  // optional, defaults to false
    }
    
    Returns:
    {
        "success": true,
        "incident_id": 123,
        "message": "Thank you for reporting. This helps keep the community safe.",
        "reported_by": "User Alert",
        "will_improve_predictions": true
    }
    """
    from apps.prediction.models import IncidentReport
    from datetime import datetime
    
    # Validate incident type
    valid_types = ['Robbery', 'Assault', 'Kidnapping', 'Theft', 'Harassment', 'Vandalism']
    incident_type = request.data.get('incident_type')
    
    if not incident_type or incident_type not in valid_types:
        return Response(
            {
                "error": "Invalid incident_type",
                "valid_types": valid_types
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get location
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if not latitude or not longitude:
        return Response(
            {"error": "latitude and longitude are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except ValueError:
        return Response(
            {"error": "Invalid coordinate values"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get occurred_at time
    occurred_at_str = request.data.get('occurred_at')
    if occurred_at_str:
        try:
            from dateutil import parser
            occurred_at = parser.parse(occurred_at_str)
        except:
            occurred_at = timezone.now()
    else:
        occurred_at = timezone.now()
    
    # Get severity (1-10)
    severity = request.data.get('severity', 5)
    try:
        severity = int(severity)
        severity = max(1, min(10, severity))  # Clamp to 1-10
    except ValueError:
        severity = 5
    
    # Get description
    description = request.data.get('description', '')
    
    # Check if anonymous
    anonymous = request.data.get('anonymous', False)
    
    # Create incident report
    incident = IncidentReport.objects.create(
        incident_type=incident_type,
        location=Point(longitude, latitude, srid=4326),
        occurred_at=occurred_at,
        severity=severity,
        day_of_week=occurred_at.weekday(),
        hour_of_day=occurred_at.hour,
        reported_by='User Alert',
        verified=False,  # Needs verification
        description=description
    )
    
    # If user is authenticated and not anonymous, we could link it
    # (Currently not linking to preserve privacy)
    
    return Response({
        "success": True,
        "incident_id": incident.id,
        "message": "Thank you for reporting. This helps keep the community safe.",
        "reported_by": "User Alert",
        "will_improve_predictions": True,
        "incident_details": {
            "type": incident_type,
            "severity": severity,
            "occurred_at": occurred_at.isoformat(),
            "location": {
                "latitude": latitude,
                "longitude": longitude
            }
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def select_route(request):
    """
    POST /api/safety/select-route/
    
    Mark that user selected a specific route.
    This helps track which routes users prefer.
    
    Request body:
    {
        "route_id": 123  // ID from suggest_safe_route response
    }
    
    Returns:
    {
        "success": true,
        "message": "Route selection recorded",
        "route_id": 123
    }
    """
    from apps.prediction.models import RouteAnalysis
    
    route_id = request.data.get('route_id')
    
    if not route_id:
        return Response(
            {"error": "route_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        route = RouteAnalysis.objects.get(id=route_id)
        route.user_selected = True
        route.save()
        
        return Response({
            "success": True,
            "message": "Route selection recorded. Stay safe!",
            "route_id": route_id,
            "route_details": {
                "risk_score": route.risk_score,
                "distance_meters": route.total_distance_meters,
                "estimated_duration_minutes": route.estimated_duration_minutes
            }
        }, status=status.HTTP_200_OK)
    
    except RouteAnalysis.DoesNotExist:
        return Response(
            {"error": "Route not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
def user_route_history(request):
    """
    GET /api/safety/routes/history/
    
    Get user's route analysis history.
    
    Query params:
    - limit: Number of routes to return (default: 10)
    
    Returns:
    {
        "routes": [
            {
                "id": 123,
                "created_at": "2024-12-18T22:00:00Z",
                "start_location": {"lat": 5.125, "lon": 7.356},
                "end_location": {"lat": 5.130, "lon": 7.360},
                "risk_score": 45.2,
                "distance_km": 2.5,
                "duration_minutes": 37,
                "user_selected": true,
                "danger_zones_crossed": 2,
                "predicted_threats": 1
            }
        ],
        "total_routes": 25,
        "statistics": {
            "average_risk": 52.3,
            "safest_route_risk": 15.0,
            "riskiest_route_risk": 85.0,
            "total_distance_km": 125.5
        }
    }
    """
    from apps.prediction.models import RouteAnalysis
    
    # Get user profile
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get limit
    limit = int(request.query_params.get('limit', 10))
    limit = min(limit, 100)  # Max 100
    
    # Get routes
    routes = RouteAnalysis.objects.filter(
        user_profile=user_profile
    ).order_by('-created_at')[:limit]
    
    # Format routes
    routes_data = []
    for route in routes:
        routes_data.append({
            "id": route.id,
            "created_at": route.created_at.isoformat(),
            "start_location": {
                "latitude": route.start_location.y,
                "longitude": route.start_location.x
            },
            "end_location": {
                "latitude": route.end_location.y,
                "longitude": route.end_location.x
            },
            "risk_score": route.risk_score,
            "distance_km": round(route.total_distance_meters / 1000, 2),
            "duration_minutes": route.estimated_duration_minutes,
            "user_selected": route.user_selected,
            "danger_zones_crossed": route.crosses_danger_zones,
            "predicted_threats": route.crosses_predicted_threats
        })
    
    # Calculate statistics
    all_routes = RouteAnalysis.objects.filter(user_profile=user_profile)
    total_routes = all_routes.count()
    
    if total_routes > 0:
        from django.db.models import Avg, Min, Max, Sum
        stats = all_routes.aggregate(
            avg_risk=Avg('risk_score'),
            min_risk=Min('risk_score'),
            max_risk=Max('risk_score'),
            total_distance=Sum('total_distance_meters')
        )
        
        statistics = {
            "average_risk": round(stats['avg_risk'] or 0, 1),
            "safest_route_risk": round(stats['min_risk'] or 0, 1),
            "riskiest_route_risk": round(stats['max_risk'] or 0, 1),
            "total_distance_km": round((stats['total_distance'] or 0) / 1000, 2)
        }
    else:
        statistics = {
            "average_risk": 0,
            "safest_route_risk": 0,
            "riskiest_route_risk": 0,
            "total_distance_km": 0
        }
    
    return Response({
        "routes": routes_data,
        "total_routes": total_routes,
        "statistics": statistics
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def prediction_accuracy(request):
    """
    GET /api/safety/prediction-accuracy/
    
    Check how accurate our predictions have been.
    Compares ThreatPredictions with actual IncidentReports.
    
    Returns:
    {
        "overall_accuracy": 78.5,
        "total_predictions": 1250,
        "verified_predictions": 450,
        "correct_predictions": 353,
        "false_positives": 97,
        "false_negatives": 45,
        "confidence_breakdown": {
            "Very High": {"accuracy": 92.3, "count": 150},
            "High": {"accuracy": 85.1, "count": 200},
            "Medium": {"accuracy": 72.5, "count": 100}
        }
    }
    """
    from apps.prediction.models import ThreatPrediction, IncidentReport
    from django.db.models import Q
    
    # Get all predictions that have passed their prediction time
    past_predictions = ThreatPrediction.objects.filter(
        prediction_for_datetime__lt=timezone.now()
    )
    
    total_predictions = past_predictions.count()
    
    if total_predictions == 0:
        return Response({
            "message": "No predictions to verify yet",
            "overall_accuracy": 0,
            "total_predictions": 0
        }, status=status.HTTP_200_OK)
    
    # Check each prediction against actual incidents
    correct = 0
    false_positives = 0
    false_negatives = 0
    
    for prediction in past_predictions[:500]:  # Limit to 500 for performance
        # Check if incident occurred near predicted location and time
        time_window_start = prediction.prediction_for_datetime - timedelta(hours=1)
        time_window_end = prediction.prediction_for_datetime + timedelta(hours=1)
        
        nearby_incidents = IncidentReport.objects.filter(
            occurred_at__gte=time_window_start,
            occurred_at__lte=time_window_end,
            location__distance_lte=(prediction.location, D(m=500))
        )
        
        actual_incidents_count = nearby_incidents.count()
        
        # Update prediction
        if prediction.actual_incidents_count != actual_incidents_count:
            prediction.actual_incidents_count = actual_incidents_count
            
            # Determine if prediction was accurate
            # High risk prediction (>60) should have incidents
            # Low risk prediction (<40) should not have incidents
            if prediction.predicted_risk_score > 60:
                prediction.was_accurate = actual_incidents_count > 0
                if prediction.was_accurate:
                    correct += 1
                else:
                    false_positives += 1
            elif prediction.predicted_risk_score < 40:
                prediction.was_accurate = actual_incidents_count == 0
                if prediction.was_accurate:
                    correct += 1
                else:
                    false_negatives += 1
            else:
                # Medium risk - harder to judge
                prediction.was_accurate = None
            
            prediction.save()
    
    # Calculate accuracy
    verified = past_predictions.filter(was_accurate__isnull=False).count()
    correct_count = past_predictions.filter(was_accurate=True).count()
    
    accuracy = (correct_count / verified * 100) if verified > 0 else 0
    
    return Response({
        "overall_accuracy": round(accuracy, 1),
        "total_predictions": total_predictions,
        "verified_predictions": verified,
        "correct_predictions": correct_count,
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "note": "Predictions are verified against actual incident reports within 1 hour and 500m radius"
    }, status=status.HTTP_200_OK)

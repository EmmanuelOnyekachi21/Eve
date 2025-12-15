from rest_framework.response import Response
from rest_framework import status
from .models import LocationTracking, CrimeZone
from apps.accounts.models import UserProfile
from rest_framework.decorators import api_view
from .serializers import (
    LocationTrackingSerializer,
    CrimeZoneSerializer,
    RiskCalculatorSerializer
)
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from datetime import datetime


@api_view(['POST'])
def location_tracking(request):
    """
    POST /safety/location/
    Saves GPS location from phone
    """
    user_profile = UserProfile.objects.first()
    if not user_profile:
        return Response(
            {"error": "No user profile found. Create one first."},
            status=status.HTTP_400_BAD_REQUEST
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

        if not nearest_zone:
            return Response(
                {"error": "No crime zone found"},
                status=status.HTTP_404_NOT_FOUND
            )
        distance_m = nearest_zone.location.distance(user_location) * 111000  # degrees to meters

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
        
        # Combine and respond
        # Total risk (out of 80 for now, will be 100 when we add prediction)
        total_risk = zone_risk + time_risk + speed_risk

        # Scale to 100 (temporary until we add prediction)
        risk_score = min(100, total_risk * 1.25)

        # Determine alert threshold
        should_alert = risk_score > 70

        # Build reason string
        reasons = []
        if zone_risk > 20:
            reasons.append(f"Near {nearest_zone.name} (risk: {nearest_zone.risk_level})")
        if time_risk > 10:
            reasons.append("Night time")
        if speed_risk > 10:
            reasons.append("Slow/stopped movement")

        reason = " + ".join(reasons) if reasons else "Low risk area"

        # Response
        return Response({
            "risk_score": round(risk_score, 1),
            "risk_level": "High" if risk_score > 70 else "Medium" if risk_score > 40 else "Low",
            "nearest_danger_zone": {
                "name": nearest_zone.name,
                "distance_meters": round(distance_m, 1),
                "risk_level": nearest_zone.risk_level
            },
            "factors": {
                "zone_risk": round(zone_risk, 1),
                "time_risk": time_risk,
                "speed_risk": speed_risk
            },
            "reason": reason,
            "should_alert": should_alert
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            


    





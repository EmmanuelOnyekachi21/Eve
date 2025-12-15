"""
Anomalies Detection
"""
from datetime import datetime
from django.utils import timezone
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from apps.safety.models import (
    LocationTracking,
    SafetyAction,
    CrimeZone
)
from datetime import timedelta
from collections import Counter


class StoppedMovementDetector:
    """
    Detects when a user has stopped moving in a dangerous area.
    """
    STOPPED_THRESHOLD = 2.0  # Speed below 2 km/h = stopped
    DURATION_THRESHOLD = 60  # Seconds (1 minute)

    @staticmethod
    def detect(user_profile):
        """
        Returns:
        {
            "is_anomaly": True/False,
            "reason": "Stopped for 3 minutes in high-risk zone",
            "risk_increase": 25  // How much to add to risk score
        }
        """
        # Get last 10 locations (last ~1.5 minutes if updating every 10s)
        # Get last 30 locations (last ~5 minutes if updating every 10s)
        recent_locations = list(LocationTracking.objects.filter(
            user_profile=user_profile
        ).order_by('-timestamp')[:30])

        if len(recent_locations) < 10:
            # Not enough data yet
            return {
                "is_anomaly": False,
                "reason": "Insufficient location history",
                "risk_increase": 0
            }
        
        # check if stopped.
        stopped_points = []
        for loc in recent_locations:
            if loc.speed < StoppedMovementDetector.STOPPED_THRESHOLD:
                stopped_points.append(loc)
            else:
                break
        
        if not stopped_points:
             return {
                "is_anomaly": False,
                "reason": "User is currently moving",
                "risk_increase": 0
            }

        # Calculate duration - How long have they been stopped
        oldest_stopped = stopped_points[-1]
        newest = stopped_points[0]

        stopped_duration = (newest.timestamp - oldest_stopped.timestamp).total_seconds()

        if stopped_duration < StoppedMovementDetector.DURATION_THRESHOLD:
            return {
                "is_anomaly": False,
                "reason": f"Stopped for only {int(stopped_duration)}s (threshold: {StoppedMovementDetector.DURATION_THRESHOLD}s)",
                "risk_increase": 0
            }
        
        current_location = recent_locations[0].location

        nearest_zone = CrimeZone.objects.filter(
            location__distance_lte=(current_location, D(m=200))
        ).annotate(distance=Distance('location', current_location)).order_by('distance').first()

        if not nearest_zone or nearest_zone.risk_level < 60:
            return {
                "is_anomaly": False,
                "reason": "Stopped in safe area",
                "risk_increase": 0
            }
        SafetyAction.objects.create(
            user_profile=user_profile,
            action_type="Warning Ignored",
            location=current_location,
            outcome='Unknown',
            notes=f'Stopped for {int(stopped_duration)}s in {nearest_zone.name}'
        )


        return {
            "is_anomaly": True,
            "reason": f"Stopped for {int(stopped_duration)}s in high-risk zone ({nearest_zone.name})",
            "risk_increase": 25,  # Add 25 to risk score
            "zone_name": nearest_zone.name
        }


class RouteDeviationDetector:
    """
    Detects when user is in an unusual location (far from typical areas)
    """
    DEVIATION_THRESHOLD_METERS = 2000  # 2km from usual area

    @staticmethod
    def detect(user_profile):
        """
        Returns:
        {
            "is_anomaly": True/False,
            "reason": "3.5km from typical activity area",
            "risk_increase": 15
        }
        """

        # Get Location history
        last_50_locations = list(LocationTracking.objects.filter(
            user_profile=user_profile
        ).order_by('-timestamp')[:100])

        if len(last_50_locations) < 10:
            return {
                "is_anomaly": False,
                "reason": "Insufficient location history for pattern analysis",
                "risk_increase": 0
            }
        
        # Calculate center point
        # - Get all lats/longs coordinates
        latitudes = [loc.location.y for loc in last_50_locations]
        longitudes = [loc.location.x for loc in last_50_locations]
        
        # Calculate average (center of user's typical area)
        avg_lat = sum(latitudes) / len(latitudes)
        avg_lon = sum(longitudes) / len(longitudes)

        center_point = Point(avg_lon, avg_lat)

        # Check current deviation
        current_location = last_50_locations[0].location

        # Calculate distance from center
        distance = current_location.distance(center_point) * 111000  # degrees to meters

        if distance > RouteDeviationDetector.DEVIATION_THRESHOLD_METERS:
            SafetyAction.objects.create(
                user_profile=user_profile,
                action_type='Route Ignored',
                location=current_location,
                outcome='Unknown',
                notes=f"Deviated {int(distance)}m from typical area"
            )
            
            return {
                "is_anomaly": True,
                "reason": f"{int(distance)}m from typical activity area",
                "risk_increase": 15,
                "distance_from_typical": int(distance)
            }
        else:
            return {
                "is_anomaly": False,
                "reason": "Within typical activity area",
                "risk_increase": 0
            }


class TimePatternDetector:
    """
    Detects when user is active at unusual times
    """
    @staticmethod
    def detect(user_profile):
        """
        Returns:
        {
            "is_anomaly": True/False,
            "reason": "Active at 2am (unusual for this user)",
            "risk_increase": 20
        }
        """
        # 1. Get user's historical active hours (from past locations)

        # Get locations from past week
        one_week_ago = timezone.now() - timedelta(days=7)
        history = LocationTracking.objects.filter(
            user_profile=user_profile,
            timestamp__gte=one_week_ago
        )

        if history.count() < 20:
            return {
                "is_anomaly": False,
                "reason": "Insufficient data for time pattern analysis",
                "risk_increase": 0
            }

        # Get hours when user was active
        active_hours = [loc.timestamp.hour for loc in history]
        # 2. Calculate typical hour range
        hour_counts = Counter(active_hours)
        # User is typically active during these hours
        typical_hours = [hour for hour, count in hour_counts.items() if count >= 2]

        current_hour = timezone.now().hour

        # 3. Check if current hour is within typical range
        is_unusual_time = current_hour not in typical_hours

        # Extra risk if it's late night (22:00 - 05:00)
        is_late_night = 22 <= current_hour or current_hour <= 5

        if is_unusual_time and is_late_night:
            return {
                "is_anomaly": True,
                "reason": f"Active at {current_hour}:00 (unusual for this user) + late night",
                "risk_increase": 20,
                "current_hour": current_hour,
                "typical_hours": typical_hours
            }
        elif is_unusual_time:
            return {
                "is_anomaly": True,
                "reason": f"Active at {current_hour}:00 (unusual for this user)",
                "risk_increase": 10,
                "current_hour": current_hour,
                "typical_hours": typical_hours
            }
        else:
            return {
                "is_anomaly": False,
                "reason": "Active during typical hours",
                "risk_increase": 0
            }




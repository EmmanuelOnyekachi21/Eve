# ============================================
# PREDICTION MODELS (3)
# ============================================
from django.db import models
from django.contrib.gis.geos import Point
from django.contrib.gis.db import models as gis_models
from apps.accounts.models import UserProfile

class IncidentReport(models.Model):
    """
    Historical crime data for LSTM training
    """
    INCIDENT_TYPES = [
        ('Robbery', 'Robbery'),
        ('Assault', 'Assault'),
        ('Kidnapping', 'Kidnapping'),
        ('Theft', 'Theft'),
        ('Harassment', 'Harassment'),
        ('Vandalism', 'Vandalism'),
    ]
    
    SOURCES = [
        ('User Alert', 'User-Generated Alert'),
        ('News', 'News Report'),
        ('Police', 'Police Report'),
        ('Synthetic', 'Synthetic/Generated'),
    ]
    
    incident_type = models.CharField(max_length=50, choices=INCIDENT_TYPES)
    location = gis_models.PointField(geography=True)
    occurred_at = models.DateTimeField(help_text="When incident occurred")
    severity = models.IntegerField(help_text="1-10 severity scale")
    day_of_week = models.IntegerField(help_text="0=Monday, 6=Sunday")
    hour_of_day = models.IntegerField(help_text="0-23")
    reported_by = models.CharField(max_length=20, choices=SOURCES, default='Synthetic')
    verified = models.BooleanField(default=False, help_text="Is this real or synthetic data?")
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.incident_type} - {self.occurred_at.date()}"
    
    class Meta:
        ordering = ['-occurred_at']
        indexes = [
            models.Index(fields=['occurred_at', 'incident_type']),
        ]
        verbose_name = "Incident Report"
        verbose_name_plural = "Incident Reports"


class ThreatPrediction(models.Model):
    """
    ML model predictions for future threats
    """
    location = gis_models.PointField(geography=True, help_text="Where threat is predicted")
    prediction_for_datetime = models.DateTimeField(help_text="When threat is predicted to occur")
    predicted_risk_score = models.FloatField(help_text="Predicted risk 0-100")
    prediction_confidence = models.FloatField(help_text="Model confidence 0-100")
    incident_type_predicted = models.CharField(max_length=50, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True, help_text="When prediction was made")
    was_accurate = models.BooleanField(null=True, blank=True, help_text="Check after time passes")
    actual_incidents_count = models.IntegerField(default=0, help_text="How many incidents actually occurred")
    
    def __str__(self):
        return f"Prediction for {self.prediction_for_datetime.date()} - Risk: {self.predicted_risk_score}"
    
    class Meta:
        ordering = ['-prediction_for_datetime']
        verbose_name = "Threat Prediction"
        verbose_name_plural = "Threat Predictions"


class RouteAnalysis(models.Model):
    """
    Calculated safe route options
    """
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='routes', null=True, blank=True)
    start_location = gis_models.PointField(geography=True)
    end_location = gis_models.PointField(geography=True)
    route_points = models.JSONField(help_text="List of waypoint coordinates")
    total_distance_meters = models.IntegerField()
    estimated_duration_minutes = models.IntegerField()
    risk_score = models.FloatField(help_text="Route risk score 0-100")
    crosses_danger_zones = models.IntegerField(default=0, help_text="Number of danger zones crossed")
    crosses_predicted_threats = models.IntegerField(default=0, help_text="Number of predicted threats on route")
    created_at = models.DateTimeField(auto_now_add=True)
    user_selected = models.BooleanField(default=False, help_text="Did user choose this route?")
    
    def __str__(self):
        return f"Route - Risk: {self.risk_score} - {self.total_distance_meters}m"
    
    class Meta:
        ordering = ['risk_score']
        verbose_name = "Route Analysis"
        verbose_name_plural = "Route Analyses"

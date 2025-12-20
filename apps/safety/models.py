# safety/models.py
from django.contrib.gis.db import models as gis_models
from django.utils import timezone
from apps.accounts.models import UserProfile
from django.db import models

class CrimeZone(models.Model):
    name = models.CharField(max_length=200)
    location = gis_models.PointField(geography=True, help_text="lon,lat")
    risk_level = models.IntegerField(help_text="0-100")
    radius = models.IntegerField(help_text="meters")
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.risk_level}"

class LocationTracking(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='locations')
    location = gis_models.PointField(geography=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    speed = models.FloatField(null=True, blank=True)
    battery_level = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user_profile.user.email} @ {self.timestamp.isoformat()}"

class Alert(models.Model):
    ALERT_LEVELS = [('Warning','Warning'), ('Emergency','Emergency')]
    ALERT_SOURCES = [('Location','Location'), ('Voice','Voice'), ('Prediction','Prediction'), ('Manual','Manual'), ('Combined','Combined')]
    STATUS_CHOICES = [('Active','Active'), ('Resolved','Resolved'), ('False Alarm','False Alarm'), ('Pending Response','Pending Response')]

    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='alerts')
    alert_level = models.CharField(max_length=20, choices=ALERT_LEVELS)
    alert_source = models.CharField(max_length=20, choices=ALERT_SOURCES)
    trigger_location = gis_models.PointField(geography=True)
    risk_score = models.FloatField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Admin dashboard fields
    logged_to_admin = models.BooleanField(default=False, help_text="Alert logged to admin dashboard")
    admin_notified_at = models.DateTimeField(null=True, blank=True, help_text="When admin was notified")
    requires_admin_attention = models.BooleanField(default=False, help_text="Needs immediate admin attention")
    user_response_deadline = models.DateTimeField(null=True, blank=True, help_text="Deadline for user response")
    admin_notes = models.TextField(blank=True, null=True, help_text="Admin notes on this alert")

    def __str__(self):
        return f"{self.alert_level} - {self.user_profile.user.username}"

class AudioRecording(models.Model):
    alert = models.OneToOneField(Alert, on_delete=models.CASCADE, related_name='audio')
    file_path = models.CharField(max_length=500)
    duration_seconds = models.IntegerField()
    transcript = models.TextField(blank=True, null=True)
    crisis_keywords_detected = models.JSONField(default=list)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Audio for Alert {self.alert.id}"

class SafetyAction(models.Model):
    ACTION_TYPES = [
        ('Fake Call','Fake Call'), ('Panic Button','Panic Button'),
        ('Route Followed','Route Followed'), ('Route Ignored','Route Ignored'),
        ('Warning Ignored','Warning Ignored'), ('Warning Heeded','Warning Heeded'),
    ]
    OUTCOMES = [('Safe','Safe'), ('Alert Triggered','Alert Triggered'), ('Unknown','Unknown')]

    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='safety_actions')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    location = gis_models.PointField(geography=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    outcome = models.CharField(max_length=20, choices=OUTCOMES, default='Unknown')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.action_type} - {self.user_profile.user.username}"

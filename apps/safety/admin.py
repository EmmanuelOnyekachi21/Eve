from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import CrimeZone, LocationTracking, Alert, AudioRecording, SafetyAction

@admin.register(CrimeZone)
class CrimeZoneAdmin(GISModelAdmin):
    list_display = ['name', 'risk_level', 'radius', 'created_at']
    list_filter = ['risk_level']
    search_fields = ['name']
    ordering = ['-risk_level']

# ---------------------------
# LocationTracking
# ---------------------------
@admin.register(LocationTracking)
class LocationTrackingAdmin(GISModelAdmin):
    list_display = ['user_profile', 'timestamp', 'speed', 'battery_level']
    list_filter = ['user_profile', 'timestamp']
    date_hierarchy = 'timestamp'

# ---------------------------
# Alert
# ---------------------------
@admin.register(Alert)
class AlertAdmin(GISModelAdmin):
    list_display = ['user_profile', 'alert_level', 'alert_source', 'risk_score', 'status', 'triggered_at']
    list_filter = ['alert_level', 'alert_source', 'status']
    search_fields = ['user_profile__user__email', 'reason']
    date_hierarchy = 'triggered_at'

# ---------------------------
# AudioRecording
# ---------------------------
@admin.register(AudioRecording)
class AudioRecordingAdmin(admin.ModelAdmin):
    list_display = ['alert', 'duration_seconds', 'recorded_at']
    readonly_fields = ['transcript', 'crisis_keywords_detected']

# ---------------------------
# SafetyAction
# ---------------------------
@admin.register(SafetyAction)
class SafetyActionAdmin(GISModelAdmin):
    list_display = ['user_profile', 'action_type', 'outcome', 'timestamp']
    list_filter = ['action_type', 'outcome']
    date_hierarchy = 'timestamp'

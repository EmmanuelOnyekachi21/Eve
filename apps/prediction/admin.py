from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import IncidentReport, ThreatPrediction, RouteAnalysis

# ---------------------------
# IncidentReport
# ---------------------------
@admin.register(IncidentReport)
class IncidentReportAdmin(GISModelAdmin):
    list_display = ['incident_type', 'occurred_at', 'severity', 'reported_by', 'verified']
    list_filter = ['incident_type', 'severity', 'reported_by', 'verified']
    search_fields = ['description']
    date_hierarchy = 'occurred_at'

# ---------------------------
# ThreatPrediction
# ---------------------------
@admin.register(ThreatPrediction)
class ThreatPredictionAdmin(GISModelAdmin):
    list_display = ['prediction_for_datetime', 'predicted_risk_score', 'prediction_confidence', 'was_accurate']
    list_filter = ['was_accurate', 'prediction_for_datetime']
    readonly_fields = ['generated_at']

# ---------------------------
# RouteAnalysis
# ---------------------------
@admin.register(RouteAnalysis)
class RouteAnalysisAdmin(GISModelAdmin):
    list_display = ['risk_score', 'total_distance_meters', 'crosses_danger_zones', 'user_selected', 'created_at']
    list_filter = ['user_selected', 'crosses_danger_zones']
    date_hierarchy = 'created_at'

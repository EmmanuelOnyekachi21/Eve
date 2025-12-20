from django.urls import path
from .views import (
    location_tracking,
    get_crimezones,
    get_crimezones_nearby,
    generate_crime_zones_api,
    generate_zones_for_current_user,
    calculate_risk,
    audio_analyze,
    predict_threat,
    heatmap,
    user_confirmation,
    alert_history,
    active_alerts,
    suggest_safe_route,
    nearby_safe_zones,
    prediction_confidence_map,
    report_incident,
    select_route,
    user_route_history,
    prediction_accuracy
)
from .admin_views import (
    admin_dashboard_alerts,
    admin_resolve_alert,
    admin_mark_false_alarm,
    admin_alert_details,
    admin_check_expired_alerts,
    admin_statistics
)

urlpatterns = [
    path('location/', location_tracking, name='location_tracking'),
    path('zones/', get_crimezones, name='get_crimezones'),
    path('zones/nearby/', get_crimezones_nearby, name='get_crimezones_nearby'),
    path('zones/generate/', generate_crime_zones_api, name='generate_crime_zones'),
    path('zones/generate-for-me/', generate_zones_for_current_user, name='generate_zones_for_me'),
    path('risk/calculate/', calculate_risk, name='calculate_risk'),
    path('audio/analyze/', audio_analyze, name='audio_analyze'),
    path('predict/', predict_threat, name='predict_threat'),
    path('heatmap/', heatmap, name='heatmap'),
    path('alerts/confirm/', user_confirmation, name='user_confirmation'),
    path('alerts/history/', alert_history, name='alert_history'),
    path('alerts/active/', active_alerts, name='active_alerts'),
    # Enhanced prediction features
    path('suggest-route/', suggest_safe_route, name='suggest_safe_route'),
    path('safe-zones-nearby/', nearby_safe_zones, name='nearby_safe_zones'),
    path('confidence-map/', prediction_confidence_map, name='prediction_confidence_map'),
    # Incident reporting and route tracking
    path('report-incident/', report_incident, name='report_incident'),
    path('select-route/', select_route, name='select_route'),
    path('routes/history/', user_route_history, name='user_route_history'),
    path('prediction-accuracy/', prediction_accuracy, name='prediction_accuracy'),
    # Admin dashboard endpoints
    path('admin/alerts/dashboard/', admin_dashboard_alerts, name='admin_dashboard_alerts'),
    path('admin/alerts/<int:alert_id>/', admin_alert_details, name='admin_alert_details'),
    path('admin/alerts/<int:alert_id>/resolve/', admin_resolve_alert, name='admin_resolve_alert'),
    path('admin/alerts/<int:alert_id>/false-alarm/', admin_mark_false_alarm, name='admin_mark_false_alarm'),
    path('admin/alerts/check-expired/', admin_check_expired_alerts, name='admin_check_expired_alerts'),
    path('admin/alerts/statistics/', admin_statistics, name='admin_statistics'),
]

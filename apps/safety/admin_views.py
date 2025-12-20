"""
Admin Dashboard Views
Endpoints for admin to monitor and manage critical alerts
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from apps.admin_alert_service import AdminAlertService
from .models import Alert
from apps.accounts.models import UserProfile
from django.utils import timezone


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_alerts(request):
    """
    GET /api/admin/alerts/dashboard/
    
    Get all alerts logged to admin dashboard
    
    Query params:
    - critical_only: true/false (default: false)
    - limit: number of alerts to return (default: 50)
    
    Returns:
    {
        "total_alerts": 10,
        "critical_alerts": 5,
        "alerts": [...]
    }
    """
    critical_only = request.query_params.get('critical_only', 'false').lower() == 'true'
    limit = int(request.query_params.get('limit', 50))
    
    if critical_only:
        alerts = AdminAlertService.get_critical_alerts()[:limit]
    else:
        alerts = AdminAlertService.get_admin_dashboard_alerts()[:limit]
    
    # Serialize alerts
    alerts_data = []
    for alert in alerts:
        alerts_data.append({
            "id": alert.id,
            "user": {
                "id": alert.user_profile.user.id,
                "email": alert.user_profile.user.email,
                "name": f"{alert.user_profile.user.first_name} {alert.user_profile.user.last_name}",
                "phone": alert.user_profile.phone
            },
            "alert_level": alert.alert_level,
            "alert_source": alert.alert_source,
            "risk_score": alert.risk_score,
            "reason": alert.reason,
            "status": alert.status,
            "location": {
                "latitude": alert.trigger_location.y,
                "longitude": alert.trigger_location.x,
                "google_maps_link": f"https://www.google.com/maps?q={alert.trigger_location.y},{alert.trigger_location.x}"
            },
            "triggered_at": alert.triggered_at.isoformat(),
            "admin_notified_at": alert.admin_notified_at.isoformat() if alert.admin_notified_at else None,
            "requires_admin_attention": alert.requires_admin_attention,
            "user_response_deadline": alert.user_response_deadline.isoformat() if alert.user_response_deadline else None,
            "admin_notes": alert.admin_notes,
            "time_elapsed_minutes": (timezone.now() - alert.triggered_at).total_seconds() / 60
        })
    
    # Get statistics
    total_alerts = AdminAlertService.get_admin_dashboard_alerts().count()
    critical_alerts = AdminAlertService.get_critical_alerts().count()
    
    return Response({
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "alerts": alerts_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_resolve_alert(request, alert_id):
    """
    POST /api/admin/alerts/{alert_id}/resolve/
    
    Admin resolves an alert
    
    Request body:
    {
        "notes": "Contacted user, situation resolved"
    }
    """
    try:
        alert = Alert.objects.get(id=alert_id)
    except Alert.DoesNotExist:
        return Response(
            {"error": "Alert not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    notes = request.data.get('notes', '')
    AdminAlertService.admin_resolve_alert(alert, notes)
    
    return Response({
        "success": True,
        "message": "Alert resolved",
        "alert_id": alert_id
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_mark_false_alarm(request, alert_id):
    """
    POST /api/admin/alerts/{alert_id}/false-alarm/
    
    Admin marks alert as false alarm
    
    Request body:
    {
        "notes": "User confirmed false alarm"
    }
    """
    try:
        alert = Alert.objects.get(id=alert_id)
    except Alert.DoesNotExist:
        return Response(
            {"error": "Alert not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    notes = request.data.get('notes', '')
    AdminAlertService.admin_mark_false_alarm(alert, notes)
    
    return Response({
        "success": True,
        "message": "Alert marked as false alarm",
        "alert_id": alert_id
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_alert_details(request, alert_id):
    """
    GET /api/admin/alerts/{alert_id}/
    
    Get detailed information about a specific alert
    """
    try:
        alert = Alert.objects.select_related('user_profile__user').get(id=alert_id)
    except Alert.DoesNotExist:
        return Response(
            {"error": "Alert not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get audio recording if exists
    audio_data = None
    if hasattr(alert, 'audio'):
        audio_data = {
            "transcript": alert.audio.transcript,
            "crisis_keywords": alert.audio.crisis_keywords_detected,
            "duration_seconds": alert.audio.duration_seconds
        }
    
    # Get user's emergency contacts
    contacts = alert.user_profile.emergency_contacts.all()
    contacts_data = [
        {
            "name": contact.name,
            "phone": contact.phone,
            "relationship": contact.relationship
        }
        for contact in contacts
    ]
    
    return Response({
        "id": alert.id,
        "user": {
            "id": alert.user_profile.user.id,
            "email": alert.user_profile.user.email,
            "name": f"{alert.user_profile.user.first_name} {alert.user_profile.user.last_name}",
            "phone": alert.user_profile.phone
        },
        "alert_level": alert.alert_level,
        "alert_source": alert.alert_source,
        "risk_score": alert.risk_score,
        "reason": alert.reason,
        "status": alert.status,
        "location": {
            "latitude": alert.trigger_location.y,
            "longitude": alert.trigger_location.x,
            "google_maps_link": f"https://www.google.com/maps?q={alert.trigger_location.y},{alert.trigger_location.x}"
        },
        "triggered_at": alert.triggered_at.isoformat(),
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "admin_notified_at": alert.admin_notified_at.isoformat() if alert.admin_notified_at else None,
        "requires_admin_attention": alert.requires_admin_attention,
        "user_response_deadline": alert.user_response_deadline.isoformat() if alert.user_response_deadline else None,
        "admin_notes": alert.admin_notes,
        "audio": audio_data,
        "emergency_contacts": contacts_data,
        "time_elapsed_minutes": (timezone.now() - alert.triggered_at).total_seconds() / 60
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_check_expired_alerts(request):
    """
    POST /api/admin/alerts/check-expired/
    
    Manually trigger check for expired alerts
    (Normally this would run via cron/celery)
    
    Returns:
    {
        "alerts_logged": 3,
        "message": "3 expired alerts logged to dashboard"
    }
    """
    count = AdminAlertService.check_expired_alerts()
    
    return Response({
        "alerts_logged": count,
        "message": f"{count} expired alert(s) logged to dashboard"
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_statistics(request):
    """
    GET /api/admin/alerts/statistics/
    
    Get alert statistics for admin dashboard
    """
    from django.db.models import Count, Q
    from datetime import timedelta
    
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    
    # Total alerts
    total_alerts = Alert.objects.filter(logged_to_admin=True).count()
    
    # Critical alerts
    critical_alerts = Alert.objects.filter(
        logged_to_admin=True,
        requires_admin_attention=True,
        status__in=['Active', 'Pending Response']
    ).count()
    
    # Alerts by status
    status_counts = Alert.objects.filter(logged_to_admin=True).values('status').annotate(count=Count('id'))
    
    # Alerts by source
    source_counts = Alert.objects.filter(logged_to_admin=True).values('alert_source').annotate(count=Count('id'))
    
    # Recent alerts (last 24h)
    recent_alerts = Alert.objects.filter(
        logged_to_admin=True,
        admin_notified_at__gte=last_24h
    ).count()
    
    # Voice crisis alerts
    voice_crisis_count = Alert.objects.filter(
        logged_to_admin=True,
        alert_source='Voice'
    ).count()
    
    # User-triggered emergencies
    user_emergency_count = Alert.objects.filter(
        logged_to_admin=True,
        alert_source='Manual'
    ).count()
    
    # No-response alerts
    no_response_count = Alert.objects.filter(
        logged_to_admin=True,
        admin_notes__icontains='NO USER RESPONSE'
    ).count()
    
    return Response({
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "recent_alerts_24h": recent_alerts,
        "voice_crisis_alerts": voice_crisis_count,
        "user_triggered_emergencies": user_emergency_count,
        "no_response_alerts": no_response_count,
        "by_status": {item['status']: item['count'] for item in status_counts},
        "by_source": {item['alert_source']: item['count'] for item in source_counts}
    }, status=status.HTTP_200_OK)

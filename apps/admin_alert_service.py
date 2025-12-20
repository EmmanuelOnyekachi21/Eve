"""
Admin Alert Service
Handles logging critical alerts to admin dashboard
"""
from django.utils import timezone
from datetime import timedelta
from apps.safety.models import Alert
from django.db.models import Q


class AdminAlertService:
    """
    Service for managing admin alert notifications
    """
    
    # Response deadline in minutes
    USER_RESPONSE_TIMEOUT = 2  # 2 minutes
    
    @staticmethod
    def log_to_admin_dashboard(alert, immediate=False, reason=""):
        """
        Log an alert to the admin dashboard
        
        Args:
            alert: Alert object
            immediate: If True, requires immediate admin attention
            reason: Reason for logging to admin
        """
        alert.logged_to_admin = True
        alert.admin_notified_at = timezone.now()
        alert.requires_admin_attention = immediate
        
        if reason:
            alert.admin_notes = f"[AUTO] {reason}\n{alert.admin_notes or ''}"
        
        alert.save()
        
        print(f"🚨 Alert {alert.id} logged to admin dashboard")
        print(f"   User: {alert.user_profile.user.email}")
        print(f"   Immediate: {immediate}")
        print(f"   Reason: {reason}")
        
        return alert
    
    @staticmethod
    def handle_voice_crisis_alert(alert):
        """
        Handle alert triggered by voice crisis detection
        Logs immediately to admin dashboard
        
        Args:
            alert: Alert object with voice crisis
        """
        reason = "VOICE CRISIS DETECTED - Immediate admin attention required"
        return AdminAlertService.log_to_admin_dashboard(
            alert,
            immediate=True,
            reason=reason
        )
    
    @staticmethod
    def handle_high_risk_alert(alert):
        """
        Handle alert triggered by high risk (no voice crisis)
        Sets response deadline, will log if user doesn't respond
        
        Args:
            alert: Alert object
        """
        # Set response deadline (2 minutes from now)
        alert.user_response_deadline = timezone.now() + timedelta(
            minutes=AdminAlertService.USER_RESPONSE_TIMEOUT
        )
        alert.status = 'Pending Response'
        alert.save()
        
        print(f"⏰ Alert {alert.id} waiting for user response")
        print(f"   Deadline: {alert.user_response_deadline}")
        
        return alert
    
    @staticmethod
    def check_expired_alerts():
        """
        Check for alerts that have passed response deadline
        Logs them to admin dashboard
        
        Should be called periodically (e.g., every minute via cron/celery)
        """
        now = timezone.now()
        
        # Find alerts pending response that have expired
        expired_alerts = Alert.objects.filter(
            status='Pending Response',
            user_response_deadline__lte=now,
            logged_to_admin=False
        )
        
        logged_count = 0
        for alert in expired_alerts:
            AdminAlertService.log_to_admin_dashboard(
                alert,
                immediate=True,
                reason=f"NO USER RESPONSE after {AdminAlertService.USER_RESPONSE_TIMEOUT} minutes"
            )
            logged_count += 1
        
        if logged_count > 0:
            print(f"🚨 Logged {logged_count} expired alerts to admin dashboard")
        
        return logged_count
    
    @staticmethod
    def user_confirmed_safe(alert, context=""):
        """
        User confirmed they are safe
        Resolves alert and prevents admin logging
        
        Args:
            alert: Alert object
            context: User's context/explanation
        """
        alert.status = 'Resolved'
        alert.resolved_at = timezone.now()
        
        if context:
            alert.admin_notes = f"[USER CONFIRMED SAFE] {context}\n{alert.admin_notes or ''}"
        
        alert.save()
        
        print(f"✅ Alert {alert.id} resolved by user")
        
        return alert
    
    @staticmethod
    def user_triggered_emergency(alert, context=""):
        """
        User triggered emergency (clicked "I Need Help")
        Logs immediately to admin dashboard
        
        Args:
            alert: Alert object
            context: User's context/explanation
        """
        reason = f"USER TRIGGERED EMERGENCY - {context or 'No context provided'}"
        return AdminAlertService.log_to_admin_dashboard(
            alert,
            immediate=True,
            reason=reason
        )
    
    @staticmethod
    def get_admin_dashboard_alerts():
        """
        Get all alerts that need admin attention
        
        Returns:
            QuerySet of alerts for admin dashboard
        """
        return Alert.objects.filter(
            logged_to_admin=True,
            status__in=['Active', 'Pending Response']
        ).select_related('user_profile__user').order_by('-admin_notified_at')
    
    @staticmethod
    def get_critical_alerts():
        """
        Get alerts requiring immediate admin attention
        
        Returns:
            QuerySet of critical alerts
        """
        return Alert.objects.filter(
            logged_to_admin=True,
            requires_admin_attention=True,
            status__in=['Active', 'Pending Response']
        ).select_related('user_profile__user').order_by('-admin_notified_at')
    
    @staticmethod
    def admin_resolve_alert(alert, admin_notes=""):
        """
        Admin resolves an alert
        
        Args:
            alert: Alert object
            admin_notes: Admin's notes on resolution
        """
        alert.status = 'Resolved'
        alert.resolved_at = timezone.now()
        alert.requires_admin_attention = False
        
        if admin_notes:
            alert.admin_notes = f"[ADMIN RESOLVED] {admin_notes}\n{alert.admin_notes or ''}"
        
        alert.save()
        
        print(f"✅ Admin resolved alert {alert.id}")
        
        return alert
    
    @staticmethod
    def admin_mark_false_alarm(alert, admin_notes=""):
        """
        Admin marks alert as false alarm
        
        Args:
            alert: Alert object
            admin_notes: Admin's notes
        """
        alert.status = 'False Alarm'
        alert.resolved_at = timezone.now()
        alert.requires_admin_attention = False
        
        if admin_notes:
            alert.admin_notes = f"[FALSE ALARM] {admin_notes}\n{alert.admin_notes or ''}"
        
        alert.save()
        
        print(f"⚠️ Admin marked alert {alert.id} as false alarm")
        
        return alert

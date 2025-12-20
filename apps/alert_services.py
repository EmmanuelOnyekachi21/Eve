"""
Alert notification service
"""
from twilio.rest import Client
from django.conf import settings
from apps.safety.models import Alert
from apps.accounts.models import EmergencyContact
import logging

logger = logging.getLogger(__name__)


class AlertService:
    """
    Handles sending emergency alerts
    """
    
    def __init__(self):
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )
    
    def send_whatsapp_alert(self, to_number, message):
        """
        Send WhatsApp message via Twilio
        
        Args:
            to_number: Phone number (format: +234XXXXXXXXXX)
            message: Alert message text
            
        Returns:
            Success boolean
        """
        try:
            # Ensure number has whatsapp: prefix
            if not to_number.startswith('whatsapp:'):
                to_number = f'whatsapp:{to_number}'
            
            message = self.client.messages.create(
                from_=settings.TWILIO_WHATSAPP_FROM,
                body=message,
                to=to_number
            )
            
            logger.info(f"WhatsApp sent: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
            return False
    
    def format_alert_message(self, alert):
        """
        Format emergency alert message
        
        Args:
            alert: Alert model instance
            
        Returns:
            Formatted message string
        """
        user = alert.user_profile.user
        location = alert.trigger_location
        
        message = f"""🆘 EMERGENCY ALERT - SentinelSphere

User: {user.username}
Status: {alert.alert_level}
Risk Score: {alert.risk_score:.1f}/100

Location: {location.y:.6f}, {location.x:.6f}
(Near {alert.reason.split('-')[0] if '-' in alert.reason else 'unknown area'})

Reason: {alert.reason}

Time: {alert.triggered_at.strftime('%I:%M %p')}

Track live: http://localhost:3000/dashboard

⚠️ Please check on {user.username} immediately.
"""
        return message
    
    def trigger_emergency_alert(self, alert):
        """
        Send alert to all emergency contacts
        
        Args:
            alert: Alert model instance
            
        Returns:
            Number of successful sends
        """
        contacts = alert.user_profile.emergency_contacts.all().order_by('priority')
        
        if not contacts.exists():
            logger.warning(f"No emergency contacts for user {alert.user_profile.user.username}")
            return 0
        
        message = self.format_alert_message(alert)
        success_count = 0
        
        for contact in contacts:
            success = self.send_whatsapp_alert(contact.phone, message)
            if success:
                success_count += 1
                logger.info(f"Alert sent to {contact.name}")
            else:
                logger.error(f"Failed to alert {contact.name}")
        
        return success_count
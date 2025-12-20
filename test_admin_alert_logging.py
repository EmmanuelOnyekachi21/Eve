#!/usr/bin/env python
"""
Test script to verify admin alert logging
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.safety.models import Alert
from apps.accounts.models import User, UserProfile
from apps.admin_alert_service import AdminAlertService
from django.contrib.gis.geos import Point
from django.utils import timezone
from datetime import timedelta

def test_alert_logging():
    print("🧪 Testing Admin Alert Logging")
    print("=" * 60)
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    
    if created:
        user.set_password('testpass123')
        user.save()
    
    # Get or create profile
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'phone': '+1234567890',
            'profile_completed': True
        }
    )
    
    print(f"✅ Using test user: {user.email}")
    
    # Test 1: Voice Crisis Alert (should log immediately)
    print("\n📝 Test 1: Voice Crisis Alert")
    alert1 = Alert.objects.create(
        user_profile=profile,
        alert_level='Emergency',
        alert_source='Voice',
        trigger_location=Point(7.356695, 5.125086, srid=4326),
        risk_score=95,
        reason="Voice crisis detected: help, emergency",
        status='Active'
    )
    
    AdminAlertService.handle_voice_crisis_alert(alert1)
    
    print(f"   Alert ID: {alert1.id}")
    print(f"   Logged to admin: {alert1.logged_to_admin}")
    print(f"   Requires attention: {alert1.requires_admin_attention}")
    print(f"   Status: {alert1.status}")
    
    # Test 2: High Risk Alert (should set deadline)
    print("\n📝 Test 2: High Risk Alert (No Voice Crisis)")
    alert2 = Alert.objects.create(
        user_profile=profile,
        alert_level='Warning',
        alert_source='Combined',
        trigger_location=Point(7.356695, 5.125086, srid=4326),
        risk_score=80,
        reason="High risk detected: Zone=70, Time=20",
        status='Active'
    )
    
    AdminAlertService.handle_high_risk_alert(alert2)
    
    print(f"   Alert ID: {alert2.id}")
    print(f"   Logged to admin: {alert2.logged_to_admin}")
    print(f"   Status: {alert2.status}")
    print(f"   Response deadline: {alert2.user_response_deadline}")
    
    # Test 3: Check expired alerts
    print("\n📝 Test 3: Checking Expired Alerts")
    
    # Create an expired alert
    alert3 = Alert.objects.create(
        user_profile=profile,
        alert_level='Warning',
        alert_source='Location',
        trigger_location=Point(7.356695, 5.125086, srid=4326),
        risk_score=75,
        reason="High risk detected",
        status='Pending Response',
        user_response_deadline=timezone.now() - timedelta(minutes=5)  # Expired 5 min ago
    )
    
    print(f"   Created expired alert: {alert3.id}")
    print(f"   Deadline was: {alert3.user_response_deadline}")
    
    # Check for expired alerts
    count = AdminAlertService.check_expired_alerts()
    
    # Refresh alert3
    alert3.refresh_from_db()
    
    print(f"   Expired alerts found: {count}")
    print(f"   Alert {alert3.id} logged to admin: {alert3.logged_to_admin}")
    
    # Test 4: User Confirmed Safe
    print("\n📝 Test 4: User Confirmed Safe")
    alert4 = Alert.objects.create(
        user_profile=profile,
        alert_level='Warning',
        alert_source='Location',
        trigger_location=Point(7.356695, 5.125086, srid=4326),
        risk_score=75,
        reason="High risk detected",
        status='Pending Response',
        user_response_deadline=timezone.now() + timedelta(minutes=2)
    )
    
    print(f"   Created alert: {alert4.id}")
    
    AdminAlertService.user_confirmed_safe(alert4, "Shopping at market")
    alert4.refresh_from_db()
    
    print(f"   User confirmed safe")
    print(f"   Status: {alert4.status}")
    print(f"   Logged to admin: {alert4.logged_to_admin}")
    
    # Test 5: User Triggered Emergency
    print("\n📝 Test 5: User Triggered Emergency")
    alert5 = Alert.objects.create(
        user_profile=profile,
        alert_level='Emergency',
        alert_source='Manual',
        trigger_location=Point(7.356695, 5.125086, srid=4326),
        risk_score=100,
        reason="USER TRIGGERED SOS",
        status='Active'
    )
    
    AdminAlertService.user_triggered_emergency(alert5, "Need help now!")
    alert5.refresh_from_db()
    
    print(f"   Alert ID: {alert5.id}")
    print(f"   Logged to admin: {alert5.logged_to_admin}")
    print(f"   Requires attention: {alert5.requires_admin_attention}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    
    admin_alerts = AdminAlertService.get_admin_dashboard_alerts()
    critical_alerts = AdminAlertService.get_critical_alerts()
    
    print(f"Total alerts in admin dashboard: {admin_alerts.count()}")
    print(f"Critical alerts: {critical_alerts.count()}")
    
    print("\n📋 Alerts in Admin Dashboard:")
    for alert in admin_alerts:
        print(f"   - Alert {alert.id}: {alert.alert_source} | {alert.status} | Critical: {alert.requires_admin_attention}")
    
    print("\n✅ Test completed!")
    print("\nTo view in admin dashboard:")
    print("1. Login as admin user")
    print("2. Go to http://localhost:3000/admin")
    print("3. You should see the alerts listed above")

if __name__ == '__main__':
    test_alert_logging()

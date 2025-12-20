#!/usr/bin/env python
"""
Test the "I Need Help" button flow
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.safety.views import user_confirmation
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User, UserProfile
from apps.safety.models import Alert
from apps.admin_alert_service import AdminAlertService
import json

def test_emergency_button():
    print("🧪 Testing 'I Need Help' Button")
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
    
    # Count alerts before
    initial_count = Alert.objects.filter(user_profile=profile).count()
    admin_count_before = AdminAlertService.get_admin_dashboard_alerts().count()
    
    print(f"📊 Initial alerts: {initial_count}")
    print(f"📊 Admin dashboard alerts before: {admin_count_before}")
    
    # Simulate "I Need Help" button click
    print("\n🆘 Simulating 'I Need Help' button click...")
    
    factory = APIRequestFactory()
    request = factory.post(
        '/api/v1/safety/alerts/confirm/',
        data={
            'is_safe': False,
            'context': 'Test emergency - I need help!',
            'latitude': 5.125086,
            'longitude': 7.356695
        },
        format='json'
    )
    
    force_authenticate(request, user=user)
    
    # Call the view
    response = user_confirmation(request)
    
    print(f"\n📥 Response Status: {response.status_code}")
    print(f"📥 Response Data:")
    print(json.dumps(response.data, indent=2, default=str))
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! Emergency alert created")
        
        # Get the created alert
        alert_id = response.data.get('alert_id')
        
        if alert_id:
            alert = Alert.objects.get(id=alert_id)
            
            print(f"\n📋 Alert Details:")
            print(f"   ID: {alert.id}")
            print(f"   Level: {alert.alert_level}")
            print(f"   Source: {alert.alert_source}")
            print(f"   Status: {alert.status}")
            print(f"   Risk Score: {alert.risk_score}")
            print(f"   Reason: {alert.reason}")
            print(f"   Logged to Admin: {alert.logged_to_admin}")
            print(f"   Requires Attention: {alert.requires_admin_attention}")
            print(f"   Admin Notes: {alert.admin_notes}")
            
            # Check admin dashboard
            admin_count_after = AdminAlertService.get_admin_dashboard_alerts().count()
            print(f"\n📊 Admin dashboard alerts after: {admin_count_after}")
            print(f"📊 New alerts in admin dashboard: {admin_count_after - admin_count_before}")
            
            if alert.logged_to_admin:
                print("\n✅ Alert successfully logged to admin dashboard!")
            else:
                print("\n❌ Alert NOT logged to admin dashboard!")
                print("   This is a bug that needs to be fixed.")
        else:
            print("\n❌ No alert_id in response!")
    else:
        print(f"\n❌ FAILED! Status: {response.status_code}")
        print(f"   Error: {response.data}")
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    
    print("\n📋 All Admin Dashboard Alerts:")
    admin_alerts = AdminAlertService.get_admin_dashboard_alerts()[:5]
    for alert in admin_alerts:
        print(f"   - Alert {alert.id}: {alert.alert_source} | {alert.reason[:50]}...")

if __name__ == '__main__':
    test_emergency_button()

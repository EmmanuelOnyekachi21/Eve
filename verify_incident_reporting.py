#!/usr/bin/env python
"""
Comprehensive test to verify incident reporting is working end-to-end
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.prediction.models import IncidentReport
from django.contrib.gis.geos import Point
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.safety.views import report_incident
from apps.accounts.models import User, UserProfile
import json

def test_incident_report_view():
    """Test the report_incident view directly"""
    print("🧪 Testing Incident Report View...")
    print("=" * 60)
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={'username': 'testuser'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✅ Created test user: {user.email}")
    else:
        print(f"✅ Using existing test user: {user.email}")
    
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'phone_number': '+1234567890',
            'home_latitude': 5.125086,
            'home_longitude': 7.356695
        }
    )
    
    # Count incidents before
    initial_count = IncidentReport.objects.count()
    print(f"📊 Initial incident count: {initial_count}")
    
    # Create API request
    factory = APIRequestFactory()
    
    incident_data = {
        "incident_type": "Robbery",
        "latitude": 5.125086,
        "longitude": 7.356695,
        "occurred_at": timezone.now().isoformat(),
        "severity": 8,
        "description": "Test incident from verification script",
        "anonymous": False
    }
    
    print(f"\n📤 Sending request with data:")
    print(json.dumps(incident_data, indent=2, default=str))
    
    # Make POST request
    request = factory.post(
        '/api/v1/safety/report-incident/',
        data=incident_data,
        format='json'
    )
    
    # Authenticate request
    force_authenticate(request, user=user)
    
    # Call view
    response = report_incident(request)
    
    print(f"\n📥 Response Status: {response.status_code}")
    print(f"📥 Response Data:")
    print(json.dumps(response.data, indent=2, default=str))
    
    # Count incidents after
    final_count = IncidentReport.objects.count()
    print(f"\n📊 Final incident count: {final_count}")
    print(f"📊 New incidents created: {final_count - initial_count}")
    
    if response.status_code == 201:
        print("\n✅ SUCCESS! Incident report API is working correctly!")
        incident_id = response.data.get('incident_id')
        
        # Verify the incident was saved
        try:
            incident = IncidentReport.objects.get(id=incident_id)
            print(f"\n✅ Verified incident in database:")
            print(f"   ID: {incident.id}")
            print(f"   Type: {incident.incident_type}")
            print(f"   Location: {incident.location}")
            print(f"   Severity: {incident.severity}")
            print(f"   Occurred at: {incident.occurred_at}")
            print(f"   Reported by: {incident.reported_by}")
            print(f"   Description: {incident.description}")
        except IncidentReport.DoesNotExist:
            print(f"\n❌ ERROR: Incident {incident_id} not found in database!")
    else:
        print(f"\n❌ FAILED! Status code: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"   Error: {response.data}")
    
    print("\n" + "=" * 60)
    
    # Show recent incidents
    print("\n📋 Recent Incident Reports (last 5):")
    recent = IncidentReport.objects.all()[:5]
    for incident in recent:
        print(f"   - ID {incident.id}: {incident.incident_type} at {incident.occurred_at.strftime('%Y-%m-%d %H:%M')} (Severity: {incident.severity})")
        print(f"     Reported by: {incident.reported_by}, Verified: {incident.verified}")
    
    print("\n" + "=" * 60)
    print("✅ Verification complete!")

if __name__ == '__main__':
    try:
        test_incident_report_view()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

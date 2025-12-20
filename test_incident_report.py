#!/usr/bin/env python
"""
Test script to verify incident reporting is working
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.prediction.models import IncidentReport
from django.contrib.gis.geos import Point
from django.utils import timezone

def test_incident_report():
    """Test creating an incident report"""
    print("🧪 Testing Incident Report Creation...")
    print("=" * 60)
    
    # Count existing reports
    initial_count = IncidentReport.objects.count()
    print(f"📊 Initial incident count: {initial_count}")
    
    # Create a test incident
    test_incident = IncidentReport.objects.create(
        incident_type='Robbery',
        location=Point(7.356695, 5.125086, srid=4326),  # lon, lat
        occurred_at=timezone.now(),
        severity=7,
        day_of_week=timezone.now().weekday(),
        hour_of_day=timezone.now().hour,
        reported_by='User Alert',
        verified=False,
        description='Test incident report from script'
    )
    
    print(f"✅ Created incident report: ID={test_incident.id}")
    print(f"   Type: {test_incident.incident_type}")
    print(f"   Location: {test_incident.location}")
    print(f"   Severity: {test_incident.severity}")
    print(f"   Occurred at: {test_incident.occurred_at}")
    print(f"   Reported by: {test_incident.reported_by}")
    
    # Count after creation
    final_count = IncidentReport.objects.count()
    print(f"\n📊 Final incident count: {final_count}")
    print(f"✅ Successfully created {final_count - initial_count} new incident(s)")
    
    # Show recent incidents
    print("\n📋 Recent Incident Reports:")
    recent = IncidentReport.objects.all()[:5]
    for incident in recent:
        print(f"   - ID {incident.id}: {incident.incident_type} at {incident.occurred_at.strftime('%Y-%m-%d %H:%M')} (Severity: {incident.severity})")
    
    print("\n" + "=" * 60)
    print("✅ Test completed successfully!")
    
    return test_incident

if __name__ == '__main__':
    try:
        test_incident_report()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

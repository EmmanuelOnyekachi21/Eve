#!/usr/bin/env python
"""
Test the incident reporting API endpoint
"""
import requests
import json
from datetime import datetime

# API Configuration
BASE_URL = "http://localhost:8000/api/safety"
TOKEN = None  # We'll test without auth first

def test_report_incident_api():
    """Test the /api/safety/report-incident/ endpoint"""
    print("🧪 Testing Incident Report API Endpoint...")
    print("=" * 60)
    
    # Prepare test data
    incident_data = {
        "incident_type": "Robbery",
        "latitude": 5.125086,
        "longitude": 7.356695,
        "occurred_at": datetime.now().isoformat(),
        "severity": 8,
        "description": "Test incident from API test script",
        "anonymous": False
    }
    
    print(f"📤 Sending POST request to: {BASE_URL}/report-incident/")
    print(f"📦 Data: {json.dumps(incident_data, indent=2)}")
    
    # Make request
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/report-incident/",
            json=incident_data,
            headers=headers
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"📥 Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 201:
            print("\n✅ SUCCESS! Incident report created successfully!")
            data = response.json()
            print(f"   Incident ID: {data.get('incident_id')}")
            print(f"   Message: {data.get('message')}")
        else:
            print(f"\n❌ FAILED! Status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server.")
        print("   Make sure Django server is running: python manage.py runserver")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    test_report_incident_api()

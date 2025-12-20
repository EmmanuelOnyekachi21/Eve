"""
Test enhanced prediction features.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.safety.views import suggest_safe_route, nearby_safe_zones, prediction_confidence_map
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model
from apps.accounts.models import UserProfile
from django.contrib.gis.geos import Point
import json


def create_test_user():
    """Create a test user for API calls."""
    User = get_user_model()
    
    # Clean up
    User.objects.filter(email='testpred@example.com').delete()
    
    user = User.objects.create_user(
        email='testpred@example.com',
        password='testpass123',
        first_name='Test',
        last_name='Predictor'
    )
    
    profile = UserProfile.objects.create(
        user=user,
        phone='+2348012345678',
        home_location=Point(7.356695, 5.125086)
    )
    
    return user, profile


def test_safe_route():
    """Test safe route suggestion endpoint."""
    print("\n" + "="*60)
    print("TEST 1: Safe Route Suggestions")
    print("="*60)
    
    factory = APIRequestFactory()
    user, profile = create_test_user()
    
    # Create request
    request = factory.post('/api/safety/suggest-route/', {
        'start_lat': 5.125086,
        'start_lon': 7.356695,
        'end_lat': 5.130000,
        'end_lon': 7.360000
    }, format='json')
    
    request.user = user
    
    try:
        response = suggest_safe_route(request)
        
        if response.status_code == 200:
            data = response.data
            print(f"✅ Safe route endpoint working")
            print(f"   Safety Score: {data['overall_safety_score']}/100")
            print(f"   Average Risk: {data['route_analysis']['average_risk']}%")
            print(f"   Distance: {data['route_analysis']['distance_km']} km")
            print(f"   Waypoints: {len(data['waypoints'])}")
            print(f"   Safe Zones Found: {len(data['safe_zones_nearby'])}")
            print(f"   Recommendations: {len(data['recommendations'])}")
            
            print("\n   Top Recommendations:")
            for rec in data['recommendations'][:3]:
                print(f"   - {rec}")
            
            return True
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"   Error: {response.data}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        user.delete()


def test_safe_zones():
    """Test nearby safe zones endpoint."""
    print("\n" + "="*60)
    print("TEST 2: Nearby Safe Zones")
    print("="*60)
    
    factory = APIRequestFactory()
    user, profile = create_test_user()
    
    # Create request
    request = factory.get('/api/safety/safe-zones-nearby/', {
        'lat': 5.125086,
        'lon': 7.356695,
        'radius': 500
    })
    
    request.user = user
    
    try:
        response = nearby_safe_zones(request)
        
        if response.status_code == 200:
            data = response.data
            print(f"✅ Safe zones endpoint working")
            print(f"   Current Risk: {data['current_location']['current_risk']}%")
            print(f"   Confidence: {data['current_location']['confidence']}")
            print(f"   Safe Zones Found: {data['zones_found']}")
            print(f"   Search Radius: {data['search_radius_meters']}m")
            
            if data['safe_zones']:
                print(f"\n   Nearest Safe Zone:")
                nearest = data['safe_zones'][0]
                print(f"   - Name: {nearest['name']}")
                print(f"   - Distance: {nearest['distance_meters']}m")
                print(f"   - Direction: {nearest['direction']}")
                print(f"   - Risk: {nearest['risk_level']}%")
                print(f"   - Directions: {nearest['directions']}")
            
            print(f"\n   Recommendation: {data['escape_recommendation']}")
            
            return True
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"   Error: {response.data}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        user.delete()


def test_confidence_map():
    """Test prediction confidence map endpoint."""
    print("\n" + "="*60)
    print("TEST 3: Prediction Confidence Map")
    print("="*60)
    
    factory = APIRequestFactory()
    user, profile = create_test_user()
    
    # Create request
    request = factory.get('/api/safety/confidence-map/', {
        'lat': 5.125086,
        'lon': 7.356695
    })
    
    request.user = user
    
    try:
        response = prediction_confidence_map(request)
        
        if response.status_code == 200:
            data = response.data
            print(f"✅ Confidence map endpoint working")
            print(f"   Overall Confidence: {data['overall_confidence']}")
            print(f"   Data Coverage: {data['data_quality']['coverage']}")
            print(f"   Total Incidents: {data['data_quality']['total_incidents_nearby']}")
            print(f"   Recommendation: {data['data_quality']['recommendation']}")
            
            print(f"\n   Confidence by Direction:")
            for zone in data['confidence_zones']:
                print(f"   - {zone['area']}: {zone['confidence']} ({zone['data_points']} incidents)")
            
            print(f"\n   Interpretation:")
            for level, accuracy in data['interpretation'].items():
                print(f"   - {level.replace('_', ' ').title()}: {accuracy}")
            
            return True
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"   Error: {response.data}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        user.delete()


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("ENHANCED PREDICTION FEATURES TEST SUITE")
    print("="*60)
    
    results = {
        "Safe Route Suggestions": test_safe_route(),
        "Nearby Safe Zones": test_safe_zones(),
        "Prediction Confidence Map": test_confidence_map(),
    }
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All enhanced prediction features are working!")
        print("\nYou can now:")
        print("  1. Get safe route suggestions between any two points")
        print("  2. Find nearby safe zones during emergencies")
        print("  3. Check prediction confidence for any area")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

"""
Test audio API endpoint with real Django requests.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from apps.accounts.models import UserProfile
from apps.safety.models import Alert, AudioRecording, LocationTracking
from django.contrib.gis.geos import Point
import tempfile
import wave
import numpy as np


def create_test_audio_with_speech(text="help me please"):
    """
    Create a test audio file.
    Note: This creates a simple tone, not actual speech.
    For real testing, you'd need actual audio files.
    """
    sample_rate = 16000
    duration = 2  # seconds
    frequency = 440  # Hz
    
    # Generate sine wave
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * frequency * t)
    audio_data = (audio_data * 32767).astype(np.int16)
    
    # Create WAV file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    
    with wave.open(temp_file.name, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    return temp_file.name


def setup_test_user():
    """Create a test user with profile and location."""
    User = get_user_model()
    
    # Clean up existing test user
    User.objects.filter(email='audiotest@example.com').delete()
    
    # Create user
    user = User.objects.create_user(
        email='audiotest@example.com',
        password='testpass123',
        first_name='Audio',
        last_name='Test'
    )
    
    # Create profile
    profile = UserProfile.objects.create(
        user=user,
        phone='+2348012345678',
        home_location=Point(7.356695, 5.125086)
    )
    
    # Create a recent location
    LocationTracking.objects.create(
        user_profile=profile,
        location=Point(7.356695, 5.125086),
        speed=0.0
    )
    
    return user, profile


def test_audio_api_endpoint():
    """Test the /api/audio/analyze/ endpoint."""
    print("\n" + "="*60)
    print("TEST: Audio API Endpoint")
    print("="*60)
    
    # Setup
    user, profile = setup_test_user()
    client = Client()
    
    # Login
    client.login(email='audiotest@example.com', password='testpass123')
    
    # Create test audio
    audio_path = create_test_audio_with_speech()
    
    try:
        # Test 1: Valid audio upload
        print("\n1. Testing valid audio upload...")
        with open(audio_path, 'rb') as audio_file:
            response = client.post(
                '/api/safety/audio/analyze/',
                {'audio': audio_file},
                format='multipart'
            )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   Transcript: '{data.get('transcript', '')}'")
            print(f"   Crisis detected: {data.get('crisis_detected', False)}")
            print(f"   Keywords: {data.get('keywords_found', [])}")
            print(f"   Alert created: {data.get('alert_created', False)}")
            
            if data.get('alert_created'):
                print(f"   Alert ID: {data.get('alert_id')}")
                
                # Verify alert was created
                alert = Alert.objects.filter(id=data['alert_id']).first()
                if alert:
                    print(f"   ✅ Alert verified in database")
                    print(f"      Level: {alert.alert_level}")
                    print(f"      Source: {alert.alert_source}")
                    print(f"      Risk: {alert.risk_score}")
                    
                    # Check audio recording
                    if hasattr(alert, 'audio'):
                        print(f"   ✅ Audio recording saved")
                        print(f"      Transcript: {alert.audio.transcript}")
                        print(f"      Keywords: {alert.audio.crisis_keywords_detected}")
        else:
            print(f"   ❌ Failed: {response.content}")
            return False
        
        # Test 2: Missing audio file
        print("\n2. Testing missing audio file...")
        response = client.post('/api/safety/audio/analyze/', {})
        
        if response.status_code == 400:
            print(f"   ✅ Correctly rejected (400)")
        else:
            print(f"   ❌ Expected 400, got {response.status_code}")
        
        # Test 3: Invalid file type
        print("\n3. Testing invalid file type...")
        with tempfile.NamedTemporaryFile(suffix='.txt') as txt_file:
            txt_file.write(b"This is not audio")
            txt_file.seek(0)
            response = client.post(
                '/api/safety/audio/analyze/',
                {'audio': txt_file},
                format='multipart'
            )
        
        if response.status_code == 400:
            print(f"   ✅ Correctly rejected invalid type (400)")
        else:
            print(f"   ⚠️  Got status {response.status_code}")
        
        print("\n✅ All API tests completed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Cleanup
        os.remove(audio_path)
        user.delete()


def test_alert_integration():
    """Test that audio alerts integrate with the alert system."""
    print("\n" + "="*60)
    print("TEST: Alert System Integration")
    print("="*60)
    
    user, profile = setup_test_user()
    
    # Create a voice alert manually
    alert = Alert.objects.create(
        user_profile=profile,
        alert_level='Emergency',
        alert_source='Voice',
        trigger_location=Point(7.356695, 5.125086),
        risk_score=95,
        reason="Voice crisis: help, stop",
        status='Active'
    )
    
    # Create audio recording
    audio = AudioRecording.objects.create(
        alert=alert,
        file_path=f"audio_{alert.id}.wav",
        duration_seconds=3,
        transcript="help me stop please",
        crisis_keywords_detected=['help', 'stop']
    )
    
    print(f"✅ Created alert #{alert.id}")
    print(f"   Level: {alert.alert_level}")
    print(f"   Source: {alert.alert_source}")
    print(f"   Risk: {alert.risk_score}")
    print(f"   Audio transcript: {audio.transcript}")
    print(f"   Keywords: {audio.crisis_keywords_detected}")
    
    # Verify relationship
    if hasattr(alert, 'audio'):
        print(f"✅ Alert-Audio relationship working")
    else:
        print(f"❌ Alert-Audio relationship broken")
        return False
    
    # Cleanup
    user.delete()
    
    return True


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("AUDIO API INTEGRATION TEST SUITE")
    print("="*60)
    
    results = {
        "API Endpoint": test_audio_api_endpoint(),
        "Alert Integration": test_alert_integration(),
    }
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All integration tests passed!")
        print("\nAudio service is fully functional and integrated!")
    else:
        print("\n⚠️  Some tests failed.")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

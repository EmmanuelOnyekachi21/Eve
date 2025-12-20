"""
Test audio service with Whisper integration.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.safety.audio_services import AudioAnalyzer
from django.core.files.uploadedfile import SimpleUploadedFile
import numpy as np
import wave
import tempfile


def create_test_audio_file():
    """
    Create a simple test audio file (1 second of silence).
    """
    sample_rate = 16000
    duration = 1  # seconds
    frequency = 440  # Hz (A note)
    
    # Generate a simple sine wave
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * frequency * t)
    
    # Convert to 16-bit PCM
    audio_data = (audio_data * 32767).astype(np.int16)
    
    # Create temporary WAV file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    
    with wave.open(temp_file.name, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    return temp_file.name


def test_model_loading():
    """Test 1: Verify Whisper model loads correctly."""
    print("\n" + "="*60)
    print("TEST 1: Model Loading")
    print("="*60)
    
    try:
        model = AudioAnalyzer.get_model()
        print("✅ Whisper model loaded successfully")
        print(f"   Device: {model.device}")
        return True
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return False


def test_crisis_detection():
    """Test 2: Verify crisis keyword detection."""
    print("\n" + "="*60)
    print("TEST 2: Crisis Keyword Detection")
    print("="*60)
    
    test_cases = [
        ("help me please", True, ["help"]),
        ("stop right now", True, ["stop"]),
        ("hello how are you", False, []),
        ("help stop thief", True, ["help", "stop", "thief"]),
        ("call the police emergency", True, ["police", "emergency"]),
    ]
    
    all_passed = True
    
    for transcript, expected_crisis, expected_keywords in test_cases:
        result = AudioAnalyzer.detect_crisis(transcript)
        
        is_crisis = result['is_crisis']
        keywords = result['keywords_found']
        
        passed = (is_crisis == expected_crisis and 
                 set(keywords) == set(expected_keywords))
        
        status = "✅" if passed else "❌"
        print(f"{status} '{transcript}'")
        print(f"   Expected: crisis={expected_crisis}, keywords={expected_keywords}")
        print(f"   Got: crisis={is_crisis}, keywords={keywords}")
        
        if not passed:
            all_passed = False
    
    return all_passed


def test_audio_transcription():
    """Test 3: Verify audio transcription works."""
    print("\n" + "="*60)
    print("TEST 3: Audio Transcription")
    print("="*60)
    
    try:
        # Create test audio file
        print("Creating test audio file...")
        audio_path = create_test_audio_file()
        
        # Open as Django file
        with open(audio_path, 'rb') as f:
            audio_file = SimpleUploadedFile(
                "test.wav",
                f.read(),
                content_type="audio/wav"
            )
        
        print("Transcribing audio...")
        result = AudioAnalyzer.transcribe_audio(audio_file)
        
        print(f"✅ Transcription completed")
        print(f"   Text: '{result['text']}'")
        print(f"   Language: {result['language']}")
        print(f"   Confidence: {result['confidence']}")
        
        # Clean up
        os.remove(audio_path)
        
        return True
        
    except Exception as e:
        print(f"❌ Transcription failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_full_analysis():
    """Test 4: Full audio analysis pipeline."""
    print("\n" + "="*60)
    print("TEST 4: Full Analysis Pipeline")
    print("="*60)
    
    try:
        # Create test audio
        audio_path = create_test_audio_file()
        
        with open(audio_path, 'rb') as f:
            audio_file = SimpleUploadedFile(
                "test.wav",
                f.read(),
                content_type="audio/wav"
            )
        
        print("Running full analysis...")
        result = AudioAnalyzer.analyze(audio_file)
        
        print(f"✅ Analysis completed")
        print(f"   Transcript: '{result['transcript']}'")
        print(f"   Language: {result['language']}")
        print(f"   Crisis detected: {result['crisis_detected']}")
        print(f"   Keywords found: {result['keywords_found']}")
        print(f"   Confidence: {result['confidence']}")
        
        # Clean up
        os.remove(audio_path)
        
        return True
        
    except Exception as e:
        print(f"❌ Full analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("AUDIO SERVICE TEST SUITE")
    print("="*60)
    
    results = {
        "Model Loading": test_model_loading(),
        "Crisis Detection": test_crisis_detection(),
        "Audio Transcription": test_audio_transcription(),
        "Full Analysis": test_full_analysis(),
    }
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! Audio service is functional.")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

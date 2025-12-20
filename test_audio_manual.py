"""
Manual test for audio service - creates a sample audio file for testing.
"""

import wave
import numpy as np
import os

def create_test_audio(filename="test_audio.wav", duration=2):
    """
    Create a simple test audio file.
    """
    sample_rate = 16000
    frequency = 440  # Hz (A note)
    
    # Generate sine wave
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * frequency * t)
    audio_data = (audio_data * 32767).astype(np.int16)
    
    # Create WAV file
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    print(f"✅ Created test audio file: {filename}")
    print(f"   Duration: {duration} seconds")
    print(f"   Sample rate: {sample_rate} Hz")
    print(f"   File size: {os.path.getsize(filename)} bytes")
    print(f"\nYou can now test the audio endpoint with:")
    print(f"curl -X POST http://localhost:8000/api/safety/audio/analyze/ \\")
    print(f"  -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print(f"  -F 'audio=@{filename}'")
    
    return filename

if __name__ == "__main__":
    create_test_audio()

"""
Test whispher voice detection.
"""

import whisper

def test_whisper():
    print("Loading Whisper model...")
    model = whisper.load_model("base")
    print("✅ Model loaded successfully!\n")
    
    # For now, just test the model loads
    # We'll test with real audio in Task 3B
    
    print("Model info:")
    print(f"  Device: {model.device}")
    print(f"  Model type: base")
    
    print("\n✅ Whisper is ready for integration!")

if __name__ == "__main__":
    test_whisper()

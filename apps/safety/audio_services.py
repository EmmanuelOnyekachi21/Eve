"""
Audio Analysis service using whisper
"""

import whisper
import os
import tempfile
from django.core.files.storage import default_storage
from django.conf import settings


class AudioAnalyzer:
    """
    Handles audio transcription and crisis detection.
    """

    # crrisis keywords
    CRISIS_KEYWORD = [
        'help',
        'stop',
        'no',
        'leave me alone',
        'let me go',
        'thief',
        'robber',
        'kidnap',
        'rape',
        'assault',
        'police',
        'emergency',
        # Nigerian-specific terms if needed
        'ole',  # Thief in Yoruba
        'abeg',
    ]

    _model = None

    @classmethod
    def get_model(cls):
        """
        Load Whisper model.
        """
        if cls._model == None:
            print("Loading Whisper model (first_time only)...")
            cls._model = whisper.load_model('base')
            print("✅ Whisper model loaded")
        return cls._model

    
    @classmethod
    def transcribe_audio(cls, audio_file):
        """
        Transcribe audio file to text.
        
        Args:
            audio_file: Django UploadedFile or file path
            
        Returns:
            {
                'text': 'transcribed text',
                'language': 'en',
                'confidence': 0.95
            }
        """
        model = cls.get_model()

        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            # Write uploaded audio to temp file
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe audio
            result = model.transcribe(temp_file_path)

            return {
                'text': result['text'].strip(),
                'language': result.get('language', 'en'),
                'confidence': result.get('confidence', 1.0)
            }

        except Exception as e:
            print(f"Error transcribing audio: {str(e)}")
            return {
                'text': '',
                'language': 'en',
                'confidence': 0.0
            }
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)


    @classmethod
    def detect_crisis(cls, transcript):
        """
        Detect crisis keywords in transcript.

        Args:
            transcript: String of transcribed text
            
        Returns:
            {
                'is_crisis': True/False,
                'keywords_found': ['help', 'stop'],
                'confidence': 0.95
            }
        """

        if not transcript:
            return {
                'is_crisis': False,
                'keywords_found': [],
                'confidence': 0.0
            }
        
        transcript_lower = transcript.lower()

        # Find matching keywords (use word boundaries to avoid false positives)
        keywords_found = []
        words = transcript_lower.split()

        for keyword in cls.CRISIS_KEYWORD:
            # Check for exact word match or phrase match
            if ' ' in keyword:
                # Multi-word phrase
                if keyword in transcript_lower:
                    keywords_found.append(keyword)
            else:
                # Single word - check if it's a complete word
                if keyword in words:
                    keywords_found.append(keyword)
        
        if not keywords_found:
            return {
                'is_crisis': False,
                'keywords_found': [],
                'confidence': 0.0
            }
        
        # Calculate confidence score
        confidence = len(keywords_found) / len(cls.CRISIS_KEYWORD)
        
        return {
            'is_crisis': True,
            'keywords_found': keywords_found,
            'confidence': confidence
        }
    
    @classmethod
    def analyze(cls, audio_file):
        """
        Full analysis: transcribe + detect crisis
        
        Args:
            audio_file: Django UploadedFile
            
        Returns:
            {
                'transcript': 'help me please',
                'crisis_detected': True,
                'keywords_found': ['help'],
                'confidence': 0.95
            }
        """

        # step 1: Transcribe
        transcription = cls.transcribe_audio(audio_file=audio_file)

        # step 2: Detect crisis
        crisis_detection = cls.detect_crisis(transcription['text'])

        # Step 3: Combine
        return {
            'transcript': transcription['text'],
            'language': transcription['language'],
            'crisis_detected': crisis_detection['is_crisis'],
            'keywords_found': crisis_detection['keywords_found'],
            'confidence': crisis_detection['confidence']
        }


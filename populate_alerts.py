import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import UserProfile
from apps.safety.models import Alert
from django.contrib.gis.geos import Point

User = get_user_model()

def populate():
    print("Generating mock alerts...")
    
    # Get or create a test user
    email = 'admin_demo@example.com' # Use a distinct email for demo
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=email,
            password='password123',
            first_name='Demo',
            last_name='User'
        )
        print("Created test user")
        
    try:
        user_profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        user_profile = UserProfile.objects.create(
            user=user,
            phone='+2348012345678'
        )
        print("Created user profile")

    # Generate random alerts
    sources = ['Location', 'Voice', 'Prediction', 'Manual', 'Combined']
    reasons = [
        "Unusual movement detected",
        "Voice crisis detected: 'Help me'",
        "High prediction risk zone",
        "User pressed panic button",
        "Route deviation detected"
    ]
    
    # Base location (Lagos roughly)
    base_lat = 5.125
    base_lon = 7.356
    
    count = 0
    for i in range(12): # Create 12 alerts
        lat = base_lat + (random.random() - 0.5) * 0.02
        lon = base_lon + (random.random() - 0.5) * 0.02
        
        is_critical = random.choice([True, False])
        if i % 3 == 0: is_critical = True # Ensure some criticals
        
        source = random.choice(sources)
        if is_critical:
            level = 'Emergency'
        else:
            level = 'Warning'
        
        trigger_time = timezone.now() - timedelta(minutes=random.randint(1, 180))
        
        alert = Alert.objects.create(
            user_profile=user_profile,
            alert_level=level,
            alert_source=source,
            trigger_location=Point(lon, lat),
            risk_score=random.uniform(50, 100),
            reason=random.choice(reasons),
            status='Active',
            triggered_at=trigger_time,
            
            # Admin fields
            logged_to_admin=True,
            admin_notified_at=trigger_time + timedelta(seconds=10),
            requires_admin_attention=is_critical,
            user_response_deadline=trigger_time + timedelta(minutes=5) if not is_critical else None,
            admin_notes="Generated mock alert for dashboard demo"
        )
        count += 1
        
    print(f"Done! Created {count} mock alerts linked to user {user.email}")

if __name__ == '__main__':
    populate()

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from django.contrib.gis.geos import Point
from apps.safety.models import CrimeZone
from apps.prediction.models import IncidentReport
from datetime import datetime, timedelta
import random


def generate_incidents():
    """
    Generate 500 synthetic historical incidents for training.
    Incidents are distributed across crime zones with weighted risk logic.
    """

    print("Generating historical incidents...")

    # Clear existing incidents
    IncidentReport.objects.all().delete()
    print("Cleared existing incidents.")

    zones = list(CrimeZone.objects.all())

    if not zones:
        print("❌ No crime zones found! Run generate_crime_zones.py first.")
        return

    incident_types = ['Robbery', 'Assault', 'Kidnapping', 'Theft', 'Harassment']

    # 6-month range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)

    incidents_created = 0

    # Time-of-day weighting (night = more dangerous)
    hour_weights = [
        1, 1, 1, 1, 2, 3, 5, 8, 10, 5, 3, 2,   # 00–11
        2, 2, 3, 5, 8, 12, 15, 20, 18, 15, 10, 5  # 12–23
    ]

    for _ in range(500):
        # Random day in 6-month window
        random_days = random.randint(0, 180)
        incident_date = end_date - timedelta(days=random_days)

        # Weighted random hour
        hour = random.choices(range(24), weights=hour_weights)[0]
        incident_date = incident_date.replace(hour=hour, minute=random.randint(0, 59))

        # Pick zone (70% from high-risk)
        if random.random() < 0.7:
            high_risk = [z for z in zones if z.risk_level > 60]
            zone = random.choice(high_risk) if high_risk else random.choice(zones)
        else:
            zone = random.choice(zones)

        # Add a slight geo-jitter so incidents do not sit on the exact zone point
        lat_offset = random.uniform(-0.0003, 0.0003)
        lon_offset = random.uniform(-0.0003, 0.0003)

        incident_location = Point(
            zone.location.x + lon_offset,
            zone.location.y + lat_offset
        )

        # Incident logic based on zone severity
        if zone.risk_level >= 70:
            incident_type = random.choice(['Robbery', 'Assault', 'Kidnapping'])
            severity = random.randint(7, 10)
        elif zone.risk_level >= 40:
            incident_type = random.choice(['Robbery', 'Theft', 'Harassment'])
            severity = random.randint(4, 7)
        else:
            incident_type = random.choice(['Theft', 'Harassment'])
            severity = random.randint(1, 4)

        IncidentReport.objects.create(
            incident_type=incident_type,
            location=incident_location,
            occurred_at=incident_date,
            severity=severity,
            day_of_week=incident_date.weekday(),
            hour_of_day=hour,
            reported_by='Synthetic',
            verified=True,
            description=f"Generated {incident_type.lower()} incident for training dataset"
        )

        incidents_created += 1

        if incidents_created % 100 == 0:
            print(f"  Created {incidents_created} incidents...")

    print(f"\n✅ Created {incidents_created} historical incidents.")

    # Print breakdown statistics
    print("\nIncident Statistics:")
    for t in incident_types:
        count = IncidentReport.objects.filter(incident_type=t).count()
        print(f"  {t}: {count}")

    print("\nIncidents by Time of Day:")
    print(f"  Morning (6–11): {IncidentReport.objects.filter(hour_of_day__range=(6, 11)).count()}")
    print(f"  Afternoon (12–17): {IncidentReport.objects.filter(hour_of_day__range=(12, 17)).count()}")
    print(f"  Evening (18–21): {IncidentReport.objects.filter(hour_of_day__range=(18, 21)).count()}")
    print(f"  Night (22–23): {IncidentReport.objects.filter(hour_of_day__range=(22, 23)).count()}")
    print(f"  Late Night (0–5): {IncidentReport.objects.filter(hour_of_day__range=(0, 5)).count()}")

    print("\n🎉 Ready for LSTM training!")


if __name__ == '__main__':
    generate_incidents()

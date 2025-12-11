import os
import django
# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from django.contrib.gis.geos import Point
from apps.safety.models import CrimeZone
import random

def generate_crime_zones():
    """
    Generate 30 crime zones around the building
    """
    # ================================
    # YOUR BUILDING CENTER COORDINATES
    # ================================
    CENTER_LAT = 5.125086733333333
    CENTER_LONG = 7.356695

    print(f"Generating zones around: {CENTER_LAT}, {CENTER_LONG}")

    # Clear old zones 
    CrimeZone.objects.all().delete()
    print("Cleared existing ones")

    # ---------------------------
    # GRID-BASED RANDOM ZONES
    # ---------------------------
    zones_created = 0
    for i in range(-3, 4):
        for j in range(-3, 4):

            lat = CENTER_LAT + (i * 0.0008)
            lon = CENTER_LONG + (j * 0.0008)

            distance_from_center = (i**2 + j**2) ** 0.5

            if distance_from_center < 1:
                risk = random.randint(10, 30)
                name_prefix = "Safe Zone"
            elif distance_from_center < 2:
                risk = random.randint(30, 55)
                name_prefix = "Moderate Risk Area"
            else:
                risk = random.randint(60, 95)
                name_prefix = "High Risk Zone"

            CrimeZone.objects.create(
                name=f"{name_prefix} {zones_created + 1}",
                location=Point(lon, lat),
                risk_level=risk,
                radius=120,
                description=f"Generated grid zone ({i}, {j})"
            )

            zones_created += 1

    print(f"Created {zones_created} grid zones")


    # ---------------------------
    # YOUR REAL LOCATION POINTS
    # ---------------------------
    labeled_points = [
        ("Premises Gate", 5.1249473, 7.3565843, 20),
        ("Car Park", 5.124849416666667, 7.3565487166666665, 25),
        ("Reception", 5.125086733333333, 7.356695, 10),
        ("Bar / Lounge", 5.124768766666667, 7.356671349999999, 40),
        ("Dry Cleaning Room", 5.124745616666667, 7.356883083333334, 35),
        ("Gateman Boysquarter", 5.1245793166666667, 7.35688048333333, 30),
        ("Generator House", 5.124511483333333, 7.3572464, 70),
        ("Hall Side A", 5.12432613333333, 7.35717189999999, 45),
        ("Cybersecurity Room A", 5.124348566666667, 7.357271150000001, 50),
        ("Hall Side B", 5.12423655, 7.35734343333333, 55),
        ("Boys Hostel Entrance", 5.124278066666666, 7.357026283333332, 60),
    ]

    print("\nAdding real labeled locations...")

    for name, lat, lon, risk in labeled_points:
        CrimeZone.objects.create(
            name=name,
            location=Point(lon, lat),
            risk_level=risk,
            radius=100,
            description=f"Real building area: {name}"
        )
        print(f"  ✔ Created: {name}")

    total = CrimeZone.objects.count()

    print(f"\n🎉 TOTAL ZONES CREATED: {total}")

    print("\nZones by category:")
    print(f" Safe (0–30): {CrimeZone.objects.filter(risk_level__lte=30).count()}")
    print(f" Medium (31–60): {CrimeZone.objects.filter(risk_level__gt=30, risk_level__lte=60).count()}")
    print(f" High (61–100): {CrimeZone.objects.filter(risk_level__gt=60).count()}")


if __name__ == "__main__":
    generate_crime_zones()


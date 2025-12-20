import os
import django
# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from django.contrib.gis.geos import Point
from apps.safety.models import CrimeZone
import random


def generate_crime_zones_around_location(center_lat, center_lon, grid_size=7, spacing_km=0.5, clear_existing=False):
    """
    Generate crime zones in a grid around a specific location.
    
    Args:
        center_lat (float): Center latitude
        center_lon (float): Center longitude
        grid_size (int): Size of grid (e.g., 7 creates 7x7 = 49 zones)
        spacing_km (float): Distance between grid points in kilometers (default 0.5km = 500m)
        clear_existing (bool): Whether to clear existing zones first
    
    Returns:
        int: Number of zones created
    """
    print(f"\n{'='*60}")
    print(f"Generating Crime Zones Around Location")
    print(f"{'='*60}")
    print(f"Center: ({center_lat}, {center_lon})")
    print(f"Grid Size: {grid_size}x{grid_size}")
    print(f"Spacing: {spacing_km}km ({spacing_km * 1000}m)")
    print(f"{'='*60}\n")

    if clear_existing:
        old_count = CrimeZone.objects.count()
        CrimeZone.objects.all().delete()
        print(f"✓ Cleared {old_count} existing zones\n")

    # Convert spacing to degrees (approximate)
    # At equator: 1 degree ≈ 111km
    # For Nigeria (around 5-10° latitude): still roughly 111km per degree
    lat_spacing = spacing_km / 111.0  # degrees latitude per km
    lon_spacing = spacing_km / (111.0 * abs(center_lat / 90.0 + 0.5))  # adjust for longitude at this latitude
    
    print(f"Calculated spacing:")
    print(f"  Latitude: {lat_spacing:.6f}° ({spacing_km}km)")
    print(f"  Longitude: {lon_spacing:.6f}° ({spacing_km}km)\n")

    zones_created = 0
    half_grid = grid_size // 2

    # Create grid zones
    for i in range(-half_grid, half_grid + 1):
        for j in range(-half_grid, half_grid + 1):
            # Calculate position
            lat = center_lat + (i * lat_spacing)
            lon = center_lon + (j * lon_spacing)

            # Calculate distance from center (in grid units)
            distance_from_center = (i**2 + j**2) ** 0.5

            # Assign risk based on distance from center
            # Center is safer, edges are more dangerous
            if distance_from_center < 1.5:
                risk = random.randint(10, 35)
                name_prefix = "Safe Zone"
                radius = 200
            elif distance_from_center < 3:
                risk = random.randint(30, 60)
                name_prefix = "Moderate Risk"
                radius = 250
            else:
                risk = random.randint(55, 90)
                name_prefix = "High Risk"
                radius = 300

            # Add some randomness to make it realistic
            risk = min(100, max(0, risk + random.randint(-10, 10)))

            zone = CrimeZone.objects.create(
                name=f"{name_prefix} ({i:+d},{j:+d})",
                location=Point(lon, lat),
                risk_level=risk,
                radius=radius,
                description=f"Grid zone at offset ({i}, {j}) from center. Distance: {distance_from_center:.1f} units"
            )

            zones_created += 1

            # Print progress every 10 zones
            if zones_created % 10 == 0:
                print(f"  Created {zones_created} zones...")

    print(f"\n✓ Created {zones_created} grid zones")

    # Print statistics
    total = CrimeZone.objects.count()
    safe = CrimeZone.objects.filter(risk_level__lte=30).count()
    medium = CrimeZone.objects.filter(risk_level__gt=30, risk_level__lte=60).count()
    high = CrimeZone.objects.filter(risk_level__gt=60).count()

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Total Zones: {total}")
    print(f"  Safe (0-30):     {safe:3d} zones ({safe/total*100:.1f}%)")
    print(f"  Medium (31-60):  {medium:3d} zones ({medium/total*100:.1f}%)")
    print(f"  High (61-100):   {high:3d} zones ({high/total*100:.1f}%)")
    print(f"{'='*60}\n")

    return zones_created


def generate_zones_for_user(user_profile, grid_size=7, spacing_km=0.5, clear_existing=False):
    """
    Generate crime zones around a user's home location.
    
    Args:
        user_profile: UserProfile instance
        grid_size (int): Size of grid
        spacing_km (float): Distance between grid points in km
        clear_existing (bool): Whether to clear existing zones
    
    Returns:
        int: Number of zones created
    """
    if not user_profile.home_latitude or not user_profile.home_longitude:
        print("ERROR: User profile does not have home location set")
        return 0

    print(f"Generating zones for user: {user_profile.user.email}")
    return generate_crime_zones_around_location(
        center_lat=user_profile.home_latitude,
        center_lon=user_profile.home_longitude,
        grid_size=grid_size,
        spacing_km=spacing_km,
        clear_existing=clear_existing
    )


def generate_zones_from_current_location(latitude, longitude, grid_size=7, spacing_km=0.5, clear_existing=False):
    """
    Generate crime zones around any given coordinates.
    Useful for generating zones based on user's current GPS location.
    
    Args:
        latitude (float): Current latitude
        longitude (float): Current longitude
        grid_size (int): Size of grid
        spacing_km (float): Distance between grid points in km
        clear_existing (bool): Whether to clear existing zones
    
    Returns:
        int: Number of zones created
    """
    return generate_crime_zones_around_location(
        center_lat=latitude,
        center_lon=longitude,
        grid_size=grid_size,
        spacing_km=spacing_km,
        clear_existing=clear_existing
    )


# ============================================================================
# COMMAND LINE USAGE
# ============================================================================

if __name__ == "__main__":
    import sys
    
    print("\n" + "="*60)
    print("DYNAMIC CRIME ZONE GENERATOR")
    print("="*60 + "\n")
    
    # Check for command line arguments
    if len(sys.argv) >= 3:
        try:
            lat = float(sys.argv[1])
            lon = float(sys.argv[2])
            grid_size = int(sys.argv[3]) if len(sys.argv) > 3 else 7
            spacing = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
            
            print(f"Using command line arguments:")
            print(f"  Latitude: {lat}")
            print(f"  Longitude: {lon}")
            print(f"  Grid Size: {grid_size}")
            print(f"  Spacing: {spacing}km\n")
            
            generate_crime_zones_around_location(
                center_lat=lat,
                center_lon=lon,
                grid_size=grid_size,
                spacing_km=spacing,
                clear_existing=True
            )
        except ValueError as e:
            print(f"ERROR: Invalid arguments - {e}")
            print("\nUsage: python generate_crime_zones_dynamic.py <lat> <lon> [grid_size] [spacing_km]")
            print("Example: python generate_crime_zones_dynamic.py 5.125086 7.356695 7 0.5")
            sys.exit(1)
    else:
        # Default: Use Uyo, Nigeria coordinates
        print("No arguments provided. Using default location (Uyo, Nigeria)")
        print("Usage: python generate_crime_zones_dynamic.py <lat> <lon> [grid_size] [spacing_km]")
        print("Example: python generate_crime_zones_dynamic.py 5.125086 7.356695 7 0.5\n")
        
        # Default Uyo coordinates
        DEFAULT_LAT = 5.125086
        DEFAULT_LON = 7.356695
        
        generate_crime_zones_around_location(
            center_lat=DEFAULT_LAT,
            center_lon=DEFAULT_LON,
            grid_size=7,
            spacing_km=0.5,
            clear_existing=True
        )
    
    print("\n✅ Done! Crime zones are ready for use.\n")

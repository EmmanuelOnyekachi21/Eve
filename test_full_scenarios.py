# test_full_scenarios.py
import requests
import time
import json

base_url = "http://localhost:8000/api/v1/safety"

def print_header(title):
    print(f"\n{'='*10} {title} {'='*10}")

def test_get_crime_zones():
    print_header("Testing GET /zones/")
    try:
        resp = requests.get(f"{base_url}/zones/")
        if resp.status_code == 200:
            print("SUCCESS: Retrieved crime zones")
            print(f"Count: {len(resp.json())}")
        else:
            print(f"FAILED: Status {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"ERROR: {e}")

def test_get_nearby_zones():
    print_header("Testing GET /zones/nearby/")
    # Valid request
    params = {"lat": 5.124511, "lon": 7.357246, "radius": 500}
    print(f"Requesting nearby zones for {params}...")
    try:
        resp = requests.get(f"{base_url}/zones/nearby/", params=params)
        if resp.status_code == 200:
            print("SUCCESS: Retrieved nearby zones")
            data = resp.json()
            print(f"Found: {len(data)} zones")
            for zone in data:
                print(f" - {zone.get('name', 'Unknown')} (Risk: {zone.get('risk_level')})")
        else:
            print(f"FAILED: Status {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"ERROR: {e}")

    # Error handling test: Missing params
    print("\nTesting missing parameters (expecting 400)...")
    resp = requests.get(f"{base_url}/zones/nearby/")
    if resp.status_code == 400:
        print("SUCCESS: Correctly handled missing parameters")
    else:
        print(f"FAILED: Expected 400, got {resp.status_code}")

    # Error handling test: Invalid params
    print("\nTesting invalid parameters (expecting 400)...")
    resp = requests.get(f"{base_url}/zones/nearby/", params={"lat": "invalid", "lon": 7.35})
    if resp.status_code == 400:
        print("SUCCESS: Correctly handled invalid parameters")
    else:
        print(f"FAILED: Expected 400, got {resp.status_code}")

def test_risk_scenario():
    # Scenario: User walking to Generator House, stops there at night
    print_header("FULL RISK SCENARIO TEST")
    
    # 1. Normal walking near Reception
    print("1. Walking normally near Reception...")
    for i in range(3):
        resp = requests.post(f"{base_url}/location/", json={
            "latitude": 5.125086 + (i * 0.0002),
            "longitude": 7.356695 + (i * 0.0002),
            "speed": 18,
            "battery_level": 90
        })
        # print(f"Update {i+1}: {resp.status_code}")
        time.sleep(0.5)

    # Check risk (should be low)
    risk = requests.post(f"{base_url}/risk/calculate/", json={
        "latitude": 5.125086,
        "longitude": 7.356695,
        "speed": 18
    })
    if risk.status_code == 200:
        print(f"Risk: {risk.json().get('risk_score')}")
    else:
        print(f"Risk Check Failed: {risk.text}")

    # 2. Moving toward Generator House
    print("\n2. Approaching danger zone (Generator House)...")
    for i in range(3):
        lat = 5.125086 - (i * 0.0001)  # Moving south
        lon = 7.356695 + (i * 0.00015)  # Moving east
        requests.post(f"{base_url}/location/", json={
            "latitude": lat,
            "longitude": lon,
            "speed": 15,
            "battery_level": 85
        })
        time.sleep(0.5)

    # Check risk (should be increasing)
    risk = requests.post(f"{base_url}/risk/calculate/", json={
        "latitude": 5.124511,
        "longitude": 7.357246,
        "speed": 15
    })
    if risk.status_code == 200:
        data = risk.json()
        print(f"Risk: {data.get('risk_score')}")
        print(f"Nearest zone: {data.get('nearest_danger_zone')}")
    else:
        print(f"Risk Check Failed: {risk.text}")

    # 3. Stop in Generator House (danger!)
    print("\n3. STOPPED in Generator House (Simulating 2 mins)...")
    # Sending fewer requests to save time during test, but mocking 'stopped' behavior
    for i in range(5): 
        requests.post(f"{base_url}/location/", json={
            "latitude": 5.124511,
            "longitude": 7.357246,
            "speed": 0,  # STOPPED
            "battery_level": 80
        })
        # print(f"   Update {i+1} (stopped)")
        time.sleep(0.5)

    # Final risk check
    print("\n4. Final risk calculation...")
    risk = requests.post(f"{base_url}/risk/calculate/", json={
        "latitude": 5.124511,
        "longitude": 7.357246,
        "speed": 0
    })

    if risk.status_code == 200:
        result = risk.json()
        print(f"\n=== FINAL RESULTS ===")
        print(f"Risk Score: {result.get('risk_score')}/100")
        print(f"Risk Level: {result.get('risk_level')}")
        print(f"Should Alert: {result.get('should_alert')}")
        print(f"Reason: {result.get('reason')}")
        if 'anomalies' in result:
             print(f"\nAnomalies Detected: {result['anomalies'].get('count')}")
             for anomaly in result['anomalies'].get('details', []):
                 print(f"  - {anomaly}")
             print(f"Total Risk Added from Anomalies: {result['anomalies'].get('risk_added')}")
    else:
        print(f"Final Risk Check Failed: {risk.text}")

if __name__ == "__main__":
    test_get_crime_zones()
    test_get_nearby_zones()
    test_risk_scenario()
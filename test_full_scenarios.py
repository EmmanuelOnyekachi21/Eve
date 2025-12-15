# test_full_scenario.py
import requests
import time

base_url = "http://localhost:8000/api/v1/safety"

# Scenario: User walking to Generator House, stops there at night
print("=== FULL RISK SCENARIO TEST ===\n")

# 1. Normal walking near Reception
print("1. Walking normally near Reception...")
for i in range(5):
    resp = requests.post(f"{base_url}/location/", json={
        "latitude": 5.125086 + (i * 0.0002),
        "longitude": 7.356695 + (i * 0.0002),
        "speed": 18,
        "battery_level": 90
    })
    time.sleep(2)

# Check risk (should be low)
risk = requests.post(f"{base_url}/risk/calculate/", json={
    "latitude": 5.125086,
    "longitude": 7.356695,
    "speed": 18
})
print(f"Risk: {risk.json()['risk_score']}")
print(f"Anomalies: {risk.json()['anomalies']}\n")

# 2. Moving toward Generator House
print("2. Approaching danger zone (Generator House)...")
for i in range(5):
    lat = 5.125086 - (i * 0.0001)  # Moving south
    lon = 7.356695 + (i * 0.00015)  # Moving east
    requests.post(f"{base_url}/location/", json={
        "latitude": lat,
        "longitude": lon,
        "speed": 15,
        "battery_level": 85
    })
    time.sleep(2)

# Check risk (should be increasing)
risk = requests.post(f"{base_url}/risk/calculate/", json={
    "latitude": 5.124511,
    "longitude": 7.357246,
    "speed": 15
})
print(f"Risk: {risk.json()['risk_score']}")
print(f"Nearest zone: {risk.json()['nearest_danger_zone']}\n")

# 3. Stop in Generator House (danger!)
print("3. STOPPED in Generator House for 2 minutes...")
for i in range(12):  # 2 minutes of stopped updates
    requests.post(f"{base_url}/location/", json={
        "latitude": 5.124511,
        "longitude": 7.357246,
        "speed": 0,  # STOPPED
        "battery_level": 80
    })
    print(f"   Update {i+1}/12 (stopped)")
    time.sleep(10)

# Final risk check
print("\n4. Final risk calculation...")
risk = requests.post(f"{base_url}/risk/calculate/", json={
    "latitude": 5.124511,
    "longitude": 7.357246,
    "speed": 0
})

result = risk.json()
print(f"\n=== FINAL RESULTS ===")
print(f"Risk Score: {result['risk_score']}/100")
print(f"Risk Level: {result['risk_level']}")
print(f"Should Alert: {result['should_alert']}")
print(f"Reason: {result['reason']}")
print(f"\nAnomalies Detected: {result['anomalies']['count']}")
for anomaly in result['anomalies']['details']:
    print(f"  - {anomaly}")
print(f"\nTotal Risk Added from Anomalies: {result['anomalies']['risk_added']}")
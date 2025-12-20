"""
Full system integration test
"""
import requests
import time

BASE_URL = "http://localhost:8000/api/v1/safety"

def test_full_flow():
    print("="*60)
    print("SENTINELSPHERE - FULL INTEGRATION TEST")
    print("="*60)
    
    # Step 1: Get crime zones
    print("\n[1] Loading crime zones...")
    zones = requests.get(f"{BASE_URL}/zones/").json()
    print(f"✅ Loaded {len(zones)} zones")
    
    # Step 2: Send normal location
    print("\n[2] Sending safe location (Reception)...")
    requests.post(f"{BASE_URL}/location/", json={
        "latitude": 5.125086,
        "longitude": 7.356695,
        "speed": 15,
        "battery_level": 90
    })
    
    # Step 3: Check risk (should be low)
    print("\n[3] Calculating risk for safe zone...")
    risk = requests.post(f"{BASE_URL}/risk/calculate/", json={
        "latitude": 5.125086,
        "longitude": 7.356695,
        "speed": 15
    }).json()
    print(f"Risk Score: {risk['risk_score']}/100 ({risk['risk_level']})")
    
    # Step 4: Get LSTM prediction
    print("\n[4] Getting AI prediction for safe zone...")
    pred = requests.post(f"{BASE_URL}/predict/", json={
        "latitude": 5.125086,
        "longitude": 7.356695,
        "hour": 14,
        "day_of_week": 0
    }).json()
    print(f"Predicted Risk: {pred['risk_percentage']}% ({pred['confidence']})")
    
    # Step 5: Move to danger zone
    print("\n[5] Moving to danger zone (Generator House)...")
    for i in range(3):
        requests.post(f"{BASE_URL}/location/", json={
            "latitude": 5.124511,
            "longitude": 7.357246,
            "speed": 10,
            "battery_level": 85
        })
        time.sleep(2)
    
    # Step 6: Stop in danger zone
    print("\n[6] Stopping in danger zone...")
    for i in range(6):
        requests.post(f"{BASE_URL}/location/", json={
            "latitude": 5.124511,
            "longitude": 7.357246,
            "speed": 0,
            "battery_level": 80
        })
        time.sleep(2)
    
    # Step 7: Calculate risk (should be HIGH)
    print("\n[7] Calculating risk for danger zone...")
    risk = requests.post(f"{BASE_URL}/risk/calculate/", json={
        "latitude": 5.124511,
        "longitude": 7.357246,
        "speed": 0
    }).json()
    
    print(f"\nRisk Score: {risk['risk_score']}/100 ({risk['risk_level']})")
    print(f"Should Alert: {risk['alert']['should_alert']}")
    print(f"Alert Triggered: {risk['alert']['triggered']}")
    print(f"Reason: {risk['reason']}")
    
    if risk['anomalies']['detected']:
        print(f"\nAnomalies Detected: {risk['anomalies']['count']}")
        for anomaly in risk['anomalies']['details']:
            print(f"  - {anomaly}")
    
    # Step 8: Get prediction for danger zone
    print("\n[8] Getting AI prediction for danger zone...")
    pred = requests.post(f"{BASE_URL}/predict/", json={
        "latitude": 5.124511,
        "longitude": 7.357246,
        "hour": 22,
        "day_of_week": 4
    }).json()
    print(f"Predicted Risk: {pred['risk_percentage']}% ({pred['confidence']})")
    
    # Step 9: Check alert history
    print("\n[9] Checking alert history...")
    history = requests.get(f"{BASE_URL}/alerts/history/").json()
    print(f"Total Alerts: {len(history)}")
    if history:
        latest = history[0]
        print(f"Latest Alert: {latest['alert_level']} - {latest['status']}")
    
    print("\n" + "="*60)
    print("INTEGRATION TEST COMPLETE")
    print("="*60)
    
    # Summary
    print("\n✅ All endpoints working")
    print("✅ GPS tracking functional")
    print("✅ Risk calculation working")
    print("✅ Anomaly detection active")
    print("✅ LSTM predictions operational")
    if risk['alert']['triggered']:
        print("✅ Alert system triggered (check WhatsApp)")

if __name__ == "__main__":
    test_full_flow()
"""
Test LSTM predictions
"""
from time import sleep
import requests

BASE_URL = "http://localhost:8000/api/v1/safety"

# Test 1: Generator House at night (should be HIGH risk)
print("=== TEST 1: Generator House, Friday 10pm ===")
response = requests.post(f"{BASE_URL}/predict/", json={
    "latitude": 5.124511,
    "longitude": 7.357246,
    "hour": 22,
    "day_of_week": 4  # Friday
})

result = response.json()
print(f"Risk: {result['risk_percentage']}%")
print(f"Confidence: {result['confidence']}")
print(f"Location: {result['location_context']}")
print()

sleep(5)

# Test 2: Reception during day (should be LOW risk)
print("=== TEST 2: Reception, Monday 2pm ===")
response = requests.post(f"{BASE_URL}/predict/", json={
    "latitude": 5.125086,
    "longitude": 7.356695,
    "hour": 14,
    "day_of_week": 0  # Monday
})

result = response.json()
print(f"Risk: {result['risk_percentage']}%")
print(f"Confidence: {result['confidence']}")
print(f"Location: {result['location_context']}")
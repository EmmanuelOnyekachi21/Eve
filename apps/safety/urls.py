from django.urls import path
from .views import (
    location_tracking,
    get_crimezones,
    get_crimezones_nearby,
    calculate_risk
)

urlpatterns = [
    path('location/', location_tracking, name='location_tracking'),
    path('zones/', get_crimezones, name='get_crimezones'),
    path('zones/nearby/', get_crimezones_nearby, name='get_crimezones_nearby'),
    path('risk/calculate/', calculate_risk, name='calculate_risk')
]

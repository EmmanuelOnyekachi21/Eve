from django.urls import path
from . import views

urlpatterns = [
    path('users', views.list_users, name='list_users'),
    path('profiles/', views.list_profiles, name='list_profiles'),
    path('contacts/', views.list_contacts, name='list_contacts'),
    
    # Current user endpoints
    path('profile/', views.current_user_profile, name='current_user_profile'),
    path('emergency-contacts/', views.emergency_contacts, name='emergency_contacts'),
    path('emergency-contacts/<uuid:contact_id>/', views.emergency_contact_detail, name='emergency_contact_detail'),
]
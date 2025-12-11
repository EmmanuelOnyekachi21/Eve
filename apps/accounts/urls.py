from django.urls import path
from . import views

urlpatterns = [
    path('users', views.list_users, name='list_users'),
    path('profiles/', views.list_profiles, name='list_profiles'),
    path('contacts/', views.list_contacts, name='list_contacts'),
]
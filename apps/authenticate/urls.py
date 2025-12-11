from django.urls import path
from apps.authenticate import views

urlpatterns = [
    path('register/', views.register, name="register"),
    path('login/', views.login, name="login"),
    path('refresh/', views.refresh, name="refresh"),
]
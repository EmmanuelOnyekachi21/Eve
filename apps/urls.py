from django.urls import path, include

urlpatterns = [
    path('users/', include('apps.accounts.urls')),
]

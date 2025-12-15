from django.urls import path, include

urlpatterns = [
    path('users/', include('apps.accounts.urls')),
    path('auth/', include('apps.authenticate.urls')),
    path('safety/', include('apps.safety.urls')),
]

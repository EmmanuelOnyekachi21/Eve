from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile, EmergencyContact
from .serializers import (
    UserSerializer, UserProfileSerializer, EmergencyContactSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()


@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def list_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def list_profiles(request):
    profiles = UserProfile.objects.all()
    serializer = UserProfileSerializer(profiles, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def list_contacts(request):
    contacts = EmergencyContact.objects.all()
    serializer = EmergencyContactSerializer(contacts, many=True)
    return Response(serializer.data)


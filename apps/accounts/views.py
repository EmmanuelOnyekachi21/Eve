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
@permission_classes([IsAuthenticated])
def list_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_profiles(request):
    profiles = UserProfile.objects.all()
    serializer = UserProfileSerializer(profiles, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_contacts(request):
    contacts = EmergencyContact.objects.all()
    serializer = EmergencyContactSerializer(contacts, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def current_user_profile(request):
    """Get or update current user's profile"""
    # Get or create profile (handles admin users created via createsuperuser)
    profile, created = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={
            'phone': '',
            'home_location': None,
            'work_location': None,
            'profile_completed': False
        }
    )
    
    if created:
        print(f"✅ Auto-created profile for user: {request.user.email}")
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserProfileSerializer(
            profile, 
            data=request.data, 
            partial=(request.method == 'PATCH')
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def emergency_contacts(request):
    """List or create emergency contacts for current user"""
    # Get or create profile
    profile, created = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={
            'phone': '',
            'home_location': None,
            'work_location': None,
            'profile_completed': False
        }
    )
    
    if request.method == 'GET':
        contacts = profile.emergency_contacts.all()
        serializer = EmergencyContactSerializer(contacts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = EmergencyContactSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def emergency_contact_detail(request, contact_id):
    """Get, update or delete a specific emergency contact"""
    # Get or create profile
    profile, created = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={
            'phone': '',
            'home_location': None,
            'work_location': None,
            'profile_completed': False
        }
    )
    
    try:
        contact = profile.emergency_contacts.get(id=contact_id)
    except EmergencyContact.DoesNotExist:
        return Response(
            {'detail': 'Contact not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = EmergencyContactSerializer(contact)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = EmergencyContactSerializer(
            contact,
            data=request.data,
            partial=(request.method == 'PATCH')
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        contact.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


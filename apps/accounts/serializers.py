from rest_framework import serializers
from .models import User, UserProfile, EmergencyContact


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'user',
            'phone',
            'home_location',
            'work_location',
            'created_at'
        ]


class EmergencyContactSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='user_profile', read_only=True)

    class Meta:
        model = EmergencyContact
        fields = [
            'id',
            'profile',
            'name',
            'phone',
            'relationship',
            'priority'
        ]
        read_only_fields = ['profile']
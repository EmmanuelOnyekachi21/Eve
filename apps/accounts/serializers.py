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
    home_latitude = serializers.FloatField(write_only=True, required=False, allow_null=True)
    home_longitude = serializers.FloatField(write_only=True, required=False, allow_null=True)
    work_latitude = serializers.FloatField(write_only=True, required=False, allow_null=True)
    work_longitude = serializers.FloatField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'user',
            'phone',
            'home_location',
            'work_location',
            'home_latitude',
            'home_longitude',
            'work_latitude',
            'work_longitude',
            'profile_completed',
            'created_at'
        ]
        read_only_fields = ['created_at']

    def to_representation(self, instance):
        """Convert Point objects to lat/lon for frontend"""
        data = super().to_representation(instance)
        if instance.home_location:
            data['home_latitude'] = instance.home_location.y
            data['home_longitude'] = instance.home_location.x
        if instance.work_location:
            data['work_latitude'] = instance.work_location.y
            data['work_longitude'] = instance.work_location.x
        return data

    def update(self, instance, validated_data):
        """Handle lat/lon conversion to Point objects"""
        from django.contrib.gis.geos import Point
        
        home_lat = validated_data.pop('home_latitude', None)
        home_lon = validated_data.pop('home_longitude', None)
        work_lat = validated_data.pop('work_latitude', None)
        work_lon = validated_data.pop('work_longitude', None)

        if home_lat is not None and home_lon is not None:
            instance.home_location = Point(home_lon, home_lat)
        if work_lat is not None and work_lon is not None:
            instance.work_location = Point(work_lon, work_lat)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = [
            'id',
            'name',
            'phone',
            'relationship',
            'priority'
        ]

    def create(self, validated_data):
        """Automatically set user_profile from request context"""
        user_profile = self.context['request'].user.profile
        return EmergencyContact.objects.create(user_profile=user_profile, **validated_data)
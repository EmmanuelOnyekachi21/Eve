from rest_framework import serializers
from .models import LocationTracking, CrimeZone
from django.contrib.gis.geos import Point
from django.utils import timezone


class LocationTrackingSerializer(serializers.ModelSerializer):
    # Incoming fields from phone (NOT in model)
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    class Meta:
        model = LocationTracking
        fields = [
            'id',
            'latitude',
            'longitude',
            'speed',
            'battery_level',
            'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']
    
    # ---------- VALIDATION ----------
    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.location:
            representation['latitude'] = instance.location.y
            representation['longitude'] = instance.location.x
        return representation
    
    # ------------- CREATE LOGIC -----------------------
    def create(self, validated_data):
        latitude = validated_data.pop('latitude')
        longitude = validated_data.pop('longitude')

        # IMPORTANT: Point(lon, lat)
        location_point = Point(longitude, latitude)
        validated_data['location'] = location_point
        
        user_profile = self.context.get('user_profile')
        if not user_profile:
            raise serializers.ValidationError("User profile is required")
        
        validated_data['user_profile'] = user_profile
        
        return LocationTracking.objects.create(**validated_data)


class CrimeZoneSerializer(serializers.ModelSerializer):
    """
    Serializer for CrimeZone model
    """
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = CrimeZone
        fields = [
            'id',
            'name',
            'risk_level',
            'latitude',
            'longitude',
            'radius',
        ]

    def get_latitude(self, obj):
        # Point.y = latitude
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        # Point.x = longitude
        return obj.location.x if obj.location else None
    

class RiskCalculatorSerializer(serializers.Serializer):
    """
    Serializer for RiskCalculator model
    """
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    speed = serializers.FloatField()

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Invalid latitude")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Invalid longitude")
        return value
    def validate_speed(self, value):
        if value < 0:
            raise serializers.ValidationError("Invalid speed")
        return value



class UserConfirmationSerializer(serializers.Serializer):
    """
    User responds to safety check
    """
    is_safe = serializers.BooleanField(required=True)
    context = serializers.CharField(max_length=200, required=False, allow_blank=True)
    alert_id = serializers.IntegerField(required=False, allow_null=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    
    def validate_latitude(self, value):
        if value and (value < -90 or value > 90):
            raise serializers.ValidationError("Invalid latitude")
        return value
    
    def validate_longitude(self, value):
        if value and (value < -180 or value > 180):
            raise serializers.ValidationError("Invalid longitude")
        return value


class AlertHistorySerializer(serializers.Serializer):
    """
    Serializer for alert history
    """
    id = serializers.IntegerField()
    alert_level = serializers.CharField()
    alert_source = serializers.CharField()
    risk_score = serializers.FloatField()
    reason = serializers.CharField()
    status = serializers.CharField()
    triggered_at = serializers.DateTimeField()
    resolved_at = serializers.DateTimeField(allow_null=True)
    latitude = serializers.FloatField(allow_null=True)
    longitude = serializers.FloatField(allow_null=True)

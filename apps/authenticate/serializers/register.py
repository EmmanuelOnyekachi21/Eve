from rest_framework import serializers
from apps.accounts.models import User, UserProfile, EmergencyContact


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'password',
            'password2',
            'phone',
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        attrs.pop('password2')
        return attrs
    
    def create(self, validated_data):
        phone = validated_data.pop('phone')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(
            user=user,
            phone=phone,
        )
        return user


    

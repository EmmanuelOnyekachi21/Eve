from apps.accounts.serializers import UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers


class LoginSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    # Remove username field from parent class
    username = None
    
    def validate(self, attrs):
        # Map email to username for JWT authentication
        attrs['username'] = attrs.get('email')
        
        data = super().validate(attrs)

        refresh = self.get_token(self.user)

        data['user'] = UserSerializer(self.user).data
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        # Include profile completion status
        try:
            data['profile_completed'] = self.user.profile.profile_completed
        except:
            data['profile_completed'] = False

        return data
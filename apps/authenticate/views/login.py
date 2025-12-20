from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from apps.authenticate.serializers import LoginSerializer
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TokenError as e:
        return Response({'detail': e.args[0]}, status=status.HTTP_401_UNAUTHORIZED)
    except InvalidToken as e:
        return Response({'detail': e.args[0]}, status=status.HTTP_401_UNAUTHORIZED)
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from apps.authenticate.serializers import RegisterSerializer
from django.db import transaction

@api_view(['POST'])
def register(request):
    with transaction.atomic():
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

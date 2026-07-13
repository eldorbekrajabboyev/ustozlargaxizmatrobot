from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from api.utils import success_response
from .serializers import UserCreateSerializer, UserReadSerializer

class UserCreateOrLoginView(CreateAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return success_response(message='Validation error', errors=serializer.errors, status_code=400)
        user = serializer.save()
        read_serializer = UserReadSerializer(user)
        return success_response(data=read_serializer.data, message='User created or updated successfully', status_code=200)
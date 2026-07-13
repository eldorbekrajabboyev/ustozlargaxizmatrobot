from rest_framework import generics, permissions
from api.utils import success_response
from api.permissions import IsOwner
from .models import Order
from .serializers import OrderCreateSerializer, OrderReadSerializer

class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return success_response(message='Validation error', errors=serializer.errors, status_code=400)
        order = serializer.save()
        read_serializer = OrderReadSerializer(order)
        return success_response(data=read_serializer.data, message='Order created successfully', status_code=201)

class OrderListView(generics.ListAPIView):
    serializer_class = OrderReadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.select_related('user')
        if self.request.user.is_admin:
            return queryset
        return queryset.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data, message='Orders retrieved successfully')

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderReadSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        queryset = Order.objects.select_related('user')
        if self.request.user.is_admin:
            return queryset
        return queryset.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data, message='Order retrieved successfully')
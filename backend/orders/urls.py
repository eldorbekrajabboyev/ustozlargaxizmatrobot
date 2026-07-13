from django.urls import path
from .views import OrderCreateView, OrderListView, OrderDetailView

app_name = 'orders'
urlpatterns = [
    path('', OrderCreateView.as_view(), name='create'),
    path('me/', OrderListView.as_view(), name='list'),
    path('<uuid:pk>/', OrderDetailView.as_view(), name='detail'),
]
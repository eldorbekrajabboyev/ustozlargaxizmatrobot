from django.urls import path
from .views import PaymentUploadView, PaymentDetailView

app_name = 'payments'
urlpatterns = [
    path('upload/', PaymentUploadView.as_view(), name='upload'),
    path('<int:order_id>/', PaymentDetailView.as_view(), name='detail'),
]
from django.urls import path, include

app_name = 'api'
urlpatterns = [
    path('v1/', include([
        path('users/', include('accounts.urls', namespace='accounts')),
        path('orders/', include('orders.urls', namespace='orders')),
        path('payments/', include('payments.urls', namespace='payments')),
        path('dashboard/', include('dashboard.urls', namespace='dashboard')),
    ])),
]
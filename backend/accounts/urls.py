from django.urls import path
from .views import UserCreateOrLoginView

app_name = 'accounts'
urlpatterns = [
    path('create-or-login/', UserCreateOrLoginView.as_view(), name='create-or-login'),
]
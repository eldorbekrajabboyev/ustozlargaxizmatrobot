from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'username', 'telegram_id', 'first_name', 'last_name', 'phone_number', 'is_admin', 'is_active')
    search_fields = ('username', 'telegram_id', 'first_name', 'last_name')
    list_filter = ('is_active', 'is_staff', 'is_admin')
    ordering = ['-created_at']
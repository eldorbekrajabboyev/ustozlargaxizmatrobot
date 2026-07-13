from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'full_name', 'subject', 'grade', 'topic', 'price', 'status', 'created_at')
    search_fields = ('full_name', 'school_name', 'topic', 'order_number')
    list_filter = ('status', 'subject', 'grade', 'created_at')
    readonly_fields = ('order_number', 'user', 'created_at', 'updated_at')
    ordering = ['-created_at']
    list_per_page = 20
    list_editable = ('status',)
    fieldsets = (
        ('Order Information', {'fields': ('order_number', 'user', 'status')}),
        ('Customer Information', {'fields': ('full_name', 'region', 'district', 'school_name', 'home_address')}),
        ('Subject Information', {'fields': ('subject', 'grade', 'topic', 'price')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
from django.contrib import admin
from django.utils.html import format_html
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'status', 'receipt_preview', 'created_at')
    search_fields = ('order__order_number', 'order__full_name', 'card_number')
    list_filter = ('status', 'created_at')
    readonly_fields = ('order', 'amount', 'card_number', 'receipt_image', 'receipt_hash', 'image_hash', 'created_at', 'updated_at')
    ordering = ['-created_at']
    list_per_page = 20
    fieldsets = (
        ('Payment Information', {'fields': ('order', 'amount', 'card_number', 'status')}),
        ('Receipt', {'fields': ('receipt_image', 'receipt_hash', 'image_hash')}),
        ('Admin', {'fields': ('admin_comment',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    actions = ['approve_payments', 'reject_payments']

    @admin.display(description='Receipt')
    def receipt_preview(self, obj):
        if obj.receipt_image:
            return format_html('<img src="{}" style="max-height: 50px;" />', obj.receipt_image.url)
        return '-'

    @admin.action(description='Approve selected payments')
    def approve_payments(self, request, queryset):
        count = queryset.filter(status=Payment.Status.WAITING).update(status=Payment.Status.APPROVED)
        self.message_user(request, f'{count} payment(s) approved.')

    @admin.action(description='Reject selected payments')
    def reject_payments(self, request, queryset):
        count = queryset.filter(status=Payment.Status.WAITING).update(status=Payment.Status.REJECTED)
        self.message_user(request, f'{count} payment(s) rejected.')
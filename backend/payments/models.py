from django.db import models

class Payment(models.Model):
    class Status(models.TextChoices):
        WAITING = 'WAITING', 'Waiting'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    order = models.OneToOneField(verbose_name='Order', to='orders.Order', on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(verbose_name='Amount', max_digits=10, decimal_places=2)
    card_number = models.CharField(verbose_name='Card number', max_length=20)
    receipt_image = models.ImageField(verbose_name='Receipt image', upload_to='receipts/', blank=True, null=True)
    receipt_hash = models.CharField(verbose_name='Receipt hash', max_length=255, blank=True)
    image_hash = models.CharField(verbose_name='Image hash', max_length=255, blank=True)
    status = models.CharField(verbose_name='Status', max_length=20, choices=Status.choices, default=Status.WAITING)
    admin_comment = models.TextField(verbose_name='Admin comment', blank=True)
    created_at = models.DateTimeField(verbose_name='Created at', auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name='Updated at', auto_now=True)

    class Meta:
        verbose_name = 'payment'
        verbose_name_plural = 'payments'
        ordering = ['-created_at']
        db_table = 'payments_payment'

    def __str__(self):
        return f'Payment for {self.order.order_number}'
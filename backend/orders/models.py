import uuid
from django.db import models

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAYMENT_CHECKING = 'PAYMENT_CHECKING', 'Payment Checking'
        PAID = 'PAID', 'Paid'
        REJECTED = 'REJECTED', 'Rejected'
        COMPLETED = 'COMPLETED', 'Completed'

    order_number = models.UUIDField(verbose_name='Order number', default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(verbose_name='User', to='accounts.User', on_delete=models.CASCADE, related_name='orders')
    full_name = models.CharField(verbose_name='Full name', max_length=255)
    region = models.CharField(verbose_name='Region', max_length=100)
    district = models.CharField(verbose_name='District', max_length=100)
    school_name = models.CharField(verbose_name='School name', max_length=255)
    home_address = models.CharField(verbose_name='Home address', max_length=500)
    subject = models.CharField(verbose_name='Subject', max_length=100)
    grade = models.CharField(verbose_name='Grade', max_length=50)
    topic = models.CharField(verbose_name='Topic', max_length=255)
    price = models.DecimalField(verbose_name='Price', max_digits=10, decimal_places=2)
    status = models.CharField(verbose_name='Status', max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(verbose_name='Created at', auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name='Updated at', auto_now=True)

    class Meta:
        verbose_name = 'order'
        verbose_name_plural = 'orders'
        ordering = ['-created_at']
        db_table = 'orders_order'

    def __str__(self):
        return str(self.order_number)
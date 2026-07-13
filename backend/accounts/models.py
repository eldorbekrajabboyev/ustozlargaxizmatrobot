from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    telegram_id = models.BigIntegerField(verbose_name='Telegram ID', unique=True, null=True, blank=True)
    username = models.CharField(verbose_name='Username', max_length=150, unique=True, null=True, blank=True)
    first_name = models.CharField(verbose_name='First name', max_length=150, blank=True)
    last_name = models.CharField(verbose_name='Last name', max_length=150, blank=True)
    phone_number = models.CharField(verbose_name='Phone number', max_length=20, null=True, blank=True)
    is_admin = models.BooleanField(verbose_name='Is admin', default=False)
    created_at = models.DateTimeField(verbose_name='Created at', auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name='Updated at', auto_now=True)

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-created_at']
        db_table = 'accounts_user'

    def __str__(self):
        return self.username or str(self.telegram_id)
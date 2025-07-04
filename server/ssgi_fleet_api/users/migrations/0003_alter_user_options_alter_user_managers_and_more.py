# Generated by Django 5.2 on 2025-04-05 01:01

import django.db.models.deletion
import django.utils.timezone
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_managers'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={'ordering': ['-date_joined'], 'verbose_name': 'user', 'verbose_name_plural': 'users'},
        ),
        migrations.AlterModelManagers(
            name='user',
            managers=[
            ],
        ),
        migrations.AddField(
            model_name='department',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now, help_text='When the department was created', verbose_name='created at'),
        ),
        migrations.AddField(
            model_name='department',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, help_text='When the department was last updated', verbose_name='updated at'),
        ),
        migrations.AddField(
            model_name='user',
            name='last_password_change',
            field=models.DateTimeField(blank=True, null=True, verbose_name='last password change'),
        ),
        migrations.AddField(
            model_name='user',
            name='last_updated',
            field=models.DateTimeField(auto_now=True, verbose_name='last updated'),
        ),
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(default=uuid.uuid4, max_length=150, unique=True, verbose_name='username'),
        ),
        migrations.AlterField(
            model_name='user',
            name='date_joined',
            field=models.DateTimeField(auto_now_add=True, verbose_name='date joined'),
        ),
        migrations.AlterField(
            model_name='user',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='members', to='users.department', verbose_name='department'),
        ),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True, verbose_name='email address'),
        ),
        migrations.AlterField(
            model_name='user',
            name='mfa_secret',
            field=models.CharField(blank=True, max_length=100, verbose_name='MFA secret key'),
        ),
        migrations.AlterField(
            model_name='user',
            name='phone_number',
            field=models.CharField(blank=True, max_length=20, verbose_name='phone number'),
        ),
        migrations.AlterField(
            model_name='user',
            name='reset_token',
            field=models.CharField(blank=True, max_length=100, verbose_name='password reset token'),
        ),
        migrations.AlterField(
            model_name='user',
            name='reset_token_expires',
            field=models.DateTimeField(blank=True, null=True, verbose_name='reset token expiry'),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('employee', 'Employee'), ('driver', 'Driver'), ('admin', 'Administrator'), ('director', 'Director')], default='employee', max_length=20, verbose_name='role'),
        ),
    ]

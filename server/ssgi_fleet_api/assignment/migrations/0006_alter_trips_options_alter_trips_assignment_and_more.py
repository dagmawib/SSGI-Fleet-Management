# Generated by Django 5.2 on 2025-05-01 11:03

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assignment', '0005_rename_assignemt_trips_assignment'),
        ('request', '0004_remove_vehicle_request_duration_and_more'),
        ('vehicles', '0003_alter_vehicle_color'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='trips',
            options={'ordering': ['-created_at'], 'verbose_name': 'Trip', 'verbose_name_plural': 'Trips'},
        ),
        migrations.AlterField(
            model_name='trips',
            name='assignment',
            field=models.ForeignKey(help_text='The assignment this trip is for', on_delete=django.db.models.deletion.PROTECT, related_name='trips', to='assignment.vehicle_assignment'),
        ),
        migrations.AlterField(
            model_name='trips',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='trips',
            name='end_mileage',
            field=models.DecimalField(blank=True, decimal_places=1, help_text='Ending vehicle mileage in kilometers', max_digits=12, null=True, validators=[django.core.validators.MinValueValidator(0.0)]),
        ),
        migrations.AlterField(
            model_name='trips',
            name='end_time',
            field=models.DateTimeField(blank=True, help_text='When the trip ended', null=True),
        ),
        migrations.AlterField(
            model_name='trips',
            name='start_mileage',
            field=models.DecimalField(decimal_places=1, help_text='Starting vehicle mileage in kilometers', max_digits=12, validators=[django.core.validators.MinValueValidator(0.0)]),
        ),
        migrations.AlterField(
            model_name='trips',
            name='start_time',
            field=models.DateTimeField(help_text='When the trip started'),
        ),
        migrations.AlterField(
            model_name='trips',
            name='status',
            field=models.CharField(choices=[('Started', 'Trip Started'), ('Declined', 'Trip Declined'), ('Completed', 'Trip Completed')], default='Started', help_text='Current status of the trip', max_length=50),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='assigned_at',
            field=models.DateTimeField(auto_now_add=True, help_text='When this assignment was created'),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='assigned_by',
            field=models.ForeignKey(help_text='Admin who created this assignment', limit_choices_to={'role__in': ['admin', 'superadmin']}, on_delete=django.db.models.deletion.CASCADE, related_name='assigned_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='decline_reason',
            field=models.TextField(blank=True, help_text='Reason provided by driver if assignment was declined'),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='driver',
            field=models.ForeignKey(help_text='The driver assigned to this request', limit_choices_to={'role': 'driver'}, on_delete=django.db.models.deletion.CASCADE, related_name='assigned_to_driver', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='driver_response_time',
            field=models.DateTimeField(blank=True, help_text='When the driver accepted/declined the assignment', null=True),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='driver_status',
            field=models.CharField(choices=[('Pending', 'Pending Driver Acceptance'), ('Accepted', 'Accepted by Driver'), ('Declined', 'Declined by Driver'), ('Completed', 'Trip Completed')], default='Pending', help_text="Current status of the assignment from driver's perspective", max_length=255),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='estimated_distance',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Estimated trip distance in kilometers', max_digits=10, null=True),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='estimated_duration',
            field=models.DurationField(blank=True, help_text='Estimated trip duration', null=True),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='note',
            field=models.TextField(blank=True, help_text='Additional notes about this assignment'),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='request',
            field=models.ForeignKey(help_text='The vehicle request being fulfilled', on_delete=django.db.models.deletion.CASCADE, related_name='assignments', to='request.vehicle_request'),
        ),
        migrations.AlterField(
            model_name='vehicle_assignment',
            name='vehicle',
            field=models.ForeignKey(help_text='The vehicle assigned to this request', on_delete=django.db.models.deletion.CASCADE, related_name='assignments', to='vehicles.vehicle'),
        ),
        migrations.AddIndex(
            model_name='trips',
            index=models.Index(fields=['status'], name='assignment__status_95c40c_idx'),
        ),
        migrations.AddIndex(
            model_name='trips',
            index=models.Index(fields=['assignment', 'status'], name='assignment__assignm_466b3a_idx'),
        ),
        migrations.AddIndex(
            model_name='vehicle_assignment',
            index=models.Index(fields=['driver_status'], name='assignment__driver__87f7b7_idx'),
        ),
        migrations.AddIndex(
            model_name='vehicle_assignment',
            index=models.Index(fields=['driver', 'driver_status'], name='assignment__driver__7213c6_idx'),
        ),
    ]

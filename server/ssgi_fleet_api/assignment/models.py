from django.db import models
from request.models import Vehicle_Request
from users.models import User
from vehicles.models import Vehicle
from django.core.validators import MinValueValidator
# Create your models here.


class Vehicle_Assignment(models.Model):

    class DriverStatus(models.TextChoices):
        PENDING = 'Pending'
        ACCEPTED = 'Accepted'
        DECLINED = 'Declined'

    assignment_id = models.AutoField(primary_key=True)
    request = models.ForeignKey(
        Vehicle_Request,
        on_delete=models.CASCADE,
        related_name='assignments',
        null=False,
        blank=False
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='assignments',
        null=False,
        blank=False
    )
    driver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Role.DRIVER},
        related_name='assigned_to_driver',
        null=False,
        blank=False
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role__in': [User.Role.ADMIN , User.Role.SUPERADMIN]},
        related_name='assigned_by',
        null=False,
        blank=False
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    driver_status = models.CharField(max_length=255 , choices=DriverStatus.choices, default=DriverStatus.PENDING)
    driver_response_time = models.DateTimeField(null=True, blank=True)
    decline_reason = models.TextField(blank=True)
    estimated_distance = models.DecimalField(max_digits=10, decimal_places=2 , null=True, blank=True)
    estimated_duration = models.DurationField(null=True, blank=True)
    note = models.TextField(blank=True)
    
    
    def __str__(self):
        return f"Assignment {self.assignment_id} - {self.request.request_id}"
    
    class Meta:
        ordering = ['-assigned_at']
        verbose_name = 'Vehicle Assignment'
        verbose_name_plural = 'Vehicle Assignments'
    

class Trips(models.Model):
    class TripStatus(models.TextChoices):
        PENDING = "Pending"
        STARTED = 'Started'
        ONPROGRESS = 'Onprogress'
        DECLINED = 'Declined'


    trip_id = models.AutoField(primary_key=True)
    assignemt = models.ForeignKey(
        Vehicle_Assignment,
        on_delete=models.PROTECT,
        related_name='record',
        null=False,
        blank=False
    )
    start_mileage = models.DecimalField(
        max_digits=10,  # e.g., 999999.9 km
        decimal_places=1,
        default=0.0,
        validators=[MinValueValidator(0.0)],
        help_text="Current mileage in km/miles (1 decimal place)")
    end_mileage = models.DecimalField(
        max_digits=10,  # e.g., 999999.9 km
        decimal_places=1,
        default=0.0,
        validators=[MinValueValidator(0.0)],
        help_text="Current mileage in km/miles (1 decimal place)")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True , blank=True)
    status = models.CharField(max_length=50 , choices=TripStatus.choices, default=TripStatus.PENDING)

    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now=True)




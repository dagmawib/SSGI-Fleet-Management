from django.db import models
from django.core.exceptions import ValidationError
from ssgi_fleet_api.request.models import Vehicle_Request
from ssgi_fleet_api.users.models import User
from ssgi_fleet_api.vehicles.models import Vehicle
from django.core.validators import MinValueValidator
from django.utils import timezone
# Create your models here.


class Vehicle_Assignment(models.Model):
    """
    Represents a vehicle assignment to a specific request and driver.
    
    This model tracks the assignment of vehicles to approved requests, including:
    - The vehicle and driver assigned
    - Who made the assignment
    - The current status of the assignment
    - Response times and reasons for decline if applicable
    
    The lifecycle of an assignment is:
    PENDING -> ACCEPTED/DECLINED -> COMPLETED (if accepted)
    """

    class DriverStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending Driver Acceptance'
        ACCEPTED = 'Accepted', 'Accepted by Driver'
        DECLINED = 'Declined', 'Declined by Driver'
        COMPLETED = 'Completed', 'Trip Completed'

    assignment_id = models.AutoField(primary_key=True)
    request = models.ForeignKey(
        Vehicle_Request,
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text="The vehicle request being fulfilled"
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text="The vehicle assigned to this request"
    )
    driver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Role.DRIVER},
        related_name='assigned_to_driver',
        help_text="The driver assigned to this request"
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role__in': [User.Role.ADMIN, User.Role.SUPERADMIN]},
        related_name='assigned_by',
        help_text="Admin who created this assignment"
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this assignment was created"
    )
    driver_status = models.CharField(
        max_length=255,
        choices=DriverStatus.choices,
        default=DriverStatus.PENDING,
        help_text="Current status of the assignment from driver's perspective"
    )
    driver_response_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the driver accepted/declined the assignment"
    )
    decline_reason = models.TextField(
        blank=True,
        help_text="Reason provided by driver if assignment was declined"
    )
    estimated_distance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated trip distance in kilometers"
    )
    estimated_duration = models.DurationField(
        null=True,
        blank=True,
        help_text="Estimated trip duration"
    )
    note = models.TextField(
        blank=True,
        help_text="Additional notes about this assignment"
    )
    
    def clean(self):
        """Validate the assignment data."""
        if self.request.status != Vehicle_Request.Status.APPROVED and not self.pk:
            raise ValidationError("Can only assign vehicles to approved requests")
            
        if self.vehicle.status != Vehicle.Status.AVAILABLE and not self.pk:
            raise ValidationError("Can only assign available vehicles")
            
        if self.driver.role != User.Role.DRIVER:
            raise ValidationError("Can only assign to users with driver role")
            
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Assignment {self.assignment_id} - {self.request.request_id}"
    
    class Meta:
        ordering = ['-assigned_at']
        verbose_name = 'Vehicle Assignment'
        verbose_name_plural = 'Vehicle Assignments'
        indexes = [
            models.Index(fields=['driver_status']),
            models.Index(fields=['driver', 'driver_status'])
        ]

class Trips(models.Model):
    """
    Represents a trip made for an assignment.
    
    This model tracks the actual execution of an assignment, including:
    - Start and end mileage
    - Trip timing
    - Final status
    
    The lifecycle of a trip is:
    STARTED -> COMPLETED/DECLINED
    """

    class TripStatus(models.TextChoices):
        STARTED = 'Started', 'Trip Started'
        DECLINED = 'Declined', 'Trip Declined'
        COMPLETED = 'Completed', 'Trip Completed'

    trip_id = models.AutoField(primary_key=True)
    assignment = models.ForeignKey(
        Vehicle_Assignment,
        on_delete=models.PROTECT,
        related_name='trips',
        help_text="The assignment this trip is for"
    )
    start_mileage = models.DecimalField(
        max_digits=12,
        decimal_places=1,
        validators=[MinValueValidator(0.0)],
        help_text="Starting vehicle mileage in kilometers"
    )
    end_mileage = models.DecimalField(
        max_digits=12,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0)],
        help_text="Ending vehicle mileage in kilometers"
    )
    start_time = models.DateTimeField(
        help_text="When the trip started"
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the trip ended"
    )
    status = models.CharField(
        max_length=50,
        choices=TripStatus.choices,
        default=TripStatus.STARTED,
        help_text="Current status of the trip"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate trip data."""
        if self.end_mileage and self.end_mileage < self.start_mileage:
            raise ValidationError("End mileage must be greater than start mileage")
            
        if self.end_time and self.end_time < self.start_time:
            raise ValidationError("End time must be after start time")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        
    @property
    def distance(self):
        """Calculate the total distance traveled."""
        if self.end_mileage and self.start_mileage:
            return float(self.end_mileage) - float(self.start_mileage)
        return 0.0
        
    @property
    def duration(self):
        """Calculate the trip duration."""
        if self.end_time and self.start_time:
            return self.end_time - self.start_time
        return None

    def __str__(self):
        return f"Trip {self.trip_id} for Assignment {self.assignment_id}"
    
    class Meta:
        verbose_name = 'Trip'
        verbose_name_plural = 'Trips'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['assignment', 'status'])
        ]




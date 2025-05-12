from django.db import models
from ssgi_fleet_api.users.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Vehicle(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        IN_USE = 'in_use', 'In Use'
        MAINTENANCE = 'maintenance', 'In Maintenance'
        OUT_OF_SERVICE = 'out_of_service', 'Out of Service'

    class FuelType(models.TextChoices):
        PETROL = 'petrol', 'Petrol'
        DIESEL = 'diesel', 'Diesel'
        ELECTRIC = 'electric', 'Electric'
        HYBRID = 'hybrid', 'Hybrid'

    class Category(models.TextChoices):
        FIELD = 'field', 'Field Car'
        POOL = 'pool', 'Pool Car'

    category = models.CharField(
        max_length=10,
        choices=Category.choices,
        default=Category.FIELD,
        help_text="Vehicle category (Field or Pool car)"
    )
    license_plate = models.CharField(max_length=20, unique=True)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1900),
            MaxValueValidator(2100)
        ]
    )
    color = models.CharField(max_length=30, blank=True,null=True)
    fuel_type = models.CharField(max_length=10, choices=FuelType.choices)
    fuel_efficiency = models.FloatField(
        validators=[MinValueValidator(0.0)],
        default=0.0,
        help_text="Fuel efficiency in km/l"
    )
    capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        default=5,
        help_text="Passenger capacity of the vehicle"
    )
    current_mileage = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.AVAILABLE)
    assigned_driver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': User.Role.DRIVER},
        related_name='assigned_vehicles'
    )
    department = models.ForeignKey(
        'users.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicles'
    )
    last_service_date = models.DateField(null=True, blank=True)
    next_service_mileage = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.license_plate})"

    class Meta:
        ordering = ['-created_at']

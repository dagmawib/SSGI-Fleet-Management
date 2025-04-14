from django.db import models
from users.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Vehicle_Request(models.Model):

    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending Approval'
        APPROVED = 'Approved', 'Approved by Department'
        REJECTED = 'Rejected', 'Rejected by Department'
        CANCELLED = 'Cancelled', 'Cancelled by Requester'
        COMPLETED = 'Completed', 'Fulfilled Successfully'
    
    
    class Urgency(models.TextChoices):
        REGULAR = 'Regular'
        EMERGENCY = 'Emergency'
        PRIORITY = 'Priority'

    request_id = models.AutoField(primary_key=True)
    requester = models.ForeignKey(User,
            on_delete=models.CASCADE ,
            related_name='requested_by',
            limit_choices_to={'role': User.Role.EMPLOYEE
                              })

    pickup_location = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    purpose = models.CharField(max_length=255)
    urgency = models.CharField(max_length=255,
                              choices=Urgency.choices,  
                              default=Urgency.REGULAR)

    status = models.CharField(max_length=10,
                              choices=Status.choices,
                              default=Status.PENDING)
    
    passenger_count = models.IntegerField(
        validators=[MinValueValidator(1),
        MaxValueValidator(10)])
    
    department_approval = models.BooleanField(default=False)
    department_approver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.Role.DIRECTOR},
        related_name='approved_by',
        null=True,
        blank=True
        )

    department_approval_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cancellation_reason = models.TextField(blank=True)
    
    def __str__(self):
        return f"Request {self.request_id} - {self.requester.username}"
    
    class Meta:
        ordering = ['-created_at' , '-updated_at']
        verbose_name = 'Vehicle Request'
        verbose_name_plural = 'Vehicle Requests'

    def save(self, *args, **kwargs):
        if self.status == self.Status.APPROVED:
            self.department_approval_time = timezone.now()
        super().save(*args, **kwargs)








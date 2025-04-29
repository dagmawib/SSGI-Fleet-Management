from rest_framework import serializers
from vehicles.models import Vehicle
from users.models import User
from django.db.models import Q

class VehicleSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(write_only=True, required=True, help_text="Full name of the driver")
    assigned_driver = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate_driver_name(self, value):
        """
        Validate that the driver exists, is active, and has the driver role
        """
        try:
            # Split the full name into first and last name
            names = value.split()
            if len(names) < 2:
                raise serializers.ValidationError("Please provide both first and last name of the driver")
            
            # Try to find the driver by their full name
            driver = User.objects.filter(
                Q(first_name__iexact=names[0]) & Q(last_name__iexact=' '.join(names[1:])),
                role=User.Role.DRIVER,
                is_active=True
            ).first()

            if not driver:
                raise serializers.ValidationError(
                    "No active driver found with this name. Please ensure the driver exists and is active."
                )
            
            # Store the driver for later use in create/update
            self.context['driver'] = driver
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def create(self, validated_data):
        # Remove driver_name from validated_data as it's not a model field
        driver_name = validated_data.pop('driver_name', None)
        # Get the driver we found during validation
        driver = self.context.get('driver')
        
        # Create the vehicle with the assigned driver
        vehicle = Vehicle.objects.create(
            **validated_data,
            assigned_driver=driver
        )
        return vehicle

    def update(self, instance, validated_data):
        # Remove driver_name from validated_data as it's not a model field
        driver_name = validated_data.pop('driver_name', None)
        # Get the driver we found during validation
        driver = self.context.get('driver')
        
        # Update the vehicle fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update the assigned driver
        instance.assigned_driver = driver
        instance.save()
        
        return instance

    def validate_status(self, value):
        if self.instance and self.instance.status == Vehicle.Status.OUT_OF_SERVICE:
            if value != Vehicle.Status.OUT_OF_SERVICE:
                raise serializers.ValidationError(
                    "Out-of-service vehicles require special reactivation"
                )
        return value
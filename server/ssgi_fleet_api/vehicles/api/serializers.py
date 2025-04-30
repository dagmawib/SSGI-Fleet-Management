from rest_framework import serializers
from vehicles.models import Vehicle
from users.models import User
from django.db.models import Q

class VehicleSerializer(serializers.ModelSerializer):
    driver_id = serializers.IntegerField(write_only=True, required=True, help_text="ID of the driver to assign")
    assigned_driver = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate_driver_id(self, value):
        """
        Validate that the driver exists, is active, and has the driver role by ID
        """
        try:
            driver = User.objects.filter(
                id=value,
                role=User.Role.DRIVER,
                is_active=True
            ).first()
            if not driver:
                raise serializers.ValidationError(
                    "No active driver found with this ID. Please ensure the driver exists and is active."
                )
            self.context['driver'] = driver
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def create(self, validated_data):
        driver_id = validated_data.pop('driver_id', None)
        driver = self.context.get('driver')
        vehicle = Vehicle.objects.create(
            **validated_data,
            assigned_driver=driver
        )
        return vehicle

    def update(self, instance, validated_data):
        driver_id = validated_data.pop('driver_id', None)
        driver = self.context.get('driver')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
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
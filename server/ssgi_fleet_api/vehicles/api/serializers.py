from rest_framework import serializers
from vehicles.models import Vehicle
from users.models import User
from django.db.models import Q

class DriverNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name"]

class VehicleSerializer(serializers.ModelSerializer):
    driver_id = serializers.IntegerField(write_only=True, required=False, help_text="ID of the driver to assign")
    assigned_driver = DriverNameSerializer(read_only=True)

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
                raise serializers.ValidationError({
                    "driver_id": "No active driver found with this ID. Please ensure the driver exists and is active.",
                    "error_code": "driver_not_found"
                })
            self.context['driver'] = driver
            return value
        except Exception as e:
            raise serializers.ValidationError({
                "driver_id": str(e),
                "error_code": "driver_validation_error"
            })

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
        # Enforce one driver per car: unassign driver from any other vehicle
        if driver:
            Vehicle.objects.filter(assigned_driver=driver).exclude(id=instance.id).update(assigned_driver=None)
        instance.assigned_driver = driver
        instance.save()
        return instance

    def validate_status(self, value):
        if self.instance and self.instance.status == Vehicle.Status.OUT_OF_SERVICE:
            if value != Vehicle.Status.OUT_OF_SERVICE:
                raise serializers.ValidationError({
                    "status": "Out-of-service vehicles require special reactivation.",
                    "error_code": "out_of_service_reactivation"
                })
        return value

    def validate_category(self, value):
        """
        Ensure the category is either 'field' or 'pool'.
        For 'pool' cars: Note that all pool cars that have been in use or available within the last 24 hours will be set to available at 8:40 AM automatically.
        """
        if value not in [Vehicle.Category.FIELD, Vehicle.Category.POOL]:
            raise serializers.ValidationError({
                "category": "Category must be either 'field' or 'pool'.",
                "error_code": "invalid_category"
            })
        return value
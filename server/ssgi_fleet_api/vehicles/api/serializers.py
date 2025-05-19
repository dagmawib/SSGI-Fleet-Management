from rest_framework import serializers
from vehicles.models import Vehicle, VehicleDriverAssignmentHistory
from users.models import User
from django.db.models import Q
from django.utils import timezone

class DriverNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name"]

class VehicleDriverAssignmentHistorySerializer(serializers.ModelSerializer):
    driver = DriverNameSerializer(read_only=True)
    class Meta:
        model = VehicleDriverAssignmentHistory
        fields = ["driver", "assigned_at", "unassigned_at"]

    def to_representation(self, instance):
        try:
            return super().to_representation(instance)
        except Exception as e:
            print(f"[VehicleDriverAssignmentHistorySerializer] Error serializing assignment history {getattr(instance, 'id', None)}: {e}")
            return {"error": f"Failed to serialize assignment history: {str(e)}"}

class VehicleSerializer(serializers.ModelSerializer):
    driver_id = serializers.IntegerField(write_only=True, required=False, help_text="ID of the driver to assign")
    assigned_driver = DriverNameSerializer(read_only=True)
    assigned_date = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_assigned_date(self, obj):
        try:
            if obj.assigned_driver:
                assignment = obj.driver_history.filter(driver=obj.assigned_driver, unassigned_at__isnull=True).order_by('-assigned_at').first()
                if assignment:
                    return assignment.assigned_at
            return None
        except Exception as e:
            print(f"[VehicleSerializer] Error in get_assigned_date for vehicle {getattr(obj, 'id', None)}: {e}")
            return None

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
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[VehicleSerializer] Error in validate_driver_id: {e}")
            raise serializers.ValidationError({
                "driver_id": str(e),
                "error_code": "driver_validation_error"
            })

    def create(self, validated_data):
        try:
            driver_id = validated_data.pop('driver_id', None)
            driver = self.context.get('driver')
            vehicle = Vehicle.objects.create(
                **validated_data,
                assigned_driver=driver
            )
            return vehicle
        except Exception as e:
            print(f"[VehicleSerializer] Error in create: {e}")
            raise serializers.ValidationError({"detail": f"Failed to create vehicle: {str(e)}"})

    def update(self, instance, validated_data):
        try:
            driver_id = validated_data.pop('driver_id', None)
            # Only change driver if driver_id is provided
            if driver_id is not None:
                driver = self.context.get('driver')
                # Unassign this driver from any other vehicle
                Vehicle.objects.filter(assigned_driver=driver).exclude(id=instance.id).update(assigned_driver=None)
                # Set unassigned_at for previous assignment of this driver
                VehicleDriverAssignmentHistory.objects.filter(driver=driver, unassigned_at__isnull=True).update(unassigned_at=timezone.now())
                # Set unassigned_at for the current vehicle's previous driver
                if instance.assigned_driver and instance.assigned_driver != driver:
                    VehicleDriverAssignmentHistory.objects.filter(vehicle=instance, driver=instance.assigned_driver, unassigned_at__isnull=True).update(unassigned_at=timezone.now())
                # Assign the driver to this vehicle and create new assignment history
                instance.assigned_driver = driver
                instance.save()
                VehicleDriverAssignmentHistory.objects.create(vehicle=instance, driver=driver)
            # Update other fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        except Exception as e:
            print(f"[VehicleSerializer] Error in update for vehicle {getattr(instance, 'id', None)}: {e}")
            raise serializers.ValidationError({"detail": f"Failed to update vehicle: {str(e)}"})

    def validate_status(self, value):
        try:
            if self.instance and self.instance.status == Vehicle.Status.OUT_OF_SERVICE:
                if value != Vehicle.Status.OUT_OF_SERVICE:
                    raise serializers.ValidationError({
                        "status": "Out-of-service vehicles require special reactivation.",
                        "error_code": "out_of_service_reactivation"
                    })
            return value
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[VehicleSerializer] Error in validate_status: {e}")
            raise serializers.ValidationError({"status": str(e), "error_code": "status_validation_error"})

    def validate_category(self, value):
        """
        Ensure the category is either 'field' or 'pool'.
        For 'pool' cars: Note that all pool cars that have been in use or available within the last 24 hours will be set to available at 8:40 AM automatically.
        """
        try:
            if value not in [Vehicle.Category.FIELD, Vehicle.Category.POOL]:
                raise serializers.ValidationError({
                    "category": "Category must be either 'field' or 'pool'.",
                    "error_code": "invalid_category"
                })
            return value
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[VehicleSerializer] Error in validate_category: {e}")
            raise serializers.ValidationError({"category": str(e), "error_code": "category_validation_error"})
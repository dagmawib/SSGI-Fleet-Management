from rest_framework import serializers
from vehicles.models import Vehicle
from users.models import User

class VehicleSerializer(serializers.ModelSerializer):
    assigned_driver = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.DRIVER),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate_assigned_driver(self, value):
        if value and value.role != User.Role.DRIVER:
            raise serializers.ValidationError("Only drivers can be assigned to vehicles")
        return value

    def validate_status(self, value):
        if self.instance and self.instance.status == Vehicle.Status.OUT_OF_SERVICE:
            if value != Vehicle.Status.OUT_OF_SERVICE:
                raise serializers.ValidationError(
                    "Out-of-service vehicles require special reactivation"
                )
        return value
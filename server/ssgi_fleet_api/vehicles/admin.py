from django.contrib import admin
from django.utils.html import format_html
from .models import Vehicle, VehicleDriverAssignmentHistory

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = (
        'license_plate', 
        'make_model', 
        'status_badge',
        'assigned_driver',
        'last_service',
        'status',
        'category',
    )
    list_filter = ('status', 'make', 'fuel_type', 'department', 'category')
    search_fields = ('license_plate', 'make', 'model')
    list_editable = ('status',)
    readonly_fields = ('created_at', 'updated_at')
    actions = ['mark_as_available', 'flag_for_maintenance']

    def make_model(self, obj):
        return f"{obj.make} {obj.model}"
    make_model.short_description = "Vehicle"

    def status_badge(self, obj):
        colors = {
            'available': '#4CAF50',
            'in_use': '#2196F3',
            'maintenance': '#FF9800',
            'out_of_service': '#F44336'
        }
        return format_html(
            '<span style="color: white; background: {}; padding: 3px 8px; border-radius: 4px">{}</span>',
            colors[obj.status],
            obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def last_service(self, obj):
        return obj.last_service_date or "Never"
    last_service.short_description = "Last Service"

    def mark_as_available(self, request, queryset):
        updated = queryset.update(status='available')
        self.message_user(request, f"{updated} vehicles marked as available")
    mark_as_available.short_description = "Mark as available"

    def flag_for_maintenance(self, request, queryset):
        updated = queryset.update(status='maintenance')
        self.message_user(request, f"{updated} vehicles flagged for maintenance")
    flag_for_maintenance.short_description = "Flag for maintenance"

@admin.register(VehicleDriverAssignmentHistory)
class VehicleDriverAssignmentHistoryAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "driver", "assigned_at", "unassigned_at")
    search_fields = ("vehicle__license_plate", "driver__first_name", "driver__last_name")
    list_filter = ("vehicle", "driver")
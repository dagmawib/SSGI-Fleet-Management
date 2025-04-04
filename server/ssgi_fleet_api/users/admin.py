from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Department
from django.utils.translation import gettext_lazy as _

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'department', 'is_active')
    list_filter = ('role', 'department', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'phone_number')}),
        (_('Permissions'), {
            'fields': ('role', 'department', 'is_active', 'is_staff', 'is_superuser'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Security'), {'fields': ('mfa_secret',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'director_name', 'description_short')
    search_fields = ('name',)

    def director_name(self, obj):
        return obj.director.get_full_name() if obj.director else "-"
    director_name.short_description = _("Director")

    def description_short(self, obj):
        return obj.description[:50] + "..." if obj.description else "-"
    description_short.short_description = _("Description")

admin.site.register(User, CustomUserAdmin)
admin.site.register(Department, DepartmentAdmin)
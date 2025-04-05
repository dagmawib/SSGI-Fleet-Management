from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import User, Department

class UserAdminConfig(UserAdmin):
    list_display = (
        'email', 
        'full_name',
        'role_badge',
        'department_link',
        'is_active_icon',
        'last_login'
    )
    list_display_links = ('email', 'full_name')
    list_filter = (
        'role',
        'department',
        'is_active',
        'is_staff',
        'is_superuser'
    )
    search_fields = (
        'email',
        'first_name',
        'last_name',
        'phone_number'
    )
    ordering = ('-date_joined',)
    readonly_fields = (
        'last_login',
        'date_joined',
        'last_updated',
        'last_password_change'  # Now matches the model field
    )
    actions = ['activate_users', 'deactivate_users']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'phone_number')}),
        (_('Organization'), {'fields': ('role', 'department')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        (_('Security'), {
            'fields': ('mfa_secret', 'last_password_change', 'reset_token', 'reset_token_expires'),
            'classes': ('collapse',)
        }),
        (_('Important Dates'), {
            'fields': ('last_login', 'date_joined', 'last_updated'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'first_name',
                'last_name',
                'role',
                'department',
                'password1',
                'password2',
                'is_active',
                'is_staff'
            )
        }),
    )

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = _('Full Name')

    def role_badge(self, obj):
        colors = {
            User.Role.ADMIN: 'purple',
            User.Role.DIRECTOR: 'orange',
            User.Role.DRIVER: 'blue',
            User.Role.EMPLOYEE: 'green'
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 6px; border-radius: 4px">{}</span>',
            colors.get(obj.role, 'gray'),
            obj.get_role_display()
        )
    role_badge.short_description = _('Role')

    def department_link(self, obj):
        if obj.department:
            return format_html(
                '<a href="/admin/users/department/{}/change/">{}</a>',
                obj.department.id,
                obj.department.name
            )
        return '-'
    department_link.short_description = _('Department')

    def is_active_icon(self, obj):
        return format_html(
            '✓' if obj.is_active else '✗',
        )
    is_active_icon.short_description = _('Active')

    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} users activated")
    activate_users.short_description = _("Activate selected users")

    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} users deactivated")
    deactivate_users.short_description = _("Deactivate selected users")

class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'director_link',
        'member_count',
        'created_at'
    )
    list_filter = ('name',)
    search_fields = ('name', 'description')
    raw_id_fields = ('director',)
    readonly_fields = ('created_at', 'updated_at')

    def director_link(self, obj):
        if obj.director:
            return format_html(
                '<a href="/admin/users/user/{}/change/">{}</a>',
                obj.director.id,
                obj.director.email
            )
        return '-'
    director_link.short_description = _('Director')

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = _('Members')

admin.site.register(User, UserAdminConfig)
admin.site.register(Department, DepartmentAdmin)
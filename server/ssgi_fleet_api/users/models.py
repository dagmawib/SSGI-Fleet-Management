import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier"""

    def create_user(self, email, password=None, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        if not email:
            raise ValidationError(_("The Email field must be set"))

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password) 
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", User.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValidationError(_("Superuser must have is_staff=True"))
        if extra_fields.get("is_superuser") is not True:
            raise ValidationError(_("Superuser must have is_superuser=True"))

        return self.create_user(email, password, **extra_fields)


class Department(models.Model):
    name = models.CharField(_("Department Name"), max_length=100, unique=True)
    description = models.TextField(_("Description"), blank=True)
    director = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="directed_departments",
        verbose_name=_("Director"),
    )
    created_at = models.DateTimeField(
        _("created at"),
        default=timezone.now,
        help_text=_("When the department was created"),
    )
    updated_at = models.DateTimeField(
        _("updated at"),
        auto_now=True,
        help_text=_("When the department was last updated"),
    )

    class Meta:
        verbose_name = _("Department")
        verbose_name_plural = _("Departments")

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPERADMIN = "superadmin", _("Super Administrator")
        EMPLOYEE = "employee", _("Employee")
        DRIVER = "driver", _("Driver")
        ADMIN = "admin", _("Administrator")
        DIRECTOR = "director", _("Director")

    username = models.CharField(_("username"), max_length=150, unique=True, blank=True)

    email = models.EmailField(_("email address"), unique=True)
    phone_number = models.CharField(_("phone number"), max_length=20, blank=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
        verbose_name=_("department"),
    )
    role = models.CharField(
        _("role"), max_length=20, choices=Role.choices, default=Role.EMPLOYEE
    )
    mfa_secret = models.CharField(_("MFA secret key"), max_length=100, blank=True)
    reset_token = models.CharField(
        _("password reset token"), max_length=100, blank=True
    )
    reset_token_expires = models.DateTimeField(
        _("reset token expiry"), null=True, blank=True
    )
    last_password_change = models.DateTimeField(
        _("last password change"), null=True, blank=True
    )
    date_joined = models.DateTimeField(_("date joined"), auto_now_add=True)
    last_updated = models.DateTimeField(_("last updated"), auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def clean(self):
        """Validate model fields before saving"""
        super().clean()

        # needs to be edit 

        # SuperAdmin can optionally have department

        if self.role == self.Role.SUPERADMIN:
            if self.department and self.department.director == self:
                raise ValidationError(_("SuperAdmin cannot be a department director"))


        # Directors must be assigned to a department
        if self.role == self.Role.DIRECTOR and not self.department:
            raise ValidationError(_("Directors must be assigned to a department"))

        # Department directors must have director role
        if (
            self.department
            and self.department.director == self
            and self.role != self.Role.DIRECTOR
        ):
            raise ValidationError(_("Department directors must have the director role"))

    def save(self, *args, **kwargs):
        """Custom save logic - removed username generation"""
        self.email = self.__class__.objects.normalize_email(self.email)
        super().save(*args, **kwargs)



    def send_welcome_email(self, temporary_password=None):
        """Send welcome email with login credentials"""
        subject = _("Welcome to SSGI Fleet Management")
        message_lines = [
            _("Hello {name},").format(name=self.first_name),
            "",
            _("Your account has been created with these details:"),
            _("- Role: {role}").format(role=self.get_role_display()),
            _("- Email: {email}").format(email=self.email),
        ]

        if temporary_password:
            message_lines.extend(
                [
                    "",
                    _("- Temporary password: {password}").format(
                        password=temporary_password
                    ),
                    _("Please change your password after first login."),
                ]
            )

        message_lines.extend(
            [
                "",
                _("You can login at: {url}").format(url=settings.FRONTEND_LOGIN_URL),
                "",
                _("Best regards,"),
                _("The SSGI Team"),
            ]
        )

        send_mail(
            subject=subject,
            message="\n".join(message_lines),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.email],
            fail_silently=False,
        )

    @property
    def is_admin(self):
        """Check if user has admin privileges"""
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_driver(self):
        """Check if user is a driver"""
        return self.role == self.Role.DRIVER

    def get_dashboard_url(self):
        """Get appropriate dashboard URL based on role"""
        base_url = settings.FRONTEND_BASE_URL
        role_paths = {
            self.Role.ADMIN: "/admin",
            self.Role.DIRECTOR: "/director",
            self.Role.DRIVER: "/driver",
            self.Role.EMPLOYEE: "/employee",
        }
        return f"{base_url}{role_paths.get(self.role, '')}"

    def send_password_reset_email(self, uid, token):
        """Send a password reset email with a secure link."""
        subject = _("Password Reset Request")
        reset_link = f"{settings.FRONTEND_RESET_URL}?uid={uid}&token={token}"
        message_lines = [
            _(f"Hello {self.first_name},"),
            "",
            _(f"We received a request to reset your password. If you did not make this request, you can ignore this email."),
            _(f"To reset your password, click the link below or paste it into your browser:"),
            reset_link,
            "",
            _(f"This link will expire in 1 hour for your security."),
            "",
            _(f"If you have any questions, contact support."),
            "",
            _(f"Best regards,"),
            _(f"The SSGI Team"),
        ]
        send_mail(
            subject=subject,
            message="\n".join(message_lines),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.email],
            fail_silently=False,
        )

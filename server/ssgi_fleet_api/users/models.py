from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

# Custom user manager
class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


# Department model
class Department(models.Model):
    name = models.CharField(_("Department Name"), max_length=100, unique=True)
    description = models.TextField(_("Description"), blank=True)
    director = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='directed_departments',
        verbose_name=_("Director")
    )

    class Meta:
        verbose_name = _("Department")
        verbose_name_plural = _("Departments")

    def __str__(self):
        return self.name


# Custom User model
class User(AbstractUser):
    ROLE_CHOICES = (
        ('employee', _('Employee')),
        ('driver', _('Driver')),
        ('admin', _('Administrator')),
        ('director', _('Director')),
    )

    # Remove username (use email instead)
    username = None
    email = models.EmailField(_("Email Address"), unique=True)

    # Additional fields
    phone_number = models.CharField(_("Phone Number"), max_length=20, blank=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Department")
    )
    role = models.CharField(
        _("Role"),
        max_length=20,
        choices=ROLE_CHOICES,
        default='employee'
    )
    mfa_secret = models.CharField(
        _("MFA Secret"),
        max_length=100,
        blank=True
    )
    reset_token = models.CharField(
        _("Password Reset Token"),
        max_length=100,
        blank=True
    )
    reset_token_expires = models.DateTimeField(
        _("Token Expiry"),
        null=True,
        blank=True
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_driver(self):
        return self.role == 'driver'

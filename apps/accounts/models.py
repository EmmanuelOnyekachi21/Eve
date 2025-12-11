from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.gis.db import models as gis_models
import uuid


class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model that extends Django's AbstractUser.
    Uses email as the primary identifier instead of username.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    # username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    username = None

    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

class UserProfile(models.Model):
    """
    Extended user information with location data.
    Links to Django's built-in User model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20)
    home_location = gis_models.PointField(geography=True, null=True, blank=True, 
                                     help_text="User's home address coordinates")
    work_location = gis_models.PointField(geography=True, null=True, blank=True,
                                     help_text="User's work/school coordinates")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.phone}"
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"


class EmergencyContact(models.Model):
    """
    People to alert when user is in danger.
    """
    user_profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='emergency_contacts'
    )
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    relationship = models.CharField(max_length=50, help_text="e.g., Mother, Friend, Spouse")
    priority = models.IntegerField(default=1, help_text="1=first to contact, 2=second, etc.")
    
    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.user_profile.user.get_full_name()}"
    
    class Meta:
        ordering = ['priority']
        verbose_name = "Emergency Contact"
        verbose_name_plural = "Emergency Contacts"

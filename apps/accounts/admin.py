from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, EmergencyContact
from django.contrib.gis.admin import GISModelAdmin


class EmergencyContactInline(admin.TabularInline):
    model = EmergencyContact
    extra = 1
    fields = ('name', 'phone', 'relationship', 'priority')
    ordering = ('priority',)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(GISModelAdmin):
    list_display = ('user', 'phone', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone')
    readonly_fields = ('created_at',)
    inlines = [EmergencyContactInline]


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'relationship', 'priority', 'user_profile')
    search_fields = ('name', 'phone', 'relationship', 'user_profile__user__email')
    ordering = ('priority',)

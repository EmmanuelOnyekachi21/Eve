"""
Management command to create UserProfile for users that don't have one
Useful for admin users created via createsuperuser
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserProfile


class Command(BaseCommand):
    help = 'Create UserProfile for users that don\'t have one'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Checking for users without profiles...')
        
        users_without_profile = []
        for user in User.objects.all():
            try:
                _ = user.profile
            except UserProfile.DoesNotExist:
                users_without_profile.append(user)
        
        if not users_without_profile:
            self.stdout.write(self.style.SUCCESS('✅ All users have profiles!'))
            return
        
        self.stdout.write(f'Found {len(users_without_profile)} user(s) without profiles')
        
        created_count = 0
        for user in users_without_profile:
            profile = UserProfile.objects.create(
                user=user,
                phone='',
                home_location=None,
                work_location=None,
                profile_completed=False
            )
            self.stdout.write(f'  ✅ Created profile for: {user.email}')
            created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Created {created_count} profile(s)'))

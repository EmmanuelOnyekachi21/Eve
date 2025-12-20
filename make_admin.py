import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def make_admin():
    email = 'admin_demo@example.com'
    try:
        user = User.objects.get(email=email)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Successfully made {email} an admin (staff+superuser)")
    except User.DoesNotExist:
        print(f"User {email} not found")

if __name__ == '__main__':
    make_admin()

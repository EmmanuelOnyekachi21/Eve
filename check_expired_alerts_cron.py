#!/usr/bin/env python
"""
Cron job to check for expired alerts
Run this every minute via crontab:
* * * * * /path/to/python /path/to/check_expired_alerts_cron.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.admin_alert_service import AdminAlertService

if __name__ == '__main__':
    print("🔍 Checking for expired alerts...")
    count = AdminAlertService.check_expired_alerts()
    if count > 0:
        print(f"✅ Logged {count} expired alert(s) to admin dashboard")
    else:
        print("✅ No expired alerts found")

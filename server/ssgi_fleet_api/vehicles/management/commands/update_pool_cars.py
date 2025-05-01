from django.core.management.base import BaseCommand
from django.utils import timezone
from vehicles.models import Vehicle
from datetime import datetime, time, timedelta


class Command(BaseCommand):
    help = 'Updates pool cars to available status at 8:40 AM if they have been in use or available within the last 24 hours.'

    def handle(self, *args, **kwargs):
        current_time = timezone.localtime().time()
        target_time = time(8, 40)  # 8:40 AM

        # Only run if it's 8:40 AM
        if current_time.hour == target_time.hour and current_time.minute == target_time.minute:
            now = timezone.now()
            since = now - timedelta(hours=24)
            # Update all pool cars that are not in maintenance or out of service and have been updated in the last 24 hours
            updated = Vehicle.objects.filter(
                category=Vehicle.Category.POOL,
                updated_at__gte=since
            ).exclude(
                status__in=[Vehicle.Status.MAINTENANCE, Vehicle.Status.OUT_OF_SERVICE]
            ).update(status=Vehicle.Status.AVAILABLE)

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated {updated} pool cars to available status (last 24hr)'
                )
            ) 
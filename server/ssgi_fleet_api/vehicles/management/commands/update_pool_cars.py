from django.core.management.base import BaseCommand
from django.utils import timezone
from vehicles.models import Vehicle
from datetime import datetime, time, timedelta


class Command(BaseCommand):
    help = 'Updates pool cars to available status at 8:40 AM if they have been in use or available within the last 24 hours.'

    def handle(self, *args, **kwargs):
        now = timezone.localtime()  # Uses Django TIME_ZONE
        updated = Vehicle.objects.filter(
            category=Vehicle.Category.POOL,
            status=Vehicle.Status.IN_USE
        ).update(status=Vehicle.Status.AVAILABLE)

        self.stdout.write(
            self.style.SUCCESS(
                f'[{now}] Successfully updated {updated} pool cars from in_use to available.'
            )
        ) 
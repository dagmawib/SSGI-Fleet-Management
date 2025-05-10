from django.core.management.base import BaseCommand
from django.utils import timezone
from vehicles.models import Vehicle
from datetime import datetime, time, timedelta
from vehicles.tasks import update_pool_cars


class Command(BaseCommand):
    help = 'Updates pool cars to available status at 8:40 AM if they have been in use or available within the last 24 hours.'

    def handle(self, *args, **kwargs):
        now = timezone.localtime()  # Uses Django TIME_ZONE
        print(f'[{now}] Starting pool cars update...')
        updated = update_pool_cars()
        self.stdout.write(
            self.style.SUCCESS(
                f'[{now}] Successfully updated {updated} pool cars from in_use to available.'
            )
        )
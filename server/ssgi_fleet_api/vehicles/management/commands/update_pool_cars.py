from django.core.management.base import BaseCommand
from vehicles.models import Vehicle
from datetime import datetime
from vehicles.tasks import update_pool_cars

class Command(BaseCommand):
    help = 'Updates pool cars to available status at 8:40 AM EAT if they have been in use or available within the last 24 hours.'

    def handle(self, *args, **kwargs):
        now = datetime.now()
        updated = update_pool_cars()
        self.stdout.write(
            self.style.SUCCESS(
                f'[{now}] Successfully updated {updated} pool cars from in_use to available.'
            )
        )

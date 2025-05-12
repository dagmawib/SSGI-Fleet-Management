from vehicles.models import Vehicle

def update_pool_cars():
    updated = Vehicle.objects.filter(
        category=Vehicle.Category.POOL,
        status=Vehicle.Status.IN_USE
    ).update(status=Vehicle.Status.AVAILABLE)
    return updated

from django.contrib import admin
from .models import User, Appointment, OpenTimeSlot, ContactMe, Picture

# Register your models here.
admin.site.register(User)
admin.site.register(Appointment)
admin.site.register(OpenTimeSlot)
admin.site.register(ContactMe)
admin.site.register(Picture)

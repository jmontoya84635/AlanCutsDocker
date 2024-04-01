from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import datetime
import pytz


class User(AbstractUser):
    id = models.AutoField(primary_key=True)
    phone = models.CharField(max_length=16, blank=True, null=True)

    def appointment_summary(self):
        user_appointments = self.appointments.all()
        active_appointments = []
        cancelled_appointments = []
        for appointment in user_appointments:
            if not appointment.cancelled and not appointment.expired:
                active_appointments.append(appointment)
            elif not appointment.cancelled:
                cancelled_appointments.append(appointment)
        return {
            "active": len(active_appointments),
            "cancelled": len(cancelled_appointments),
            "all": len(user_appointments),
        }


class OpenTimeSlot(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateField()
    time = models.TimeField()
    expired = models.BooleanField(default=False)

    def check_expired(self):
        naive_datetime = datetime.datetime.combine(self.date, self.time)
        aware_datetime = pytz.timezone('America/Chicago').localize(naive_datetime)
        if timezone.now() > aware_datetime:
            self.expired = True
            self.save()

    def serialize(self):
        return {
            "id": self.id,
            "date": self.date,
            "time": self.time,
            "expired": self.expired,
        }


class ContactMe(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=16, blank=True, null=True)
    message = models.CharField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
        }


class Appointment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="appointments")
    date = models.DateField()
    time = models.TimeField()
    reason = models.CharField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)
    expired = models.BooleanField(default=False)
    cancelled = models.BooleanField(default=False)
    cancelField = models.CharField(max_length=1000, null=True, blank=True)

    def cancel(self, reason):
        replaced_slot = OpenTimeSlot(
            time=self.time,
            date=self.date,
        )
        replaced_slot.save()
        self.cancelField = reason
        self.expired = True
        self.cancelled = True
        self.save()

    def weekday(self):
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return days[self.date.weekday()]

    def check_expired(self):
        naive_datetime = datetime.datetime.combine(self.date, self.time)
        aware_datetime = pytz.timezone('America/Chicago').localize(naive_datetime)
        if timezone.now() > aware_datetime:
            self.expired = True
            self.save()

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "date": self.date,
            "time": self.time,
            "reason": self.reason,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "expired": self.expired
        }


class Picture(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    order = models.IntegerField()
    img = models.ImageField(default='default.jpg', upload_to='pictures/')

    def move_back(self):
        prev_img = Picture.objects.get(order=(self.order - 1))
        prev_img.order = self.order
        prev_img.save()
        self.order = self.order - 1
        self.save()

    def move_forward(self):
        next_img = Picture.objects.get(order=self.order + 1)
        next_img.order = self.order
        next_img.save()
        self.order = self.order + 1
        self.save()

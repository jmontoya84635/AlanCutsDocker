import json
from django.core.files.storage import default_storage
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.contrib import messages
from .models import User, Appointment, OpenTimeSlot, ContactMe, Picture


# API
@login_required
def schedule(request):
    if request.method == "GET":
        start_date = request.GET["start"]
        end_date = request.GET["end"]
        check_expired = request.GET["expiry"]
        if (not start_date) or (not end_date):
            return JsonResponse({"error": "no dates supplied"}, status=400)
        appointments = Appointment.objects.filter(date__range=[start_date, end_date])
        time_slots = OpenTimeSlot.objects.filter(date__range=[start_date, end_date])
        if check_expired == "yes":
            for appointment in appointments:
                appointment.check_expired()
                if appointment.expired:
                    appointments.exclude(id=appointment.id)
            for time_slot in time_slots:
                time_slot.check_expired()
                if time_slot.expired:
                    time_slots.exclude(id=time_slot.id)
        appointments = [appointment.serialize() for appointment in appointments]
        time_slots = [time_slot.serialize() for time_slot in time_slots]
        return JsonResponse({"appointments": appointments, "time slots": time_slots}, status=200)
    if request.method == "POST":
        date = request.POST["date"]
        time = request.POST["time"]
        description = request.POST["description"]
        open_slot = OpenTimeSlot.objects.get(date=date, time=time)
        open_slot.delete()
        appointment = Appointment(
            user=request.user,
            date=date,
            time=time,
            reason=description
        )
        # noinspection PyBroadException
        try:
            appointment.save()
        except:
            messages.error(request, "Could not create Appointment", "danger")
        else:
            messages.success(request, "Created New Appointment!")
        return HttpResponseRedirect(reverse('appointment'))


@require_http_methods("POST")
def delete_message(request):
    data = json.loads(request.body)
    message = ContactMe.objects.get(id=data["id"])
    try:
        message.delete()
    except Exception as e:
        return JsonResponse({"error": e}, status=500)
    finally:
        return JsonResponse({"message": "success"}, status=200)


@require_http_methods("POST")
def leave_message(request):
    message = ContactMe(
        name=request.POST["name"],
        email=request.POST["email"],
        phone=request.POST["phone"],
        message=request.POST["message"]
    )
    message.save()
    messages.success(request, "Created a message!")
    return HttpResponseRedirect(reverse('index'))


@require_http_methods("POST")
def create_slot(request):
    if not request.user.is_superuser:
        return JsonResponse({"error": "You are not an Admin"}, status=400)
    data = json.loads(request.body)
    slot_list = data["slot_list"]
    start = data["start"]
    end = data["end"]
    time_slots = OpenTimeSlot.objects.filter(date__range=[start, end])
    time_slots.delete()
    for slot in slot_list:
        date, time = slot.split(', ')
        new_slot = OpenTimeSlot(date=date, time=time)
        new_slot.save()
    return JsonResponse({"message": "Saved!", "tag": "success"}, status=200)


@login_required
@require_http_methods("POST")
def edit_appointment(request):
    data = json.loads(request.body)
    action = data["action"]
    appointment_id = data["id"]
    reason = data["reason"]
    appointment = Appointment.objects.get(id=appointment_id)
    if action == "edit":
        appointment.reason = reason
        try:
            appointment.save()
        except Exception as error:
            return JsonResponse({"error": error}, status=500)
        finally:
            return JsonResponse({"message": "success"}, status=200)
    elif action == "cancel":
        try:
            appointment.cancel(reason)
        except Exception as error:
            return JsonResponse({"error": error}, status=500)
        finally:
            return JsonResponse({"message": "success"}, status=200)
    else:
        return JsonResponse({"error": "Bad request"}, status=400)


@login_required
@require_http_methods("POST")
def upload_image(request):
    if not request.user.is_superuser:
        messages.error(request, "Only super users can upload", "danger")
        return HttpResponseRedirect(reverse("index"))
    image_file = request.FILES.get('image')
    order = request.POST.get('order')
    name = request.POST.get('name')
    if image_file:
        picture = Picture(name=name, order=order, img=image_file)
        picture.save()
        return JsonResponse({'message': 'Image uploaded successfully.'}, status=200)
    else:
        return JsonResponse({'error': 'No image file provided.'}, status=400)


@login_required
@require_http_methods("POST")
def move_image(request):
    if not request.user.is_superuser:
        messages.error(request, "Only super users can move images", "danger")
        return HttpResponseRedirect(reverse("index"))
    data = json.loads(request.body)
    picture = Picture.objects.get(id=data["id"])
    if data["direction"] == "UP":
        picture.move_back()
    elif data["direction"] == "DOWN":
        picture.move_forward()
    return JsonResponse({"message": "success"}, status=200)


@login_required
@require_http_methods("POST")
def delete_image(request):
    if not request.user.is_superuser:
        messages.error(request, "Only super users can delete images", "danger")
        return HttpResponseRedirect(reverse("index"))
    data = json.loads(request.body)
    picture = Picture.objects.get(id=data["id"])
    picture.delete()
    return JsonResponse({"message": "success"}, status=200)


# Create your views here.
def index_view(request):
    pictures = Picture.objects.all().order_by("order")
    return render(request, "frontend/index.html", {
        "pictures": pictures,
    })


@login_required
def admin_panel_view(request):
    if not request.user.is_superuser:
        messages.error(request, "LOG IN AS ADMIN!", "danger")
        return HttpResponseRedirect(reverse('index'))

    all_appointments = Appointment.objects.filter(expired=False, cancelled=False)
    for apt in all_appointments:
        apt.check_expired()
    all_appointments = all_appointments.filter(expired=False, cancelled=False).order_by("date", "time").all()
    all_messages = ContactMe.objects.all().order_by("-timestamp").all()
    all_users = User.objects.filter(is_superuser=False).order_by("username").all()

    all_pictures = Picture.objects.all().order_by("order")

    return render(request, "frontend/admin.html", {
        "appointments": all_appointments,
        "all_messages": all_messages,
        "all_users": all_users,
        "all_pictures": all_pictures,
    })


def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        # Check if authentication successful
        if user is not None:
            login(request, user)
            messages.success(request, "Logged in successfully", extra_tags='success')
            return HttpResponseRedirect(reverse("index"))
        else:
            messages.error(request, "Invalid username and/or password.", extra_tags='danger')
            return render(request, "frontend/login.html")
    else:
        return render(request, "frontend/login.html")


@login_required
def logout_view(request):
    logout(request)
    messages.success(request, "Logged out successfully", extra_tags='success')
    return HttpResponseRedirect(reverse("index"))


def signup_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        phone = request.POST["phone"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            messages.error(request, "Passwords must match.", extra_tags='danger')
            return render(request, "frontend/signup.html")
        try:
            user = User.objects.create_user(username, email, password)
            user.phone = phone
            user.save()
        except IntegrityError:
            messages.error(request, "Username already taken.", extra_tags='danger')
            return render(request, "frontend/signup.html")
        login(request, user)
        messages.success(request, "Account created successfully", extra_tags='success')
        return HttpResponseRedirect(reverse("index"))

    else:
        return render(request, "frontend/signup.html")


@login_required
def appointment_view(request):
    return render(request, "frontend/appointment.html")


@login_required
def profile_view(request):
    appointments = Appointment.objects.filter(user=request.user)
    appointments = appointments.order_by("-timestamp").all()
    active_appointments = []
    cancelled_appointments = []
    past_appointments = []
    for appointment in appointments:
        appointment.check_expired()
        if appointment.expired:
            past_appointments.append(appointment)
        else:
            active_appointments.append(appointment)
        if appointment.cancelled:
            cancelled_appointments.append(appointment)

    return render(request, "frontend/profile.html", {
        "all_appointments": appointments,
        "active_appointments": active_appointments,
        "cancelled_appointments": cancelled_appointments,
        "past_appointments": past_appointments,
    })

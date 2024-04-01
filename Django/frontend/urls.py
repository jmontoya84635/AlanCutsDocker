from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", views.index_view, name="index"),
    path("login", views.login_view, name="login"),
    path("signup", views.signup_view, name="signup"),
    path("appointment", views.appointment_view, name="appointment"),
    path("logout", views.logout_view, name="logout"),
    path("profile", views.profile_view, name="profile"),
    path("adminPanel", views.admin_panel_view, name="admin_panel"),

    # API
    path("schedule", views.schedule, name="schedule"),
    path("slot", views.create_slot, name="slot"),
    path("edit", views.edit_appointment, name="edit_appointment"),
    path("message", views.leave_message, name="leave_message"),
    path("delmessage", views.delete_message, name="delete_message"),
    path("upload", views.upload_image, name="upload_image"),
    path("move", views.move_image, name="move_image"),
    path("deletepicture", views.delete_image, name="delete_image"),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

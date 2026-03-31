from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path

from dj_rest_auth.views import LogoutView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.permissions import AllowAny


class UnauthenticatedLogoutView(LogoutView):
    """Allow logout even when the access token is expired.

    The default LogoutView requires a valid access token, which causes a 401
    when the token has expired (common after idle time). Since the server only
    needs to clear the HttpOnly cookie, authentication is not required.
    """

    permission_classes = [AllowAny]


urlpatterns = [
    path("", lambda request: redirect("/api/v1/")),
    path("admin/", admin.site.urls),
    path("api/v1/", include("budget.urls")),
    path("api/v1/", include("wealth.urls")),
    # Override logout to allow unauthenticated requests (expired tokens)
    path(
        "api/v1/auth/logout/", UnauthenticatedLogoutView.as_view(), name="rest_logout"
    ),
    path("api/v1/auth/", include("dj_rest_auth.urls")),
    path("api/v1/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]

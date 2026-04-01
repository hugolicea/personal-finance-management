from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import HeritageViewSet, InvestmentViewSet, RetirementAccountViewSet

router = DefaultRouter()
router.register(r"heritages", HeritageViewSet)
router.register(r"investments", InvestmentViewSet)
router.register(r"retirement-accounts", RetirementAccountViewSet)

urlpatterns = [path("", include(router.urls))]

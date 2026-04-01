from drf_spectacular.utils import extend_schema
from rest_framework import viewsets

from .models import Heritage, Investment, RetirementAccount
from .serializers import (
    HeritageSerializer,
    InvestmentSerializer,
    RetirementAccountSerializer,
)


@extend_schema(tags=["Investments"])
class InvestmentViewSet(viewsets.ModelViewSet):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer
    ordering = ["-purchase_date"]

    def get_queryset(self):
        return (
            Investment.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("-purchase_date")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(tags=["Heritage"])
class HeritageViewSet(viewsets.ModelViewSet):
    queryset = Heritage.objects.all()
    serializer_class = HeritageSerializer
    ordering = ["-purchase_date"]

    def get_queryset(self):
        return (
            Heritage.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("-purchase_date")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RetirementAccountViewSet(viewsets.ModelViewSet):
    queryset = RetirementAccount.objects.all()
    serializer_class = RetirementAccountSerializer
    ordering = ["name"]

    def get_queryset(self):
        return (
            RetirementAccount.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("name")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

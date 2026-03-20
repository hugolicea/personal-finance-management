"""
Custom throttle classes for rate limiting specific endpoints.
"""

from rest_framework.throttling import UserRateThrottle


class UploadRateThrottle(UserRateThrottle):
    """
    Stricter rate limit for file upload endpoints to prevent abuse.
    Limits to 100 uploads per hour per authenticated user.
    """

    scope = "upload"
    rate = "100/hour"


class BulkOperationThrottle(UserRateThrottle):
    """
    Rate limit for bulk operations to prevent system overload.
    Limits to 100 bulk operations per hour per authenticated user.
    """

    scope = "bulk_operation"
    rate = "100/hour"

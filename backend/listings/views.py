from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from django.utils import timezone
from .models import Listing, PreHarvestPlan, FarmExpense, InputCreditRequest
from .serializers import (
    ListingSerializer,
    ListingCreateSerializer,
    PreHarvestPlanSerializer,
    FarmExpenseSerializer,
    InputCreditSerializer,
)


class IsSellerOrReadOnly(permissions.BasePermission):
    """Only verified sellers can create/edit listings. Admins may delete (moderation)."""

    @staticmethod
    def _is_admin_delete(request):
        return (
            request.method == "DELETE"
            and request.user.is_authenticated
            and getattr(request.user, "is_staff_member", False)
        )

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if self._is_admin_delete(request):
            return True
        return (
            request.user.is_authenticated
            and request.user.role == "seller"
            and request.user.is_verified
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if self._is_admin_delete(request):
            return True
        return obj.seller == request.user


from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class ListingViewSet(viewsets.ModelViewSet):
    """
    /api/v1/listings/

    GET    → Public marketplace (Marketplace.tsx)
    POST   → Create listing (ListingForm.tsx — sellers only)
    PATCH  → Update listing (sellers only)
    DELETE → Remove listing (sellers only)
    """
    permission_classes = [IsSellerOrReadOnly]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Respond with the full representation so the UI gets id + absolute thumbnail URL
        full = ListingSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(full.data, status=201)

    def get_queryset(self):
        qs = Listing.objects.filter(is_active=True).select_related("seller")

        # Marketplace filters — matches Marketplace.tsx filter logic
        category = self.request.query_params.get("category")
        district = self.request.query_params.get("district")
        grade = self.request.query_params.get("grade")
        max_price = self.request.query_params.get("max_price")
        search = self.request.query_params.get("q")
        sort = self.request.query_params.get("sort")

        if category and category != "All":
            qs = qs.filter(category=category)
        if district and district != "All":
            qs = qs.filter(district=district)
        if grade and grade != "All":
            qs = qs.filter(grade=grade)
        if max_price:
            try:
                qs = qs.filter(price__lte=int(max_price))
            except (TypeError, ValueError):
                pass
        if search:
            qs = qs.filter(name__icontains=search)

        if sort == "price":
            qs = qs.order_by("price")
        elif sort == "newest":
            qs = qs.order_by("-created_at")
        else:
            qs = qs.order_by("-is_promoted", "-created_at")

        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ListingCreateSerializer
        return ListingSerializer

    def perform_create(self, serializer):
        # District chosen in ListingForm is kept; serializer falls back to the seller's profile district.
        serializer.save(seller=self.request.user)
        self._bust_listing_cache()

    def perform_update(self, serializer):
        serializer.save()
        self._bust_listing_cache()

    def perform_destroy(self, instance):
        instance.delete()
        self._bust_listing_cache()

    @staticmethod
    def _bust_listing_cache():
        from django.core.cache import cache
        cache.clear()  # Simple invalidation — bust all cached pages


class PreHarvestPlanViewSet(viewsets.ModelViewSet):
    """
    /api/v1/listings/plans/

    GET  → Browse pre-harvest plans (PreOrders.tsx)
    POST → Create plan (PlanForm.tsx — sellers only)
    """
    serializer_class = PreHarvestPlanSerializer
    permission_classes = [IsSellerOrReadOnly]

    def get_queryset(self):
        return PreHarvestPlan.objects.filter(is_active=True).select_related("seller")

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=True, methods=["post"])
    def request_advance(self, request, pk=None):
        """Allow verified seller to draw up to 50% of escrowed pre-harvest deposits as an early advance."""
        plan = self.get_object()
        if plan.seller != request.user:
            return Response({"error": "Not your harvest plan."}, status=status.HTTP_403_FORBIDDEN)
        held_deposit = int(plan.reserved * plan.price * (plan.deposit_percentage / 100))
        max_advance = held_deposit // 2
        available = max(0, max_advance - plan.advance_drawn)
        if available <= 0:
            return Response({"error": "No advance available yet."}, status=status.HTTP_400_BAD_REQUEST)
        plan.advance_drawn += available
        plan.save(update_fields=["advance_drawn"])
        from notifications.sms import send_sms
        if request.user.phone:
            send_sms(request.user.phone, f"Harvest advance of UGX {available:,} for {plan.name} sent to Mobile Money.")
        return Response({
            "advance_sent": available,
            "total_advance_drawn": plan.advance_drawn,
            "plan": PreHarvestPlanSerializer(plan).data,
        })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seller_dashboard(request):
    """
    GET /api/v1/listings/seller/dashboard/
    Returns stats for the logged-in seller's dashboard (SellerHome.tsx).
    """
    if request.user.role != "seller":
        return Response({"error": "Seller account required"}, status=403)

    seller = request.user

    # Import here to avoid circular imports
    from orders.models import Order, Rating

    # Active listings
    active_listings = Listing.objects.filter(seller=seller, is_active=True, quantity__gt=0)
    all_listings = Listing.objects.filter(seller=seller, is_active=True)

    # Orders this month
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    orders_this_month = Order.objects.filter(seller=seller, placed_at__gte=month_start)
    pending_orders = Order.objects.filter(
        seller=seller,
        status__in=[Order.Status.PLACED, Order.Status.ACCEPTED, "out_for_delivery"]
    )

    from django.db.models import F

    # Revenue — sum of delivered orders
    delivered_orders = Order.objects.filter(seller=seller, status=Order.Status.DELIVERED)
    gross_agg = delivered_orders.aggregate(
        total=Sum(F("quantity") * F("price_per_unit"))
    )
    gross_amount = gross_agg["total"] or 0

    # Ratings
    rating_stats = Rating.objects.filter(seller=seller).aggregate(
        avg=Avg("stars"),
        count=Count("id")
    )

    return Response({
        "active_listings": active_listings.count(),
        "total_listings": all_listings.count(),
        "orders_this_month": orders_this_month.count(),
        "pending_orders": pending_orders.count(),
        "gross_revenue": gross_amount,
        "avg_rating": round(rating_stats["avg"] or 0, 1),
        "rating_count": rating_stats["count"] or 0,
        "is_verified": seller.is_verified,
        "district": seller.district,
        "seller_type": seller.seller_type,
    })


class FarmExpenseViewSet(viewsets.ModelViewSet):
    """
    /api/v1/listings/expenses/
    Seller farm expense log for profit/loss and credit-ready records.
    """
    serializer_class = FarmExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self.request.user, "role", None) != "seller":
            return FarmExpense.objects.none()
        return FarmExpense.objects.filter(seller=self.request.user)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


def _compute_credit(seller):
    from orders.models import Order, Rating
    score = 0
    if seller.is_verified:
        score += 20
    delivered_count = Order.objects.filter(seller=seller, status=Order.Status.DELIVERED).count()
    score += min(35, delivered_count * 7)
    expense_count = FarmExpense.objects.filter(seller=seller).count()
    score += min(20, expense_count * 4)
    avg_rating = Rating.objects.filter(seller=seller).aggregate(avg=Avg("stars"))["avg"] or 0
    score += min(25, int(avg_rating * 5))
    score = min(100, score)

    credit_limit = score * 10000  # Up to UGX 1,000,000
    used_credit = (
        InputCreditRequest.objects.filter(seller=seller, status__in=["pending", "approved"])
        .aggregate(total=Sum("amount"))["total"] or 0
    )
    available_credit = max(0, credit_limit - used_credit)
    tier = "Gold" if score >= 75 else "Silver" if score >= 45 else "Starter"
    return {
        "credit_score": score,
        "credit_limit": credit_limit,
        "used_credit": used_credit,
        "available_credit": available_credit,
        "credit_tier": tier,
    }


class InputCreditViewSet(viewsets.ModelViewSet):
    """
    /api/v1/listings/credit/
    Farmers request seeds/fertilizer/transport credit up to their on-platform credit limit.
    """
    serializer_class = InputCreditSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        if getattr(self.request.user, "role", None) != "seller":
            return InputCreditRequest.objects.none()
        return InputCreditRequest.objects.filter(seller=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != "seller":
            raise ValidationError({"error": "Seller account required."})
        credit = _compute_credit(self.request.user)
        amount = serializer.validated_data["amount"]
        if amount <= 0 or amount > credit["available_credit"]:
            raise ValidationError({"amount": f"Available credit limit is UGX {credit['available_credit']:,}."})
        req = serializer.save(seller=self.request.user, status=InputCreditRequest.Status.APPROVED)
        from notifications.sms import send_sms
        if self.request.user.phone:
            send_sms(self.request.user.phone, f"Input credit approved: UGX {req.amount:,} for {req.get_item_type_display()}. Auto-deducted from next payout.")


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seller_analytics(request):
    """
    GET /api/v1/listings/seller/analytics/
    Computes realistic profit/loss, per-crop margins, and price-vs-market insights.
    """
    if request.user.role != "seller":
        return Response({"error": "Seller account required"}, status=403)

    from django.db.models import F
    from orders.models import Order
    from market_data.models import ReferencePrice

    seller = request.user
    delivered = Order.objects.filter(seller=seller, status=Order.Status.DELIVERED)
    total_revenue = delivered.aggregate(total=Sum(F("quantity") * F("price_per_unit")))["total"] or 0

    expenses = FarmExpense.objects.filter(seller=seller)
    total_expenses = expenses.aggregate(total=Sum("amount"))["total"] or 0
    net_profit = total_revenue - total_expenses
    margin_pct = round((net_profit / total_revenue) * 100, 1) if total_revenue > 0 else 0

    # Per-crop breakdown
    crop_map = {}
    for row in delivered.values("item_name").annotate(rev=Sum(F("quantity") * F("price_per_unit"))):
        name = row["item_name"]
        crop_map.setdefault(name, {"crop": name, "revenue": 0, "expenses": 0})
        crop_map[name]["revenue"] += row["rev"] or 0

    for exp in expenses.values("crop_name").annotate(cost=Sum("amount")):
        name = exp["crop_name"]
        crop_map.setdefault(name, {"crop": name, "revenue": 0, "expenses": 0})
        crop_map[name]["expenses"] += exp["cost"] or 0

    crops = []
    for item in crop_map.values():
        profit = item["revenue"] - item["expenses"]
        crops.append({**item, "profit": profit})
    crops.sort(key=lambda c: c["profit"], reverse=True)

    # Actionable insights (grounded in seller's own listings & market reference prices)
    insights = []
    ref_prices = {r.name.lower(): r for r in ReferencePrice.objects.all()}
    for listing in Listing.objects.filter(seller=seller, is_active=True)[:10]:
        ref = ref_prices.get(listing.name.lower())
        if ref and ref.price > 0:
            diff_pct = round(((listing.price - ref.price) / ref.price) * 100)
            if diff_pct <= -10:
                insights.append({
                    "type": "price_up",
                    "crop": listing.name,
                    "text": f"{listing.name}: your price ({listing.price:,}) is {abs(diff_pct)}% below market ({ref.price:,}).",
                })
            elif diff_pct >= 15:
                insights.append({
                    "type": "price_high",
                    "crop": listing.name,
                    "text": f"{listing.name}: priced {diff_pct}% above market ({ref.price:,}) — may sell slower.",
                })

    if crops:
        best = crops[0]
        if best["profit"] > 0:
            insights.append({
                "type": "top_crop",
                "crop": best["crop"],
                "text": f"Top earner: {best['crop']} (+UGX {best['profit']:,} net).",
            })
        worst = crops[-1]
        if worst["profit"] < 0:
            insights.append({
                "type": "loss_crop",
                "crop": worst["crop"],
                "text": f"{worst['crop']} is currently at -UGX {abs(worst['profit']):,} net.",
            })

    credit = _compute_credit(seller)
    return Response({
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "margin_pct": margin_pct,
        "crops": crops,
        "insights": insights[:4],
        **credit,
    })

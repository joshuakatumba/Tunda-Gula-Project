"""
payments/reports.py — Admin reporting endpoints (real database data).

GET /api/v1/payments/reports/transactions/        → JSON list (Reports table)
GET /api/v1/payments/reports/transactions.csv     → CSV
GET /api/v1/payments/reports/users.csv            → CSV
GET /api/v1/payments/reports/gmv.csv              → CSV
GET /api/v1/payments/reports/users/               → JSON list (Accounts table)
"""

import csv

from django.db.models import Count, Sum, F
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import User
from .models import Payment, Payout


def _csv_response(filename):
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response.write("\ufeff")  # BOM so Excel opens UTF-8 correctly
    return response


def _transactions():
    """Unified, newest-first list of payments, commissions and payouts."""
    rows = []

    for p in Payment.objects.select_related("order__buyer"):
        buyer = getattr(p.order, "buyer", None)
        rows.append({
            "id": f"PAY-{p.id}",
            "created": p.created_at,
            "user": buyer.name if buyer else "—",
            "type": "Payment",
            "amount": p.amount,
            "status": "Failed" if p.status in ("failed", "refunded") else "Success",
            "raw_status": p.status,
        })

    for po in Payout.objects.select_related("seller"):
        rows.append({
            "id": f"OUT-{po.id}",
            "created": po.created_at,
            "user": po.seller.name,
            "type": "Payout",
            "amount": po.net_amount,
            "status": "Failed" if po.status == "failed" else "Success",
            "raw_status": po.status,
        })
        rows.append({
            "id": f"COM-{po.id}",
            "created": po.created_at,
            "user": "Platform",
            "type": "Commission",
            "amount": po.commission_amount,
            "status": "Failed" if po.status == "failed" else "Success",
            "raw_status": po.status,
        })

    rows.sort(key=lambda r: r["created"], reverse=True)
    return rows


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def transactions_json(request):
    data = [
        {
            "id": r["id"],
            "date": timezone.localtime(r["created"]).strftime("%d %b, %H:%M"),
            "user": r["user"],
            "type": r["type"],
            "amount": r["amount"],
            "status": r["status"],
        }
        for r in _transactions()[:200]
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def transactions_csv(request):
    response = _csv_response(f"transactions-{timezone.now():%Y%m%d}.csv")
    writer = csv.writer(response)
    writer.writerow(["ID", "Date", "User / Entity", "Type", "Amount (UGX)", "Status"])
    for r in _transactions():
        writer.writerow([
            r["id"],
            timezone.localtime(r["created"]).strftime("%Y-%m-%d %H:%M"),
            r["user"], r["type"], r["amount"], r["status"],
        ])
    return response


def _user_rows():
    users = (
        User.objects.exclude(role="admin")
        .annotate(
            buyer_count=Count("buyer_orders", distinct=True),
            seller_count=Count("seller_orders", distinct=True),
        )
        .order_by("-date_joined")
    )
    for u in users:
        yield u, (u.seller_count if u.role == "seller" else u.buyer_count)


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def users_json(request):
    data = []
    for u, orders in _user_rows():
        kind = u.seller_type if u.role == "seller" else u.buyer_type
        label = u.get_role_display() + (f" · {kind.title()}" if kind else "")
        if not u.is_active:
            status = "Suspended"
        elif u.role == "seller" and not u.is_verified:
            status = "Unverified"
        else:
            status = "Verified"
        data.append({
            "id": u.id,
            "name": u.name,
            "type": label,
            "joined": u.date_joined.strftime("%d %b %Y"),
            "status": status,
            "orders": orders,
            "is_active": u.is_active,
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def users_csv(request):
    response = _csv_response(f"user-registrations-{timezone.now():%Y%m%d}.csv")
    writer = csv.writer(response)
    writer.writerow([
        "ID", "Name", "Phone", "Email", "Role", "Type", "District",
        "Verified", "Active", "Orders", "Joined",
    ])
    for u, orders in _user_rows():
        writer.writerow([
            u.id, u.name, u.phone or "", u.email, u.role,
            u.seller_type or u.buyer_type, u.district,
            "yes" if u.is_verified else "no",
            "yes" if u.is_active else "no",
            orders, u.date_joined.strftime("%Y-%m-%d"),
        ])
    return response


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def gmv_csv(request):
    """Daily gross marketplace volume and fee totals."""
    response = _csv_response(f"gmv-summary-{timezone.now():%Y%m%d}.csv")
    writer = csv.writer(response)
    writer.writerow(["Date", "Payments", "Gross volume (UGX)", "Commission (UGX)", "Seller payouts (UGX)"])

    pay = {
        r["day"]: r
        for r in Payment.objects.exclude(status__in=["failed", "pending"])
        .annotate(day=TruncDate("created_at")).values("day")
        .annotate(n=Count("id"), total=Sum("amount"))
    }
    out = {
        r["day"]: r
        for r in Payout.objects.annotate(day=TruncDate("created_at")).values("day")
        .annotate(fee=Sum("commission_amount"), net=Sum("net_amount"))
    }
    total_gmv = total_fee = total_net = 0
    for day in sorted(set(pay) | set(out), reverse=True):
        gmv = (pay.get(day) or {}).get("total") or 0
        fee = (out.get(day) or {}).get("fee") or 0
        net = (out.get(day) or {}).get("net") or 0
        total_gmv += gmv; total_fee += fee; total_net += net
        writer.writerow([day, (pay.get(day) or {}).get("n") or 0, gmv, fee, net])
    writer.writerow(["TOTAL", "", total_gmv, total_fee, total_net])
    return response

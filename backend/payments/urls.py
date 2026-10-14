from django.urls import path
from . import views, reports

app_name = "payments"

urlpatterns = [
    path("initiate/", views.InitiatePaymentView.as_view(), name="initiate"),
    path("webhook/", views.payment_webhook, name="webhook"),
    path("payouts/", views.SellerPayoutsView.as_view(), name="payouts"),
    path("settings/", views.platform_settings, name="settings"),

    # Admin reports
    path("reports/transactions/", reports.transactions_json, name="report-transactions"),
    path("reports/transactions.csv", reports.transactions_csv, name="report-transactions-csv"),
    path("reports/users/", reports.users_json, name="report-users"),
    path("reports/users.csv", reports.users_csv, name="report-users-csv"),
    path("reports/gmv.csv", reports.gmv_csv, name="report-gmv-csv"),
]

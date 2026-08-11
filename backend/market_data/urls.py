from django.urls import path
from . import views

app_name = "market_data"

urlpatterns = [
    path("prices/", views.ReferencePriceListView.as_view(), name="prices"),
    path("categories/", views.CategoryListView.as_view(), name="categories"),
]

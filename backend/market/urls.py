from django.urls import path
from . import views

urlpatterns = [
    # Listings
    path('listings/', views.list_active_listings, name='listings'),
    path('listings/my/', views.my_listings, name='my_listings'),
    path('listings/purchases/', views.my_purchases, name='my_purchases'),
    path('listings/create/', views.create_listing, name='create_listing'),
    path('listings/<int:pk>/', views.get_listing, name='listing_detail'),
    path('listings/<int:pk>/cancel/', views.cancel_listing, name='cancel_listing'),
    path('listings/<int:pk>/update/', views.update_listing, name='update_listing'),
    path('purchase/', views.purchase_listing, name='purchase'),
    path('purchase/batch/', views.purchase_batch, name='purchase_batch'),
    
    # Endereços
    path('addresses/', views.list_addresses, name='list_addresses'),
    path('addresses/create/', views.create_address, name='create_address'),
    path('addresses/<int:pk>/', views.update_address, name='update_address'),
    path('addresses/<int:pk>/delete/', views.delete_address, name='delete_address'),
    path('addresses/<int:pk>/default/', views.set_default_address, name='set_default_address'),
    
    # Checkout e Pedidos (Comprador)
    path('checkout/', views.checkout, name='checkout'),
    path('orders/', views.list_orders, name='list_orders'),
    path('orders/<uuid:pk>/', views.get_order, name='get_order'),
    
    # Vendas (Vendedor)
    path('sales/', views.list_sales, name='list_sales'),
    path('sales/summary/', views.sales_summary, name='sales_summary'),
    path('sales/<int:pk>/', views.get_sale, name='get_sale'),
    path('sales/<int:pk>/ship/', views.mark_shipped, name='mark_shipped'),
    
    # Confirmação de recebimento
    path('orders/items/<int:pk>/received/', views.confirm_received, name='confirm_received'),
]

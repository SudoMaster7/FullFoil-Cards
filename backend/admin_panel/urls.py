from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('dashboard/', views.dashboard_stats, name='admin_dashboard'),
    
    # Usuários
    path('users/', views.list_users, name='admin_users'),
    path('users/<int:user_id>/', views.get_user_detail, name='admin_user_detail'),
    path('users/<int:user_id>/update/', views.update_user, name='admin_user_update'),
    path('users/<int:user_id>/balance/', views.adjust_user_balance, name='admin_user_balance'),
    
    # Saques
    path('withdraws/', views.list_withdraws, name='admin_withdraws'),
    path('withdraws/<uuid:withdraw_id>/approve/', views.approve_withdraw, name='admin_withdraw_approve'),
    path('withdraws/<uuid:withdraw_id>/reject/', views.reject_withdraw, name='admin_withdraw_reject'),
    
    # Listings
    path('listings/', views.list_all_listings, name='admin_listings'),
    path('listings/<int:listing_id>/remove/', views.admin_remove_listing, name='admin_listing_remove'),
    
    # Transações
    path('transactions/', views.list_all_transactions, name='admin_transactions'),
]

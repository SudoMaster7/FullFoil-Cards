from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.get_profile, name='profile'),
    
    # Wallet
    path('wallet/', views.get_wallet, name='wallet'),
    path('wallet/deposit/', views.deposit, name='deposit'),
    path('wallet/withdraw/', views.withdraw, name='withdraw'),
    path('wallet/withdraw/history/', views.get_withdraw_history, name='withdraw_history'),
    path('wallet/transactions/', views.get_transactions, name='transactions'),
    
    # Referral
    path('referral/', views.get_referral_info, name='referral_info'),
]

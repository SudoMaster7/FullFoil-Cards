from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from wallet.models import UserWallet, Transaction, WithdrawRequest, DepositRequest, ReferralCode
from market.models import CardListing


def is_admin(user):
    """Verifica se usuário é admin"""
    return user.is_staff or user.is_superuser


class IsAdminPermission(IsAuthenticated):
    """Custom permission para verificar se é admin"""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and is_admin(request.user)


# ==================== DASHBOARD ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """Estatísticas gerais do dashboard"""
    today = timezone.now().date()
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)
    
    # Usuários
    total_users = User.objects.count()
    new_users_today = User.objects.filter(date_joined__date=today).count()
    new_users_7d = User.objects.filter(date_joined__date__gte=last_7_days).count()
    
    # Transações
    total_transactions = Transaction.objects.count()
    transactions_today = Transaction.objects.filter(created_at__date=today).count()
    
    # Volume financeiro
    total_deposited = UserWallet.objects.aggregate(total=Sum('total_deposited'))['total'] or 0
    total_withdrawn = UserWallet.objects.aggregate(total=Sum('total_withdrawn'))['total'] or 0
    total_balance = UserWallet.objects.aggregate(total=Sum('balance'))['total'] or 0
    
    # Saques pendentes
    pending_withdraws = WithdrawRequest.objects.filter(status='PENDING')
    pending_withdraws_count = pending_withdraws.count()
    pending_withdraws_amount = pending_withdraws.aggregate(total=Sum('amount'))['total'] or 0
    
    # Contagem de saques por status
    approved_withdraws_count = WithdrawRequest.objects.filter(status='APPROVED').count()
    rejected_withdraws_count = WithdrawRequest.objects.filter(status='REJECTED').count()
    
    # Marketplace
    total_listings = CardListing.objects.count()
    active_listings = CardListing.objects.filter(status='ACTIVE').count()
    sold_listings = CardListing.objects.filter(status='SOLD').count()
    total_sales_volume = CardListing.objects.filter(status='SOLD').aggregate(
        total=Sum('price')
    )['total'] or 0
    
    # Referrals
    total_referrals = ReferralCode.objects.aggregate(total=Sum('uses_count'))['total'] or 0
    
    # Gráfico de novos usuários (últimos 7 dias)
    users_chart = User.objects.filter(
        date_joined__date__gte=last_7_days
    ).annotate(
        date=TruncDate('date_joined')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    # Gráfico de transações (últimos 7 dias)
    transactions_chart = Transaction.objects.filter(
        created_at__date__gte=last_7_days
    ).annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        count=Count('id'),
        volume=Sum('amount')
    ).order_by('date')
    
    return Response({
        'users': {
            'total': total_users,
            'today': new_users_today,
            'last_7_days': new_users_7d,
        },
        'transactions': {
            'total': total_transactions,
            'today': transactions_today,
        },
        'financial': {
            'total_deposited': float(total_deposited),
            'total_withdrawn': float(total_withdrawn),
            'total_balance': float(total_balance),
            'pending_withdraws_count': pending_withdraws_count,
            'pending_withdraws_amount': float(pending_withdraws_amount),
        },
        'marketplace': {
            'total_listings': total_listings,
            'active_listings': active_listings,
            'sold_listings': sold_listings,
            'total_sales_volume': float(total_sales_volume),
        },
        'referrals': {
            'total': total_referrals,
        },
        'withdraws': {
            'pending': pending_withdraws_count,
            'approved': approved_withdraws_count,
            'rejected': rejected_withdraws_count,
        },
        'charts': {
            'users': list(users_chart),
            'transactions': [
                {
                    'date': item['date'],
                    'count': item['count'],
                    'volume': float(item['volume']) if item['volume'] else 0
                }
                for item in transactions_chart
            ],
        }
    })


# ==================== USUÁRIOS ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    """Lista todos os usuários"""
    search = request.GET.get('search', '')
    status_filter = request.GET.get('status', '')
    
    users = User.objects.all().select_related('wallet').order_by('-date_joined')
    
    if search:
        users = users.filter(username__icontains=search) | users.filter(email__icontains=search)
    
    if status_filter == 'active':
        users = users.filter(is_active=True)
    elif status_filter == 'inactive':
        users = users.filter(is_active=False)
    elif status_filter == 'staff':
        users = users.filter(is_staff=True)
    
    # Paginação simples
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 20))
    start = (page - 1) * per_page
    end = start + per_page
    
    total = users.count()
    users = users[start:end]
    
    data = []
    for user in users:
        wallet = getattr(user, 'wallet', None)
        referral_code = getattr(user, 'referral_code', None)
        data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'wallet': {
                'balance': float(wallet.balance) if wallet else 0,
                'pending_balance': float(wallet.pending_balance) if wallet else 0,
                'total_deposited': float(wallet.total_deposited) if wallet else 0,
                'total_withdrawn': float(wallet.total_withdrawn) if wallet else 0,
                'is_verified': wallet.is_verified if wallet else False,
            } if wallet else None,
            'referral_code': referral_code.code if referral_code else None,
        })
    
    return Response({
        'users': data,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_user_detail(request, user_id):
    """Detalhes de um usuário específico"""
    try:
        user = User.objects.select_related('wallet', 'referral_code').get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    wallet = user.wallet
    referral_code = getattr(user, 'referral_code', None)
    
    # Transações recentes
    transactions = Transaction.objects.filter(wallet__user=user).order_by('-created_at')[:20]
    
    # Listings
    listings = CardListing.objects.filter(seller=user).order_by('-created_at')[:20]
    
    # Saques
    withdraws = WithdrawRequest.objects.filter(wallet__user=user).order_by('-created_at')[:10]
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
        },
        'wallet': {
            'balance': float(wallet.balance),
            'pending_balance': float(wallet.pending_balance),
            'total_deposited': float(wallet.total_deposited),
            'total_withdrawn': float(wallet.total_withdrawn),
            'is_verified': wallet.is_verified,
        } if wallet else None,
        'referral': {
            'code': referral_code.code,
            'uses_count': referral_code.uses_count,
            'total_earned': float(referral_code.total_earned),
        } if referral_code else None,
        'transactions': [
            {
                'id': str(tx.id),
                'type': tx.transaction_type,
                'amount': float(tx.amount),
                'description': tx.description,
                'status': tx.status,
                'created_at': tx.created_at.isoformat(),
            }
            for tx in transactions
        ],
        'listings': [
            {
                'id': l.id,
                'card_name': l.card_name,
                'price': float(l.price),
                'status': l.status,
                'created_at': l.created_at.isoformat(),
            }
            for l in listings
        ],
        'withdraws': [
            {
                'id': str(w.id),
                'amount': float(w.amount),
                'status': w.status,
                'pix_key_type': w.pix_key_type,
                'pix_key': w.pix_key,
                'created_at': w.created_at.isoformat(),
            }
            for w in withdraws
        ],
    })


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_user(request, user_id):
    """Atualiza dados de um usuário"""
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # Não pode editar superusers a menos que seja superuser
    if user.is_superuser and not request.user.is_superuser:
        return Response({'error': 'Sem permissão para editar este usuário'}, status=status.HTTP_403_FORBIDDEN)
    
    if 'is_active' in request.data:
        user.is_active = request.data['is_active']
    
    if 'is_staff' in request.data and request.user.is_superuser:
        user.is_staff = request.data['is_staff']
    
    if 'is_verified' in request.data:
        user.wallet.is_verified = request.data['is_verified']
        user.wallet.save()
    
    user.save()
    
    return Response({'message': 'Usuário atualizado com sucesso'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def adjust_user_balance(request, user_id):
    """Ajusta saldo de um usuário (add/remove tokens)"""
    try:
        user = User.objects.select_related('wallet').get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    amount = Decimal(str(request.data.get('amount', 0)))
    reason = request.data.get('reason', 'Ajuste administrativo')
    
    if amount == 0:
        return Response({'error': 'Valor não pode ser zero'}, status=status.HTTP_400_BAD_REQUEST)
    
    wallet = user.wallet
    
    if amount > 0:
        wallet.deposit(amount, description=f'[ADMIN] {reason}', bonus=True)
    else:
        if wallet.balance < abs(amount):
            return Response({'error': 'Usuário não tem saldo suficiente'}, status=status.HTTP_400_BAD_REQUEST)
        wallet.balance -= abs(amount)
        wallet.save()
        Transaction.objects.create(
            wallet=wallet,
            transaction_type='WITHDRAW',
            amount=abs(amount),
            description=f'[ADMIN] {reason}',
            status='COMPLETED'
        )
    
    return Response({
        'message': f'Saldo ajustado em {amount} tokens',
        'new_balance': float(wallet.balance)
    })


# ==================== SAQUES ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_withdraws(request):
    """Lista solicitações de saque"""
    status_filter = request.GET.get('status', '')
    
    withdraws = WithdrawRequest.objects.all().select_related('wallet__user').order_by('-created_at')
    
    if status_filter:
        withdraws = withdraws.filter(status=status_filter)
    
    # Paginação
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 20))
    start = (page - 1) * per_page
    end = start + per_page
    
    total = withdraws.count()
    withdraws = withdraws[start:end]
    
    data = [
        {
            'id': str(w.id),
            'user': {
                'id': w.wallet.user.id,
                'username': w.wallet.user.username,
                'email': w.wallet.user.email,
            },
            'amount': float(w.amount),
            'status': w.status,
            'pix_key_type': w.pix_key_type,
            'pix_key': w.pix_key,
            'ip_address': w.ip_address,
            'rejection_reason': w.rejection_reason,
            'created_at': w.created_at.isoformat(),
            'processed_at': w.processed_at.isoformat() if w.processed_at else None,
        }
        for w in withdraws
    ]
    
    return Response({
        'withdraws': data,
        'total': total,
        'page': page,
        'per_page': per_page,
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_withdraw(request, withdraw_id):
    """Aprova um saque"""
    try:
        withdraw = WithdrawRequest.objects.select_related('wallet').get(pk=withdraw_id)
    except WithdrawRequest.DoesNotExist:
        return Response({'error': 'Saque não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    if withdraw.status != 'PENDING':
        return Response({'error': 'Este saque não está pendente'}, status=status.HTTP_400_BAD_REQUEST)
    
    withdraw.status = 'APPROVED'
    withdraw.processed_at = timezone.now()
    withdraw.save()
    
    # Move do pending_balance para withdrawn
    wallet = withdraw.wallet
    wallet.pending_balance -= withdraw.amount
    wallet.total_withdrawn += withdraw.amount
    wallet.save()
    
    # Atualiza transação
    Transaction.objects.filter(
        wallet=wallet,
        amount=withdraw.amount,
        status='PENDING',
        transaction_type='WITHDRAW'
    ).update(status='COMPLETED')
    
    return Response({'message': 'Saque aprovado com sucesso'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_withdraw(request, withdraw_id):
    """Rejeita um saque"""
    try:
        withdraw = WithdrawRequest.objects.select_related('wallet').get(pk=withdraw_id)
    except WithdrawRequest.DoesNotExist:
        return Response({'error': 'Saque não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    if withdraw.status != 'PENDING':
        return Response({'error': 'Este saque não está pendente'}, status=status.HTTP_400_BAD_REQUEST)
    
    reason = request.data.get('reason', 'Rejeitado pelo administrador')
    
    withdraw.status = 'REJECTED'
    withdraw.rejection_reason = reason
    withdraw.processed_at = timezone.now()
    withdraw.save()
    
    # Devolve o valor ao saldo disponível
    wallet = withdraw.wallet
    wallet.pending_balance -= withdraw.amount
    wallet.balance += withdraw.amount
    wallet.save()
    
    # Cancela transação e cria estorno
    Transaction.objects.filter(
        wallet=wallet,
        amount=withdraw.amount,
        status='PENDING',
        transaction_type='WITHDRAW'
    ).update(status='CANCELLED')
    
    Transaction.objects.create(
        wallet=wallet,
        transaction_type='DEPOSIT',
        amount=withdraw.amount,
        description=f'Estorno: Saque rejeitado - {reason}',
        status='COMPLETED'
    )
    
    return Response({'message': 'Saque rejeitado e valor estornado'})


# ==================== LISTINGS ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_all_listings(request):
    """Lista todos os anúncios"""
    status_filter = request.GET.get('status', '')
    search = request.GET.get('search', '')
    
    listings = CardListing.objects.all().select_related('seller').order_by('-created_at')
    
    if status_filter:
        listings = listings.filter(status=status_filter)
    
    if search:
        listings = listings.filter(card_name__icontains=search)
    
    # Paginação
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 20))
    start = (page - 1) * per_page
    end = start + per_page
    
    total = listings.count()
    listings = listings[start:end]
    
    data = [
        {
            'id': l.id,
            'card_name': l.card_name,
            'card_id': l.card_id,
            'price': float(l.price),
            'quantity': l.quantity,
            'condition': l.condition,
            'status': l.status,
            'seller': {
                'id': l.seller.id,
                'username': l.seller.username,
            },
            'buyer': {
                'id': l.buyer.id,
                'username': l.buyer.username,
            } if l.buyer else None,
            'created_at': l.created_at.isoformat(),
            'sold_at': l.sold_at.isoformat() if l.sold_at else None,
        }
        for l in listings
    ]
    
    return Response({
        'listings': data,
        'total': total,
        'page': page,
        'per_page': per_page,
    })


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_remove_listing(request, listing_id):
    """Remove um anúncio (admin)"""
    try:
        listing = CardListing.objects.get(pk=listing_id)
    except CardListing.DoesNotExist:
        return Response({'error': 'Anúncio não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    if listing.status == 'SOLD':
        return Response({'error': 'Não é possível remover anúncios vendidos'}, status=status.HTTP_400_BAD_REQUEST)
    
    listing.status = 'CANCELLED'
    listing.save()
    
    return Response({'message': 'Anúncio removido com sucesso'})


# ==================== TRANSAÇÕES ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_all_transactions(request):
    """Lista todas as transações"""
    tx_type = request.GET.get('type', '')
    
    transactions = Transaction.objects.all().select_related('wallet__user').order_by('-created_at')
    
    if tx_type:
        transactions = transactions.filter(transaction_type=tx_type)
    
    # Paginação
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 50))
    start = (page - 1) * per_page
    end = start + per_page
    
    total = transactions.count()
    transactions = transactions[start:end]
    
    data = [
        {
            'id': str(tx.id),
            'user': {
                'id': tx.wallet.user.id,
                'username': tx.wallet.user.username,
            },
            'type': tx.transaction_type,
            'amount': float(tx.amount),
            'description': tx.description,
            'status': tx.status,
            'ip_address': tx.ip_address,
            'created_at': tx.created_at.isoformat(),
        }
        for tx in transactions
    ]
    
    return Response({
        'transactions': data,
        'total': total,
        'page': page,
        'per_page': per_page,
    })

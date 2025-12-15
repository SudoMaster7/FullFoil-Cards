from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db.models import Sum
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from decimal import Decimal

from .models import (
    UserWallet, Transaction, DepositRequest, WithdrawRequest,
    ReferralCode, Referral, REFERRAL_SETTINGS
)
from .serializers import (
    UserSerializer, RegisterSerializer, WalletSerializer, 
    TransactionSerializer, DepositSerializer, WithdrawSerializer,
    ReferralCodeSerializer, ReferralSerializer
)


def get_client_ip(request):
    """Obtém IP do cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Registrar novo usuário com suporte a código de indicação"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        referral_code = request.data.get('referral_code', '').strip().upper()
        
        with db_transaction.atomic():
            user = serializer.save()
            
            # Processa código de indicação se fornecido
            referral_bonus_msg = ""
            if referral_code:
                try:
                    ref_code = ReferralCode.objects.select_for_update().get(
                        code=referral_code, 
                        is_active=True
                    )
                    # Não pode usar próprio código
                    if ref_code.user != user:
                        # Cria registro de referral
                        Referral.objects.create(
                            referrer=ref_code.user,
                            referred=user,
                            code_used=ref_code,
                            referrer_bonus=REFERRAL_SETTINGS['REFERRER_BONUS'],
                            referred_bonus=REFERRAL_SETTINGS['REFERRED_BONUS'],
                            bonus_paid=True
                        )
                        
                        # Paga bônus ao indicador
                        ref_code.user.wallet.deposit(
                            REFERRAL_SETTINGS['REFERRER_BONUS'],
                            description=f'Bônus de indicação: {user.username} 🎁',
                            bonus=True
                        )
                        ref_code.uses_count += 1
                        ref_code.total_earned += REFERRAL_SETTINGS['REFERRER_BONUS']
                        ref_code.save()
                        
                        # Bônus extra ao indicado
                        user.wallet.deposit(
                            REFERRAL_SETTINGS['REFERRED_BONUS'],
                            description='Bônus por usar código de indicação! 🎁',
                            bonus=True
                        )
                        
                        referral_bonus_msg = f" + {REFERRAL_SETTINGS['REFERRED_BONUS']} de bônus por indicação"
                        
                except ReferralCode.DoesNotExist:
                    pass  # Código inválido, ignora silenciosamente
            
            refresh = RefreshToken.for_user(user)
            wallet = user.wallet
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'message': f'Conta criada! Você recebeu {wallet.balance} tokens de boas-vindas{referral_bonus_msg}! 🎉'
            }, status=status.HTTP_201_CREATED)
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Retorna perfil do usuário logado com dados de referral"""
    user = request.user
    wallet = user.wallet
    referral_code = user.referral_code
    
    return Response({
        'user': UserSerializer(user).data,
        'wallet': WalletSerializer(wallet).data,
        'referral': ReferralCodeSerializer(referral_code).data if referral_code else None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wallet(request):
    """Retorna carteira do usuário com estatísticas"""
    wallet = request.user.wallet
    data = WalletSerializer(wallet).data
    
    # Adiciona estatísticas
    data['stats'] = {
        'total_deposited': float(wallet.total_deposited),
        'total_withdrawn': float(wallet.total_withdrawn),
        'pending_withdraws': WithdrawRequest.objects.filter(
            wallet=wallet, 
            status__in=['PENDING', 'PROCESSING']
        ).aggregate(total=Sum('amount'))['total'] or 0
    }
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit(request):
    """Cria solicitação de depósito (simulação - em produção integrar com gateway)"""
    serializer = DepositSerializer(data=request.data)
    if serializer.is_valid():
        amount = Decimal(str(serializer.validated_data['amount']))
        
        if amount < 10:
            return Response({
                'error': 'Depósito mínimo é de 10 tokens'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        wallet = request.user.wallet
        
        # SIMULAÇÃO: Em produção, criar DepositRequest e integrar com gateway PIX
        # Por agora, credita diretamente para testes
        tx = wallet.deposit(amount, description='Depósito de tokens')
        tx.ip_address = get_client_ip(request)
        tx.save()
        
        return Response({
            'message': f'{amount} tokens depositados com sucesso!',
            'new_balance': float(wallet.balance),
            'transaction_id': str(tx.id)
        })
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw(request):
    """Solicita saque com validações de segurança"""
    serializer = WithdrawSerializer(data=request.data)
    if serializer.is_valid():
        amount = Decimal(str(serializer.validated_data['amount']))
        pix_key = serializer.validated_data['pix_key']
        pix_key_type = serializer.validated_data['pix_key_type']
        
        wallet = request.user.wallet
        
        # Validações de segurança
        min_withdraw = REFERRAL_SETTINGS['MIN_WITHDRAW']
        if amount < min_withdraw:
            return Response({
                'error': f'Saque mínimo é de {min_withdraw} tokens'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not wallet.can_withdraw(amount):
            return Response({
                'error': f'Saldo insuficiente. Disponível: {wallet.balance} tokens'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verifica limite diário
        today = timezone.now().date()
        daily_withdrawn = WithdrawRequest.objects.filter(
            wallet=wallet,
            created_at__date=today,
            status__in=['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        max_daily = REFERRAL_SETTINGS['MAX_WITHDRAW_DAILY']
        if daily_withdrawn + amount > max_daily:
            remaining = max_daily - daily_withdrawn
            return Response({
                'error': f'Limite diário excedido. Disponível hoje: {remaining} tokens'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verifica se não há saques pendentes
        pending = WithdrawRequest.objects.filter(
            wallet=wallet,
            status__in=['PENDING', 'PROCESSING']
        ).exists()
        
        if pending:
            return Response({
                'error': 'Você já tem um saque em processamento. Aguarde a conclusão.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            # Reserva o valor (desconta do saldo)
            wallet.balance -= amount
            wallet.pending_balance += amount
            wallet.save()
            
            # Cria solicitação de saque
            withdraw_request = WithdrawRequest.objects.create(
                wallet=wallet,
                amount=amount,
                pix_key_type=pix_key_type,
                pix_key=pix_key,
                ip_address=get_client_ip(request),
                status='PENDING'
            )
            
            # Registra transação
            Transaction.objects.create(
                wallet=wallet,
                transaction_type='WITHDRAW',
                amount=amount,
                description=f'Saque solicitado - PIX: {pix_key_type}',
                status='PENDING',
                ip_address=get_client_ip(request)
            )
        
        return Response({
            'message': 'Saque solicitado! Será processado em até 24 horas.',
            'withdraw_id': str(withdraw_request.id),
            'amount': float(amount),
            'new_balance': float(wallet.balance)
        })
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    """Retorna histórico de transações paginado"""
    wallet = request.user.wallet
    transactions = wallet.transactions.all()[:50]  # Últimas 50
    return Response(TransactionSerializer(transactions, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_referral_info(request):
    """Retorna informações de referral do usuário"""
    user = request.user
    referral_code = user.referral_code
    
    # Lista de indicados
    referrals = Referral.objects.filter(referrer=user).select_related('referred')
    
    return Response({
        'code': referral_code.code,
        'uses_count': referral_code.uses_count,
        'total_earned': float(referral_code.total_earned),
        'is_active': referral_code.is_active,
        'referrals': [
            {
                'username': r.referred.username,
                'bonus': float(r.referrer_bonus),
                'date': r.created_at.isoformat()
            }
            for r in referrals
        ],
        'settings': {
            'referrer_bonus': float(REFERRAL_SETTINGS['REFERRER_BONUS']),
            'referred_bonus': float(REFERRAL_SETTINGS['REFERRED_BONUS']),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_withdraw_history(request):
    """Histórico de saques do usuário"""
    wallet = request.user.wallet
    withdraws = WithdrawRequest.objects.filter(wallet=wallet).order_by('-created_at')[:20]
    
    return Response([
        {
            'id': str(w.id),
            'amount': float(w.amount),
            'status': w.status,
            'pix_key_type': w.pix_key_type,
            'pix_key': w.pix_key[:3] + '***' + w.pix_key[-3:] if len(w.pix_key) > 6 else '***',
            'rejection_reason': w.rejection_reason if w.status == 'REJECTED' else None,
            'created_at': w.created_at.isoformat(),
            'processed_at': w.processed_at.isoformat() if w.processed_at else None,
        }
        for w in withdraws
    ])


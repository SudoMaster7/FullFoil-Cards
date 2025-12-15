from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal
import uuid
import secrets


class UserWallet(models.Model):
    """Carteira de tokens do usuário"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    pending_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))  # Saldo em processamento
    total_deposited = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_withdrawn = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    is_verified = models.BooleanField(default=False)  # KYC simplificado
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.balance} tokens"

    def can_withdraw(self, amount):
        """Verifica se pode sacar"""
        return self.balance >= Decimal(str(amount)) and amount > 0

    def deposit(self, amount, description='Depósito de tokens', bonus=False):
        """Adiciona tokens à carteira de forma segura"""
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Valor de depósito deve ser positivo")
        
        self.balance += amount
        if not bonus:
            self.total_deposited += amount
        self.save()
        
        tx_type = 'BONUS' if bonus else 'DEPOSIT'
        return Transaction.objects.create(
            wallet=self,
            transaction_type=tx_type,
            amount=amount,
            description=description,
            status='COMPLETED'
        )

    def withdraw(self, amount, description='Saque de tokens'):
        """Remove tokens da carteira de forma segura"""
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Valor de saque deve ser positivo")
        if not self.can_withdraw(amount):
            raise ValueError("Saldo insuficiente")
        
        self.balance -= amount
        self.total_withdrawn += amount
        self.save()
        
        return Transaction.objects.create(
            wallet=self,
            transaction_type='WITHDRAW',
            amount=amount,
            description=description,
            status='COMPLETED'
        )


class Transaction(models.Model):
    """Histórico de transações com auditoria completa"""
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Depósito'),
        ('WITHDRAW', 'Saque'),
        ('PURCHASE', 'Compra'),
        ('SALE', 'Venda'),
        ('BONUS', 'Bônus'),
        ('REFERRAL', 'Indicação'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('PROCESSING', 'Processando'),
        ('COMPLETED', 'Concluído'),
        ('FAILED', 'Falhou'),
        ('CANCELLED', 'Cancelado'),
    ]

    # Usando BigAutoField ao invés de UUID para compatibilidade
    wallet = models.ForeignKey(UserWallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    
    # Referências externas (para pagamentos reais futuros)
    external_id = models.CharField(max_length=255, blank=True, null=True)  # ID do gateway de pagamento
    
    related_listing = models.ForeignKey(
        'market.CardListing', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='transactions'
    )
    
    # Auditoria
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', 'transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} tokens ({self.status})"


class DepositRequest(models.Model):
    """Solicitação de depósito (para integração com gateway)"""
    STATUS_CHOICES = [
        ('PENDING', 'Aguardando Pagamento'),
        ('PAID', 'Pago'),
        ('CONFIRMED', 'Confirmado'),
        ('EXPIRED', 'Expirado'),
        ('CANCELLED', 'Cancelado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(UserWallet, on_delete=models.CASCADE, related_name='deposit_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    
    # Dados do pagamento (PIX, etc)
    payment_method = models.CharField(max_length=50, default='PIX')
    payment_code = models.TextField(blank=True)  # Código PIX copia e cola
    
    expires_at = models.DateTimeField()
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def is_expired(self):
        return timezone.now() > self.expires_at and self.status == 'PENDING'


class WithdrawRequest(models.Model):
    """Solicitação de saque com validações de segurança"""
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('APPROVED', 'Aprovado'),
        ('PROCESSING', 'Processando'),
        ('COMPLETED', 'Concluído'),
        ('REJECTED', 'Rejeitado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(UserWallet, on_delete=models.CASCADE, related_name='withdraw_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    
    # Dados do destinatário (PIX)
    pix_key_type = models.CharField(max_length=20)  # CPF, EMAIL, PHONE, RANDOM
    pix_key = models.CharField(max_length=255)
    
    # Auditoria
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class ReferralCode(models.Model):
    """Código de indicação do usuário"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referral_code')
    code = models.CharField(max_length=12, unique=True)
    uses_count = models.PositiveIntegerField(default=0)
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}: {self.code}"
    
    @classmethod
    def generate_code(cls):
        """Gera código único de 8 caracteres"""
        while True:
            code = secrets.token_urlsafe(6)[:8].upper()
            if not cls.objects.filter(code=code).exists():
                return code


class Referral(models.Model):
    """Registro de indicação"""
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_made')
    referred = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referred_by')
    code_used = models.ForeignKey(ReferralCode, on_delete=models.SET_NULL, null=True)
    
    # Bônus
    referrer_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    referred_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    bonus_paid = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['referrer', 'referred']
    
    def __str__(self):
        return f"{self.referrer.username} -> {self.referred.username}"


# Configurações de referral (pode ser movido para settings ou admin)
REFERRAL_SETTINGS = {
    'WELCOME_BONUS': Decimal('10.00'),      # Bônus para quem se cadastra
    'REFERRER_BONUS': Decimal('15.00'),     # Bônus para quem indica
    'REFERRED_BONUS': Decimal('10.00'),     # Bônus extra para indicado
    'MIN_WITHDRAW': Decimal('50.00'),       # Saque mínimo
    'MAX_WITHDRAW_DAILY': Decimal('1000.00'),  # Limite diário de saque
}


# Signals
@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    """Cria carteira e código de referral quando usuário é criado"""
    if created:
        wallet = UserWallet.objects.create(user=instance)
        ReferralCode.objects.create(
            user=instance,
            code=ReferralCode.generate_code()
        )
        # Bônus de boas-vindas
        wallet.deposit(
            REFERRAL_SETTINGS['WELCOME_BONUS'],
            description='Bônus de boas-vindas! 🎉',
            bonus=True
        )

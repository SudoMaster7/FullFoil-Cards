from django.db import models
from django.contrib.auth.models import User
import uuid


class UserAddress(models.Model):
    """Endereço do usuário para envio"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    
    name = models.CharField(max_length=100, verbose_name="Nome do destinatário")
    cep = models.CharField(max_length=9)
    street = models.CharField(max_length=255, verbose_name="Rua/Logradouro")
    number = models.CharField(max_length=20, verbose_name="Número")
    complement = models.CharField(max_length=100, blank=True, verbose_name="Complemento")
    neighborhood = models.CharField(max_length=100, verbose_name="Bairro")
    city = models.CharField(max_length=100, verbose_name="Cidade")
    state = models.CharField(max_length=2, verbose_name="UF")
    
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name = 'Endereço'
        verbose_name_plural = 'Endereços'

    def __str__(self):
        return f"{self.name} - {self.street}, {self.number} - {self.city}/{self.state}"

    def save(self, *args, **kwargs):
        # Se este endereço é marcado como padrão, remove o padrão dos outros
        if self.is_default:
            UserAddress.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class Order(models.Model):
    """Pedido de compra"""
    STATUS_CHOICES = [
        ('PENDING_PAYMENT', 'Aguardando Pagamento'),
        ('PAID', 'Pago'),
        ('PREPARING', 'Preparando Envio'),
        ('SHIPPED', 'Enviado'),
        ('DELIVERED', 'Entregue'),
        ('RECEIVED', 'Recebido'),
        ('CANCELLED', 'Cancelado'),
        ('DISPUTED', 'Em Disputa'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    
    # Endereço de entrega (cópia para histórico)
    shipping_name = models.CharField(max_length=100)
    shipping_cep = models.CharField(max_length=9)
    shipping_street = models.CharField(max_length=255)
    shipping_number = models.CharField(max_length=20)
    shipping_complement = models.CharField(max_length=100, blank=True)
    shipping_neighborhood = models.CharField(max_length=100)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=2)
    
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_PAYMENT')
    
    tracking_code = models.CharField(max_length=50, blank=True, verbose_name="Código de rastreio")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'

    def __str__(self):
        return f"Pedido {self.id} - {self.buyer.username} - {self.status}"

    @property
    def shipping_address_formatted(self):
        address = f"{self.shipping_street}, {self.shipping_number}"
        if self.shipping_complement:
            address += f" - {self.shipping_complement}"
        address += f"\n{self.shipping_neighborhood}\n{self.shipping_city}/{self.shipping_state}\nCEP: {self.shipping_cep}"
        return address


class OrderItem(models.Model):
    """Item de um pedido"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    listing = models.ForeignKey('CardListing', on_delete=models.SET_NULL, null=True, related_name='order_items')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sold_items')
    
    # Dados da carta (cópia para histórico)
    card_id = models.CharField(max_length=50)
    card_name = models.CharField(max_length=255)
    card_image = models.URLField()
    condition = models.CharField(max_length=20)
    
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status específico deste item (cada vendedor pode ter status diferente)
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('PREPARING', 'Preparando'),
        ('SHIPPED', 'Enviado'),
        ('DELIVERED', 'Entregue'),
        ('RECEIVED', 'Recebido'),
        ('CANCELLED', 'Cancelado'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    tracking_code = models.CharField(max_length=50, blank=True)
    
    shipped_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Item do Pedido'
        verbose_name_plural = 'Itens do Pedido'

    def __str__(self):
        return f"{self.quantity}x {self.card_name} - Pedido {self.order_id}"


class CardListing(models.Model):
    """Anúncio de carta à venda no marketplace"""
    STATUS_CHOICES = [
        ('ACTIVE', 'Ativo'),
        ('SOLD', 'Vendido'),
        ('CANCELLED', 'Cancelado'),
    ]

    CONDITION_CHOICES = [
        ('MINT', 'Mint (Perfeito)'),
        ('NEAR_MINT', 'Near Mint'),
        ('EXCELLENT', 'Excelente'),
        ('GOOD', 'Bom'),
        ('LIGHT_PLAYED', 'Levemente Jogado'),
        ('PLAYED', 'Jogado'),
        ('POOR', 'Ruim'),
    ]

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    buyer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchases')
    
    # Dados da carta (da API YGOProDeck)
    card_id = models.CharField(max_length=50)  # ID da carta na API
    card_name = models.CharField(max_length=255)
    card_image = models.URLField()  # URL da imagem
    card_type = models.CharField(max_length=100, blank=True)
    
    # Dados do anúncio
    price = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='NEAR_MINT')
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sold_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.card_name} - {self.price} tokens ({self.status})"

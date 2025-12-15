from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CardListing, UserAddress, Order, OrderItem


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class CardListingSerializer(serializers.ModelSerializer):
    seller = SellerSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = CardListing
        fields = [
            'id', 'seller', 'card_id', 'card_name', 'card_image', 'card_type',
            'price', 'condition', 'description', 'quantity', 'status',
            'created_at', 'is_owner'
        ]
        read_only_fields = ['id', 'seller', 'status', 'created_at']

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.seller == request.user
        return False


class CreateListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardListing
        fields = [
            'card_id', 'card_name', 'card_image', 'card_type',
            'price', 'condition', 'description', 'quantity'
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('O preço deve ser maior que zero.')
        return value

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('A quantidade deve ser maior que zero.')
        return value

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)


class PurchaseSerializer(serializers.Serializer):
    listing_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


# ==================== ENDEREÇOS ====================

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            'id', 'name', 'cep', 'street', 'number', 'complement',
            'neighborhood', 'city', 'state', 'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_cep(self, value):
        # Remove caracteres não numéricos
        cep = ''.join(filter(str.isdigit, value))
        if len(cep) != 8:
            raise serializers.ValidationError('CEP deve ter 8 dígitos.')
        return f'{cep[:5]}-{cep[5:]}'

    def validate_state(self, value):
        states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
                  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
                  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
        if value.upper() not in states:
            raise serializers.ValidationError('UF inválida.')
        return value.upper()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# ==================== PEDIDOS ====================

class OrderItemSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'seller', 'seller_username', 'card_id', 'card_name', 'card_image',
            'condition', 'quantity', 'unit_price', 'total_price', 'status',
            'tracking_code', 'shipped_at', 'received_at'
        ]
        read_only_fields = ['id', 'seller', 'seller_username']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    shipping_address_formatted = serializers.CharField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'buyer_username', 'shipping_name', 'shipping_cep',
            'shipping_street', 'shipping_number', 'shipping_complement',
            'shipping_neighborhood', 'shipping_city', 'shipping_state',
            'shipping_address_formatted', 'total', 'status', 'tracking_code',
            'created_at', 'paid_at', 'shipped_at', 'delivered_at', 'received_at',
            'items'
        ]
        read_only_fields = ['id', 'buyer', 'buyer_username', 'total', 'created_at']


class CheckoutSerializer(serializers.Serializer):
    """Serializer para processar checkout do carrinho"""
    address_id = serializers.IntegerField()
    # Aceita tanto listing_ids (array simples) quanto items (array de objetos)
    listing_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        min_length=1
    )
    items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        min_length=1
    )

    def validate(self, data):
        # Precisa ter ou listing_ids ou items
        if not data.get('listing_ids') and not data.get('items'):
            raise serializers.ValidationError('Forneça listing_ids ou items.')
        
        # Se veio listing_ids, converte para formato items
        if data.get('listing_ids'):
            data['items'] = [{'listing_id': lid, 'quantity': 1} for lid in data['listing_ids']]
        
        # Valida items
        for item in data.get('items', []):
            if 'listing_id' not in item:
                raise serializers.ValidationError('Cada item deve ter listing_id.')
            if 'quantity' not in item:
                item['quantity'] = 1
            if item['quantity'] < 1:
                raise serializers.ValidationError('Quantidade inválida.')
        
        return data


class SellerOrderItemSerializer(serializers.ModelSerializer):
    """Serializer para vendedor ver seus itens vendidos"""
    buyer_username = serializers.CharField(source='order.buyer.username', read_only=True)
    order_id = serializers.UUIDField(source='order.id', read_only=True)
    shipping_address = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'order_id', 'buyer_username', 'card_id', 'card_name', 'card_image',
            'condition', 'quantity', 'unit_price', 'total_price', 'status',
            'tracking_code', 'shipped_at', 'received_at', 'shipping_address'
        ]

    def get_shipping_address(self, obj):
        order = obj.order
        return {
            'name': order.shipping_name,
            'cep': order.shipping_cep,
            'street': order.shipping_street,
            'number': order.shipping_number,
            'complement': order.shipping_complement,
            'neighborhood': order.shipping_neighborhood,
            'city': order.shipping_city,
            'state': order.shipping_state,
        }

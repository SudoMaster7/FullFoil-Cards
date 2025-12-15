from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db.models import Sum

from .models import CardListing, UserAddress, Order, OrderItem
from .serializers import (
    CardListingSerializer, CreateListingSerializer, PurchaseSerializer,
    UserAddressSerializer, OrderSerializer, CheckoutSerializer, SellerOrderItemSerializer
)
from wallet.models import Transaction


@api_view(['GET'])
@permission_classes([AllowAny])
def list_active_listings(request):
    """Lista todos os anúncios ativos"""
    listings = CardListing.objects.filter(status='ACTIVE').select_related('seller')
    
    # Filtros opcionais
    card_name = request.GET.get('card_name')
    if card_name:
        listings = listings.filter(card_name__icontains=card_name)
    
    min_price = request.GET.get('min_price')
    if min_price:
        listings = listings.filter(price__gte=min_price)
    
    max_price = request.GET.get('max_price')
    if max_price:
        listings = listings.filter(price__lte=max_price)
    
    condition = request.GET.get('condition')
    if condition:
        listings = listings.filter(condition=condition)
    
    serializer = CardListingSerializer(listings, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_listings(request):
    """Lista anúncios do usuário logado"""
    listings = CardListing.objects.filter(seller=request.user).select_related('seller')
    serializer = CardListingSerializer(listings, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_purchases(request):
    """Lista cartas compradas pelo usuário"""
    purchases = CardListing.objects.filter(
        buyer=request.user, 
        status='SOLD'
    ).select_related('seller').order_by('-sold_at')
    serializer = CardListingSerializer(purchases, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_listing(request):
    """Cria um novo anúncio de venda"""
    serializer = CreateListingSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        listing = serializer.save()
        return Response(
            CardListingSerializer(listing, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_listing(request, pk):
    """Detalhes de um anúncio específico"""
    try:
        listing = CardListing.objects.select_related('seller').get(pk=pk)
        serializer = CardListingSerializer(listing, context={'request': request})
        return Response(serializer.data)
    except CardListing.DoesNotExist:
        return Response({'error': 'Anúncio não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_listing(request, pk):
    """Cancela um anúncio (apenas o dono)"""
    try:
        listing = CardListing.objects.get(pk=pk, seller=request.user)
        if listing.status != 'ACTIVE':
            return Response({'error': 'Este anúncio não pode ser cancelado.'}, status=status.HTTP_400_BAD_REQUEST)
        listing.status = 'CANCELLED'
        listing.save()
        return Response({'message': 'Anúncio cancelado com sucesso.'})
    except CardListing.DoesNotExist:
        return Response({'error': 'Anúncio não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_listing(request, pk):
    """Atualiza um anúncio (apenas o dono, apenas se ativo)"""
    try:
        listing = CardListing.objects.get(pk=pk, seller=request.user)
        if listing.status != 'ACTIVE':
            return Response({'error': 'Este anúncio não pode ser editado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Campos editáveis
        if 'price' in request.data:
            price = request.data['price']
            if float(price) <= 0:
                return Response({'error': 'Preço deve ser maior que zero.'}, status=status.HTTP_400_BAD_REQUEST)
            listing.price = price
        
        if 'quantity' in request.data:
            quantity = int(request.data['quantity'])
            if quantity < 1:
                return Response({'error': 'Quantidade mínima é 1.'}, status=status.HTTP_400_BAD_REQUEST)
            listing.quantity = quantity
        
        if 'description' in request.data:
            listing.description = request.data['description']
        
        listing.save()
        return Response(CardListingSerializer(listing, context={'request': request}).data)
    except CardListing.DoesNotExist:
        return Response({'error': 'Anúncio não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_listing(request):
    """Compra uma carta do marketplace"""
    serializer = PurchaseSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    listing_id = serializer.validated_data['listing_id']
    quantity = serializer.validated_data.get('quantity', 1)
    
    try:
        listing = CardListing.objects.select_related('seller').get(pk=listing_id, status='ACTIVE')
    except CardListing.DoesNotExist:
        return Response({'error': 'Anúncio não encontrado ou não disponível.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Validações
    if listing.seller == request.user:
        return Response({'error': 'Você não pode comprar sua própria carta.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if quantity > listing.quantity:
        return Response({'error': f'Quantidade indisponível. Disponível: {listing.quantity}'}, status=status.HTTP_400_BAD_REQUEST)
    
    total_price = listing.price * quantity
    buyer_wallet = request.user.wallet
    
    if buyer_wallet.balance < total_price:
        return Response({
            'error': f'Saldo insuficiente. Necessário: {total_price} tokens. Seu saldo: {buyer_wallet.balance} tokens.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Processar compra com transação atômica
    with db_transaction.atomic():
        seller_wallet = listing.seller.wallet
        
        # Debita do comprador
        buyer_wallet.balance -= total_price
        buyer_wallet.save()
        
        # Credita ao vendedor
        seller_wallet.balance += total_price
        seller_wallet.save()
        
        # Registra transações
        Transaction.objects.create(
            wallet=buyer_wallet,
            transaction_type='PURCHASE',
            amount=total_price,
            description=f'Compra: {listing.card_name}',
            related_listing=listing
        )
        
        Transaction.objects.create(
            wallet=seller_wallet,
            transaction_type='SALE',
            amount=total_price,
            description=f'Venda: {listing.card_name}',
            related_listing=listing
        )
        
        # Atualiza anúncio
        listing.quantity -= quantity
        if listing.quantity <= 0:
            listing.status = 'SOLD'
            listing.buyer = request.user
            listing.sold_at = timezone.now()
        listing.save()
    
    return Response({
        'message': f'Compra realizada com sucesso! {listing.card_name}',
        'new_balance': buyer_wallet.balance,
        'total_paid': total_price
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_batch(request):
    """Compra múltiplas cartas do marketplace (carrinho)"""
    listing_ids = request.data.get('listing_ids', [])
    
    if not listing_ids:
        return Response({'error': 'Nenhum item no carrinho.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Busca todos os listings
    listings = CardListing.objects.select_related('seller').filter(
        pk__in=listing_ids, 
        status='ACTIVE'
    )
    
    if listings.count() != len(listing_ids):
        return Response({'error': 'Alguns itens não estão mais disponíveis.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validações
    buyer_wallet = request.user.wallet
    total_price = sum(listing.price for listing in listings)
    
    # Verifica se não está comprando de si mesmo
    for listing in listings:
        if listing.seller == request.user:
            return Response({
                'error': f'Você não pode comprar sua própria carta: {listing.card_name}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    if buyer_wallet.balance < total_price:
        return Response({
            'error': f'Saldo insuficiente. Necessário: {total_price} tokens. Seu saldo: {buyer_wallet.balance} tokens.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Processar compras em transação atômica
    purchased_cards = []
    with db_transaction.atomic():
        for listing in listings:
            seller_wallet = listing.seller.wallet
            
            # Debita do comprador
            buyer_wallet.balance -= listing.price
            buyer_wallet.save()
            
            # Credita ao vendedor
            seller_wallet.balance += listing.price
            seller_wallet.save()
            
            # Registra transações
            Transaction.objects.create(
                wallet=buyer_wallet,
                transaction_type='PURCHASE',
                amount=listing.price,
                description=f'Compra: {listing.card_name}',
                related_listing=listing
            )
            
            Transaction.objects.create(
                wallet=seller_wallet,
                transaction_type='SALE',
                amount=listing.price,
                description=f'Venda: {listing.card_name}',
                related_listing=listing
            )
            
            # Marca como vendido
            listing.status = 'SOLD'
            listing.buyer = request.user
            listing.sold_at = timezone.now()
            listing.save()
            
            purchased_cards.append(listing.card_name)
    
    return Response({
        'message': f'Compra realizada com sucesso! {len(purchased_cards)} carta(s)',
        'new_balance': float(buyer_wallet.balance),
        'total_paid': float(total_price),
        'cards': purchased_cards
    })


# ==================== ENDEREÇOS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_addresses(request):
    """Lista endereços do usuário"""
    addresses = UserAddress.objects.filter(user=request.user)
    serializer = UserAddressSerializer(addresses, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_address(request):
    """Cria um novo endereço"""
    print(f"=== CREATE ADDRESS ===")
    print(f"User: {request.user}")
    print(f"Data: {request.data}")
    
    serializer = UserAddressSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        address = serializer.save()
        print(f"Address created: {address.id}")
        return Response(UserAddressSerializer(address).data, status=status.HTTP_201_CREATED)
    
    print(f"Validation errors: {serializer.errors}")
    # Formata erros para mensagem mais clara
    error_messages = []
    for field, errors in serializer.errors.items():
        for error in errors:
            error_messages.append(f"{field}: {error}")
    
    return Response({
        'error': '; '.join(error_messages) if error_messages else 'Erro de validação',
        'details': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_address(request, pk):
    """Atualiza um endereço"""
    try:
        address = UserAddress.objects.get(pk=pk, user=request.user)
    except UserAddress.DoesNotExist:
        return Response({'error': 'Endereço não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = UserAddressSerializer(address, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_address(request, pk):
    """Remove um endereço"""
    try:
        address = UserAddress.objects.get(pk=pk, user=request.user)
        address.delete()
        return Response({'message': 'Endereço removido com sucesso.'})
    except UserAddress.DoesNotExist:
        return Response({'error': 'Endereço não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_default_address(request, pk):
    """Define um endereço como padrão"""
    try:
        address = UserAddress.objects.get(pk=pk, user=request.user)
        address.is_default = True
        address.save()  # O save() já remove o padrão dos outros
        return Response({'message': 'Endereço definido como padrão.'})
    except UserAddress.DoesNotExist:
        return Response({'error': 'Endereço não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


# ==================== CHECKOUT E PEDIDOS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    """Processa checkout do carrinho criando um pedido"""
    print(f"=== CHECKOUT ===")
    print(f"User: {request.user}")
    print(f"Data: {request.data}")
    
    serializer = CheckoutSerializer(data=request.data)
    if not serializer.is_valid():
        print(f"Validation errors: {serializer.errors}")
        # Formata erros
        error_messages = []
        for field, errors in serializer.errors.items():
            if isinstance(errors, list):
                for error in errors:
                    error_messages.append(f"{field}: {error}")
            else:
                error_messages.append(f"{field}: {errors}")
        return Response({
            'error': '; '.join(error_messages) if error_messages else 'Erro de validação',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    address_id = serializer.validated_data['address_id']
    items = serializer.validated_data['items']
    
    print(f"Address ID: {address_id}")
    print(f"Items: {items}")
    
    # Busca endereço
    try:
        address = UserAddress.objects.get(pk=address_id, user=request.user)
    except UserAddress.DoesNotExist:
        return Response({'error': 'Endereço não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Busca e valida os listings
    listing_ids = [item['listing_id'] for item in items]
    listings = CardListing.objects.select_related('seller').filter(
        pk__in=listing_ids, 
        status='ACTIVE'
    )
    
    if listings.count() != len(listing_ids):
        return Response({'error': 'Alguns itens não estão mais disponíveis.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mapa de quantidades
    quantity_map = {item['listing_id']: item['quantity'] for item in items}
    
    # Validações
    buyer_wallet = request.user.wallet
    total_price = 0
    
    for listing in listings:
        qty = quantity_map.get(listing.id, 1)
        
        if listing.seller == request.user:
            return Response({
                'error': f'Você não pode comprar sua própria carta: {listing.card_name}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if qty > listing.quantity:
            return Response({
                'error': f'Quantidade indisponível para {listing.card_name}. Disponível: {listing.quantity}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        total_price += listing.price * qty
    
    if buyer_wallet.balance < total_price:
        return Response({
            'error': f'Saldo insuficiente. Necessário: R$ {total_price:.2f}. Seu saldo: R$ {buyer_wallet.balance:.2f}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Processar compra com transação atômica
    with db_transaction.atomic():
        # Cria o pedido
        order = Order.objects.create(
            buyer=request.user,
            shipping_name=address.name,
            shipping_cep=address.cep,
            shipping_street=address.street,
            shipping_number=address.number,
            shipping_complement=address.complement,
            shipping_neighborhood=address.neighborhood,
            shipping_city=address.city,
            shipping_state=address.state,
            total=total_price,
            status='PAID',
            paid_at=timezone.now()
        )
        
        # Cria os itens do pedido e processa pagamentos
        for listing in listings:
            qty = quantity_map.get(listing.id, 1)
            item_total = listing.price * qty
            
            # Cria item do pedido
            OrderItem.objects.create(
                order=order,
                listing=listing,
                seller=listing.seller,
                card_id=listing.card_id,
                card_name=listing.card_name,
                card_image=listing.card_image,
                condition=listing.condition,
                quantity=qty,
                unit_price=listing.price,
                total_price=item_total,
                status='PENDING'
            )
            
            seller_wallet = listing.seller.wallet
            
            # Debita do comprador
            buyer_wallet.balance -= item_total
            buyer_wallet.save()
            
            # Credita ao vendedor
            seller_wallet.balance += item_total
            seller_wallet.save()
            
            # Registra transações
            Transaction.objects.create(
                wallet=buyer_wallet,
                transaction_type='PURCHASE',
                amount=item_total,
                description=f'Compra: {listing.card_name} (Pedido #{str(order.id)[:8]})',
                related_listing=listing
            )
            
            Transaction.objects.create(
                wallet=seller_wallet,
                transaction_type='SALE',
                amount=item_total,
                description=f'Venda: {listing.card_name} (Pedido #{str(order.id)[:8]})',
                related_listing=listing
            )
            
            # Atualiza listing
            listing.quantity -= qty
            if listing.quantity <= 0:
                listing.status = 'SOLD'
                listing.buyer = request.user
                listing.sold_at = timezone.now()
            listing.save()
    
    return Response({
        'message': f'Pedido realizado com sucesso!',
        'order_id': str(order.id),
        'new_balance': float(buyer_wallet.balance),
        'total_paid': float(total_price)
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_orders(request):
    """Lista pedidos do comprador"""
    orders = Order.objects.filter(buyer=request.user).prefetch_related('items')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order(request, pk):
    """Detalhes de um pedido específico"""
    try:
        order = Order.objects.prefetch_related('items').get(pk=pk, buyer=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({'error': 'Pedido não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


# ==================== VENDAS (VENDEDOR) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sales(request):
    """Lista vendas do vendedor (itens vendidos)"""
    sales = OrderItem.objects.filter(
        seller=request.user
    ).select_related('order', 'order__buyer').order_by('-order__created_at')
    
    # Filtro por status
    status_filter = request.GET.get('status')
    if status_filter:
        sales = sales.filter(status=status_filter)
    
    serializer = SellerOrderItemSerializer(sales, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sale(request, pk):
    """Detalhes de uma venda específica"""
    try:
        sale = OrderItem.objects.select_related('order', 'order__buyer').get(pk=pk, seller=request.user)
        serializer = SellerOrderItemSerializer(sale)
        return Response(serializer.data)
    except OrderItem.DoesNotExist:
        return Response({'error': 'Venda não encontrada.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_shipped(request, pk):
    """Vendedor marca item como enviado"""
    try:
        sale = OrderItem.objects.get(pk=pk, seller=request.user)
    except OrderItem.DoesNotExist:
        return Response({'error': 'Venda não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    
    if sale.status != 'PENDING' and sale.status != 'PREPARING':
        return Response({'error': 'Este item não pode ser marcado como enviado.'}, status=status.HTTP_400_BAD_REQUEST)
    
    tracking_code = request.data.get('tracking_code', '')
    
    sale.status = 'SHIPPED'
    sale.tracking_code = tracking_code
    sale.shipped_at = timezone.now()
    sale.save()
    
    # Verifica se todos os itens do pedido foram enviados
    order = sale.order
    all_shipped = not order.items.exclude(status__in=['SHIPPED', 'DELIVERED', 'RECEIVED']).exists()
    if all_shipped:
        order.status = 'SHIPPED'
        order.shipped_at = timezone.now()
        order.save()
    
    return Response({
        'message': 'Item marcado como enviado.',
        'tracking_code': tracking_code
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_received(request, pk):
    """Comprador confirma recebimento do item"""
    try:
        # Busca o item pelo ID e verifica se o usuário é o comprador
        item = OrderItem.objects.select_related('order').get(pk=pk)
        if item.order.buyer != request.user:
            return Response({'error': 'Você não é o comprador deste item.'}, status=status.HTTP_403_FORBIDDEN)
    except OrderItem.DoesNotExist:
        return Response({'error': 'Item não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    
    if item.status not in ['SHIPPED', 'DELIVERED']:
        return Response({'error': 'Este item ainda não foi enviado.'}, status=status.HTTP_400_BAD_REQUEST)
    
    item.status = 'RECEIVED'
    item.received_at = timezone.now()
    item.save()
    
    # Verifica se todos os itens do pedido foram recebidos
    order = item.order
    all_received = not order.items.exclude(status='RECEIVED').exists()
    if all_received:
        order.status = 'RECEIVED'
        order.received_at = timezone.now()
        order.save()
    
    return Response({'message': 'Recebimento confirmado com sucesso!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_summary(request):
    """Resumo de vendas do vendedor"""
    sales = OrderItem.objects.filter(seller=request.user)
    
    pending = sales.filter(status='PENDING').count()
    shipped = sales.filter(status='SHIPPED').count()
    received = sales.filter(status='RECEIVED').count()
    total_amount = sales.filter(status='RECEIVED').aggregate(total=Sum('total_price'))['total'] or 0
    
    return Response({
        'pending': pending,
        'shipped': shipped,
        'received': received,
        'total_sales': sales.count(),
        'total_amount': float(total_amount)
    })

import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.http import HttpResponse

YGOPRODECK_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
YGOPRODECK_IMAGE_URL = 'https://images.ygoprodeck.com/images/cards'


@api_view(['GET'])
def search_cards(request):
    """
    Proxy para a API do YGOProDeck.
    Parâmetros aceitos:
    - fname: Nome da carta (busca fuzzy)
    - name: Nome exato da carta
    - id: ID da carta
    - type: Tipo da carta
    - attribute: Atributo (DARK, LIGHT, etc.)
    - race: Raça/Tipo do monstro
    - archetype: Arquétipo
    - num: Limite de resultados
    - offset: Offset para paginação
    """
    params = {}
    
    # Parâmetros de busca
    if request.GET.get('fname'):
        params['fname'] = request.GET.get('fname')
    if request.GET.get('name'):
        params['name'] = request.GET.get('name')
    if request.GET.get('id'):
        params['id'] = request.GET.get('id')
    if request.GET.get('type'):
        params['type'] = request.GET.get('type')
    if request.GET.get('attribute'):
        params['attribute'] = request.GET.get('attribute')
    if request.GET.get('race'):
        params['race'] = request.GET.get('race')
    if request.GET.get('archetype'):
        params['archetype'] = request.GET.get('archetype')
    
    # Se não há parâmetros, retorna erro
    if not params:
        return Response(
            {'error': 'Informe pelo menos um parâmetro de busca (fname, name, id, type, etc.)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Tenta buscar do cache primeiro
    cache_key = f"ygo_search_{hash(frozenset(params.items()))}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data)
    
    try:
        response = requests.get(YGOPRODECK_API_URL, params=params, timeout=10)
        
        if response.status_code == 400:
            return Response({'data': [], 'message': 'Nenhuma carta encontrada.'}, status=status.HTTP_200_OK)
        
        response.raise_for_status()
        data = response.json()
        
        # Cacheia por 1 hora
        cache.set(cache_key, data, 3600)
        
        return Response(data)
        
    except requests.exceptions.Timeout:
        return Response(
            {'error': 'Timeout ao conectar com a API externa.'},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'Erro ao buscar cartas: {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY
        )


@api_view(['GET'])
def get_card_by_id(request, card_id):
    """
    Busca uma carta específica pelo ID.
    """
    cache_key = f"ygo_card_{card_id}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data)
    
    try:
        response = requests.get(YGOPRODECK_API_URL, params={'id': card_id}, timeout=10)
        
        if response.status_code == 400:
            return Response({'error': 'Carta não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        
        response.raise_for_status()
        data = response.json()
        
        # Cacheia por 24 horas (dados de carta não mudam com frequência)
        cache.set(cache_key, data, 86400)
        
        return Response(data)
        
    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'Erro ao buscar carta: {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY
        )


@api_view(['GET'])
def get_all_archetypes(request):
    """
    Retorna todos os arquétipos disponíveis.
    """
    cache_key = "ygo_archetypes"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data)
    
    try:
        response = requests.get('https://db.ygoprodeck.com/api/v7/archetypes.php', timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Cacheia por 24 horas
        cache.set(cache_key, data, 86400)
        
        return Response(data)
        
    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'Erro ao buscar arquétipos: {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY
        )


@api_view(['GET'])
def proxy_card_image(request, card_id):
    """
    Proxy para imagens de cartas do YGOProDeck.
    Resolve problemas de CORS ao carregar imagens no Three.js.
    """
    # Verifica se já está em cache
    cache_key = f"ygo_image_{card_id}"
    cached_image = cache.get(cache_key)
    
    if cached_image:
        response = HttpResponse(cached_image['data'], content_type=cached_image['content_type'])
        response['Access-Control-Allow-Origin'] = '*'
        return response
    
    # Tenta diferentes formatos de imagem
    image_urls = [
        f"{YGOPRODECK_IMAGE_URL}/{card_id}.jpg",
        f"{YGOPRODECK_IMAGE_URL}_small/{card_id}.jpg",
    ]
    
    for image_url in image_urls:
        try:
            img_response = requests.get(image_url, timeout=15)
            if img_response.status_code == 200:
                content_type = img_response.headers.get('Content-Type', 'image/jpeg')
                
                # Cacheia a imagem por 7 dias
                cache.set(cache_key, {
                    'data': img_response.content,
                    'content_type': content_type
                }, 604800)
                
                response = HttpResponse(img_response.content, content_type=content_type)
                response['Access-Control-Allow-Origin'] = '*'
                response['Cache-Control'] = 'public, max-age=604800'
                return response
                
        except requests.exceptions.RequestException:
            continue
    
    return Response({'error': 'Imagem não encontrada'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def proxy_card_back_image(request):
    """
    Proxy para a imagem do verso da carta.
    """
    cache_key = "ygo_card_back"
    cached_image = cache.get(cache_key)
    
    if cached_image:
        response = HttpResponse(cached_image['data'], content_type=cached_image['content_type'])
        response['Access-Control-Allow-Origin'] = '*'
        return response
    
    try:
        img_response = requests.get('https://images.ygoprodeck.com/images/cards/back_high.jpg', timeout=15)
        if img_response.status_code == 200:
            content_type = img_response.headers.get('Content-Type', 'image/jpeg')
            
            cache.set(cache_key, {
                'data': img_response.content,
                'content_type': content_type
            }, 604800)
            
            response = HttpResponse(img_response.content, content_type=content_type)
            response['Access-Control-Allow-Origin'] = '*'
            response['Cache-Control'] = 'public, max-age=604800'
            return response
            
    except requests.exceptions.RequestException as e:
        pass
    
    return Response({'error': 'Imagem não encontrada'}, status=status.HTTP_404_NOT_FOUND)

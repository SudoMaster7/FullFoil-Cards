from django.urls import path
from . import views

urlpatterns = [
    path('cards/', views.search_cards, name='search-cards'),
    path('cards/<int:card_id>/', views.get_card_by_id, name='get-card'),
    path('archetypes/', views.get_all_archetypes, name='get-archetypes'),
    # Proxy de imagens (resolve CORS)
    path('images/<int:card_id>/', views.proxy_card_image, name='proxy-card-image'),
    path('images/back/', views.proxy_card_back_image, name='proxy-card-back'),
]

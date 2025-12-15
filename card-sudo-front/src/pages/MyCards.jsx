import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Package, LogIn, Eye, Tag, Calendar, User } from 'lucide-react';
import { getMyPurchases, CONDITIONS } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';

const MyCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyCards();
    }
  }, [isAuthenticated]);

  const fetchMyCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPurchases();
      setCards(data);
    } catch (err) {
      console.error('Erro ao buscar cartas:', err);
      setError('Não foi possível carregar suas cartas.');
    } finally {
      setLoading(false);
    }
  };

  const getConditionLabel = (value) => {
    return CONDITIONS.find(c => c.value === value)?.label || value;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="py-6 flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mb-4" />
        <h2 className="text-lg sm:text-xl font-bold mb-2">Faça login para ver suas cartas</h2>
        <p className="text-gray-500 text-sm mb-6">
          Veja sua coleção de cartas compradas.
        </p>
        <Link
          to="/login"
          className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Entrar
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Carregando suas cartas...</p>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 pb-24">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold">Minhas Cartas</h1>
        <span className="ml-auto text-xs sm:text-sm text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
          {cards.length} {cards.length === 1 ? 'carta' : 'cartas'}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button 
            onClick={fetchMyCards}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {cards.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-gray-400 text-center">
          <Package className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-medium mb-2">Nenhuma carta ainda</p>
          <p className="text-sm text-gray-500 mb-4">Compre cartas no marketplace para vê-las aqui!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm text-white"
          >
            Ir para o Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => (
            <div 
              key={card.id}
              className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden group hover:border-primary/50 transition-colors"
            >
              {/* Card Image */}
              <div className="relative aspect-[3/4] bg-gray-800">
                {card.card_image ? (
                  <img 
                    src={card.card_image} 
                    alt={card.card_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Package className="w-10 h-10" />
                  </div>
                )}
                
                {/* Condition Badge */}
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] sm:text-xs text-white">
                  {getConditionLabel(card.condition).split(' ')[0]}
                </div>
              </div>

              {/* Card Info */}
              <div className="p-2 sm:p-3">
                <h3 className="font-semibold text-xs sm:text-sm truncate mb-1" title={card.card_name}>
                  {card.card_name}
                </h3>
                
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(card.sold_at)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-primary font-bold">
                    🪙 {Number(card.price).toFixed(2)}
                  </span>
                  
                  <button
                    onClick={() => navigate('/card3d', { state: { card: {
                      id: card.card_id,
                      name: card.card_name,
                      type: card.card_type,
                      card_images: [{ image_url: card.card_image }]
                    }}})}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Ver em 3D"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Seller Info */}
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span className="truncate">de {card.seller?.username || 'Vendedor'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCards;

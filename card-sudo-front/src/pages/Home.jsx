import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Loader2, AlertCircle, Check, Eye, Plus, Store, LogIn } from 'lucide-react';
import { getListings, CONDITIONS } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, wallet } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getListings();
      setListings(data);
    } catch (err) {
      console.error('Erro ao buscar anúncios:', err);
      setError('Não foi possível carregar o marketplace.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (listing) => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar ao carrinho', 'Autenticação necessária');
      navigate('/login');
      return;
    }

    // Verifica se já está no carrinho
    const isInCart = cartItems.some(item => item.id === listing.id);
    if (isInCart) {
      toast.info('Este item já está no carrinho', 'Item no carrinho');
      navigate('/cart');
      return;
    }

    // Adiciona ao carrinho
    addToCart({
      id: listing.id,
      name: listing.card_name,
      price: Number(listing.price),
      image: listing.card_image,
      condition: listing.condition,
      condition_display: getConditionLabel(listing.condition),
      seller: listing.seller?.username,
      quantity: 1
    });

    toast.success(`${listing.card_name} adicionada ao carrinho!`, 'Adicionado 🛒');
  };

  const isItemInCart = (listingId) => {
    return cartItems.some(item => item.id === listingId);
  };

  const getConditionLabel = (value) => {
    return CONDITIONS.find(c => c.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-400">Carregando marketplace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-300 mb-4">{error}</p>
        <button 
          onClick={fetchListings}
          className="bg-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            Marketplace
          </h1>
          {isAuthenticated && wallet && (
            <p className="text-xs text-gray-500 mt-1">
              Saldo: <span className="text-primary font-bold">{Number(wallet.balance).toFixed(0)}</span> tokens
            </p>
          )}
        </div>
        
        {isAuthenticated ? (
          <Link
            to="/sell"
            className="bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Vender
          </Link>
        ) : (
          <Link
            to="/login"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </Link>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        {listings.length} {listings.length === 1 ? 'oferta disponível' : 'ofertas disponíveis'}
      </p>
      
      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Store className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="mb-2">Nenhuma carta à venda no momento.</p>
          {isAuthenticated && (
            <Link to="/sell" className="text-primary hover:underline text-sm">
              Seja o primeiro a vender!
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-20">
          {listings.map((item) => {
            const inCart = isItemInCart(item.id);
            return (
              <div key={item.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-sm flex flex-col">
                <div className="aspect-[3/4] bg-gray-800 relative group">
                  {item.card_image ? (
                    <img src={item.card_image} alt={item.card_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-gray-800/50">
                      <span className="text-4xl mb-2">🃏</span>
                    </div>
                  )}
                  
                  {/* Condição Badge */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-medium text-gray-300 border border-gray-600">
                    {getConditionLabel(item.condition)}
                  </div>
                  
                  {/* Vendedor */}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-gray-400">
                    @{item.seller?.username}
                  </div>
                </div>
                
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm truncate mb-1" title={item.card_name}>
                    {item.card_name}
                  </h3>
                  {item.card_type && (
                    <p className="text-[10px] text-gray-500 truncate">{item.card_type}</p>
                  )}
                  
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-primary font-bold text-sm flex items-center gap-1">
                      🪙 {Number(item.price).toFixed(0)}
                    </span>
                    
                    {item.is_owner ? (
                      <span className="text-xs px-3 py-1.5 rounded-lg border bg-gray-700/50 border-gray-600 text-gray-500">
                        Seu
                      </span>
                    ) : inCart ? (
                      <button 
                        onClick={() => navigate('/cart')}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1 bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white"
                      >
                        <Check className="w-3 h-3" />
                        No Carrinho
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1 bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, Tag, Check, X, ImageIcon } from 'lucide-react';
import { searchCards } from '../services/ygoprodeck';
import { createListing, CONDITIONS } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Sell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  
  const [step, setStep] = useState(1); // 1: Selecionar carta, 2: Definir preço
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState(location.state?.card || null);
  
  // Form de venda
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('NEAR_MINT');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/sell' } });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (selectedCard) {
      setStep(2);
    }
  }, [selectedCard]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');
    try {
      const results = await searchCards(searchQuery, { limit: 20 });
      setSearchResults(results);
      if (results.length === 0) {
        setError('Nenhuma carta encontrada.');
      }
    } catch (err) {
      setError('Erro ao buscar cartas.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCard = (card) => {
    setSelectedCard(card);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!price || Number(price) <= 0) {
      setError('Informe um preço válido.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const listingData = {
        card_id: String(selectedCard.id),
        card_name: selectedCard.name,
        card_image: selectedCard.card_images?.[0]?.image_url || selectedCard.card_images?.[0]?.image_url_small,
        card_type: selectedCard.type || '',
        price: Number(price),
        condition,
        description,
        quantity: Number(quantity),
      };

      await createListing(listingData);
      toast.success(`${selectedCard.name} listada por ${price} tokens!`, 'Anúncio criado! 🎉');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.detail || 
                      Object.values(err.response?.data || {}).flat().join(', ') ||
                      'Erro ao criar anúncio.';
      setError(message);
      toast.error(message, 'Erro ao criar anúncio');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className="p-2 -ml-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Vender Carta</h1>
          <p className="text-xs text-gray-500">
            {step === 1 ? 'Selecione a carta que deseja vender' : 'Defina o preço e condição'}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-700'}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-700'}`} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Selecionar Carta */}
      {step === 1 && (
        <div>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar carta pelo nome..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl pl-11 focus:outline-none focus:border-primary"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </form>

          {/* Resultados */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {searchResults.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSelectCard(card)}
                  className="text-left bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-primary transition-colors"
                >
                  <div className="aspect-[3/4.4] bg-gray-800">
                    {card.card_images?.[0]?.image_url_small ? (
                      <img
                        src={card.card_images[0].image_url_small}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-white truncate">{card.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults.length === 0 && !searching && (
            <div className="text-center py-10 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Busque uma carta para começar</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Definir Preço */}
      {step === 2 && selectedCard && (
        <form onSubmit={handleSubmit}>
          {/* Card Preview */}
          <div className="flex gap-4 mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
            <div className="w-20 h-28 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
              {selectedCard.card_images?.[0]?.image_url_small ? (
                <img
                  src={selectedCard.card_images[0].image_url_small}
                  alt={selectedCard.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{selectedCard.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{selectedCard.type}</p>
              <button
                type="button"
                onClick={() => { setSelectedCard(null); setStep(1); }}
                className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Trocar carta
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preço (tokens) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-primary pl-10"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🪙</span>
            </div>
          </div>

          {/* Condition */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Condição *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-primary"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantidade
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              min="1"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre a carta..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !price}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Tag className="w-5 h-5" />
                Criar Anúncio
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default Sell;

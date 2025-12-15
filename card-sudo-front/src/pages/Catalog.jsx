import React, { useEffect, useState, useCallback } from 'react';
import { Search, Loader2, BookOpen, Filter, X } from 'lucide-react';
import { searchCards, getArchetypes, getPopularCards } from '../services/ygoprodeck';
import Card3D from '../components/ui/Card3D';

const Catalog = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true); // Começa como true para carregar amostra
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [archetypes, setArchetypes] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    attribute: '',
    archetype: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchCards = useCallback(async (query = '', filterOpts = {}) => {
    try {
      setLoading(true);
      setError(null);
      setIsInitialLoad(false);
      const result = await searchCards(query, { ...filterOpts, limit: 50 });
      setCards(result || []);
      if (result?.length === 0) {
        setError('Nenhuma carta encontrada.');
      }
    } catch (err) {
      console.error('Erro:', err);
      if (err.response?.status === 400) {
        setError('Nenhuma carta encontrada com esse termo.');
      } else {
        setError('Erro ao buscar cartas.');
      }
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega cartas de amostra e arquétipos ao iniciar
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Carrega cartas populares como amostra
        const popularCards = await getPopularCards();
        setCards(popularCards);
        
        // Carrega arquétipos para o filtro
        const archetypesList = await getArchetypes();
        setArchetypes(archetypesList || []);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
        setError('Erro ao carregar cartas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCards(searchQuery, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (searchQuery.trim()) {
      fetchCards(searchQuery, newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({ type: '', attribute: '', archetype: '' });
    setCards([]);
    setError(null);
  };

  const cardTypes = [
    'Effect Monster', 'Normal Monster', 'Fusion Monster', 
    'Synchro Monster', 'Xyz Monster', 'Link Monster',
    'Spell Card', 'Trap Card', 'Ritual Monster'
  ];

  const attributes = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];

  return (
    <div className="py-4 sm:py-6 pb-24">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold">Catálogo</h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-3 sm:mb-4">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar carta por nome..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 px-3 sm:px-4 rounded-xl transition-colors"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 sm:p-3 rounded-xl border transition-colors ${
              showFilters ? 'bg-primary border-primary' : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            }`}
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-900 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-400">Filtros</span>
            {(filters.type || filters.attribute || filters.archetype) && (
              <button onClick={clearFilters} className="text-xs text-red-400 flex items-center gap-1">
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div>
              <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-2 sm:px-3 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Todos</option>
                {cardTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block">Atributo</label>
              <select
                value={filters.attribute}
                onChange={(e) => handleFilterChange('attribute', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-2 sm:px-3 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Todos</option>
                {attributes.map((attr) => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Archetype Filter */}
          <div>
            <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block">Arquétipo</label>
            <select
              value={filters.archetype}
              onChange={(e) => handleFilterChange('archetype', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-2 sm:px-3 text-xs focus:outline-none focus:border-primary"
            >
              <option value="">Todos</option>
              {archetypes.map((arch) => (
                <option key={arch.archetype_name} value={arch.archetype_name}>
                  {arch.archetype_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search by filter button */}
          <button
            onClick={() => fetchCards(searchQuery, filters)}
            className="w-full mt-3 bg-primary/20 hover:bg-primary/30 text-primary py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors"
          >
            Buscar com filtros
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin mb-3 sm:mb-4" />
          <p className="text-gray-400 text-sm">Carregando cartas...</p>
        </div>
      ) : error && cards.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          {error}
        </div>
      ) : cards.length > 0 ? (
        <>
          <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
            {isInitialLoad ? '🔥 Cartas em destaque' : `${cards.length} cartas encontradas`}
          </p>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
            {cards.map((card) => (
              <div 
                key={card.id} 
                onClick={() => setSelectedCard(card)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[3/4.4] bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 active:scale-95">
                  <img 
                    src={card.card_images?.[0]?.image_url_small} 
                    alt={card.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5 sm:p-2">
                    <span className="text-[8px] sm:text-[10px] text-white font-medium line-clamp-2">{card.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Card Detail Modal */}
      {selectedCard && (
        <Card3D card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default Catalog;

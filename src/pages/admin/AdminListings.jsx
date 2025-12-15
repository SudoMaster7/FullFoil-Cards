import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

export default function AdminListings() {
  const { showSuccess, showError } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'view', 'remove'
  const [removeReason, setRemoveReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [pagination.page, filters.status]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/admin-panel/listings/?${params.toString()}`);
      setListings(response.data.results || response.data);
      if (response.data.total_pages) {
        setPagination(prev => ({
          ...prev,
          total_pages: response.data.total_pages,
          total: response.data.total
        }));
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      showError('Erro ao carregar anúncios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchListings();
  };

  const openModal = (listing, type) => {
    setSelectedListing(listing);
    setModalType(type);
    setRemoveReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedListing(null);
    setModalType(null);
    setRemoveReason('');
  };

  const handleRemoveListing = async () => {
    if (!selectedListing) return;
    try {
      setProcessing(true);
      await api.delete(`/admin-panel/listings/${selectedListing.id}/remove/`, {
        data: { reason: removeReason }
      });
      showSuccess('Anúncio removido com sucesso');
      closeModal();
      fetchListings();
    } catch (err) {
      showError(err.response?.data?.error || 'Erro ao remover anúncio');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
            Ativo
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
            Vendido
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
            Cancelado
          </span>
        );
      default:
        return status;
    }
  };

  const getConditionText = (condition) => {
    const conditions = {
      'mint': 'Mint',
      'near_mint': 'Near Mint',
      'excellent': 'Excellent',
      'good': 'Good',
      'light_played': 'Light Played',
      'played': 'Played',
      'poor': 'Poor'
    };
    return conditions[condition] || condition;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Anúncios</h1>
          <p className="text-gray-400">Gerencie os anúncios do marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{pagination.total} anúncios</span>
          <button
            onClick={fetchListings}
            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
            title="Atualizar"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-gray-800 rounded-xl p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar por nome da carta ou vendedor..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, status: '' }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !filters.status ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, status: 'active' }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filters.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, status: 'sold' }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filters.status === 'sold' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Vendidos
          </button>
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, status: 'cancelled' }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filters.status === 'cancelled' ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <ShoppingBagIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum anúncio encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-gray-800 rounded-xl overflow-hidden hover:ring-1 hover:ring-gray-700 transition-all"
            >
              {/* Card Image */}
              <div className="relative aspect-[3/4] bg-gray-900">
                <img
                  src={listing.card_image || '/placeholder-card.png'}
                  alt={listing.card_name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(listing.status)}
                </div>
              </div>

              {/* Card Info */}
              <div className="p-4">
                <h3 className="text-white font-medium truncate" title={listing.card_name}>
                  {listing.card_name}
                </h3>
                <p className="text-sm text-gray-400">{listing.card_set}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-yellow-500">
                    R$ {parseFloat(listing.price).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400">
                    Qty: {listing.quantity}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <span className="text-xs text-gray-900 font-bold">
                        {listing.seller?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400 truncate max-w-[80px]">
                      {listing.seller?.username || 'Vendedor'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {getConditionText(listing.condition)}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openModal(listing, 'view')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Ver
                  </button>
                  {listing.status === 'active' && (
                    <button
                      onClick={() => openModal(listing, 'remove')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-gray-400">
            Página {pagination.page} de {pagination.total_pages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.total_pages}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {modalType === 'view' ? 'Detalhes do Anúncio' : 'Remover Anúncio'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {modalType === 'view' ? (
                <div className="space-y-4">
                  {/* Card Preview */}
                  <div className="flex gap-4">
                    <div className="w-32 aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={selectedListing.card_image || '/placeholder-card.png'}
                        alt={selectedListing.card_name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">{selectedListing.card_name}</h4>
                      <p className="text-gray-400">{selectedListing.card_set}</p>
                      <p className="text-2xl font-bold text-yellow-500 mt-2">
                        R$ {parseFloat(selectedListing.price).toFixed(2)}
                      </p>
                      <div className="mt-2">{getStatusBadge(selectedListing.status)}</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 bg-gray-700/50 rounded-lg p-4">
                    <div className="flex justify-between py-1 border-b border-gray-600">
                      <span className="text-gray-400">Vendedor</span>
                      <span className="text-white">{selectedListing.seller?.username}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-600">
                      <span className="text-gray-400">Quantidade</span>
                      <span className="text-white">{selectedListing.quantity}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-600">
                      <span className="text-gray-400">Condição</span>
                      <span className="text-white">{getConditionText(selectedListing.condition)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-600">
                      <span className="text-gray-400">Idioma</span>
                      <span className="text-white capitalize">{selectedListing.language || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-600">
                      <span className="text-gray-400">1ª Edição</span>
                      <span className="text-white">{selectedListing.is_first_edition ? 'Sim' : 'Não'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-600">
                      <span className="text-gray-400">Criado em</span>
                      <span className="text-white">
                        {new Date(selectedListing.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {selectedListing.sold_at && (
                      <div className="flex justify-between py-1 border-b border-gray-600">
                        <span className="text-gray-400">Vendido em</span>
                        <span className="text-white">
                          {new Date(selectedListing.sold_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {selectedListing.buyer && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Comprador</span>
                        <span className="text-white">{selectedListing.buyer.username}</span>
                      </div>
                    )}
                  </div>

                  {selectedListing.description && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Descrição</p>
                      <p className="text-white bg-gray-700/50 rounded-lg p-3">
                        {selectedListing.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Card Preview */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={selectedListing.card_image || '/placeholder-card.png'}
                        alt={selectedListing.card_name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{selectedListing.card_name}</h4>
                      <p className="text-sm text-gray-400">por {selectedListing.seller?.username}</p>
                      <p className="text-yellow-500 font-bold">
                        R$ {parseFloat(selectedListing.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-red-400 font-medium">Remover anúncio?</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Esta ação não pode ser desfeita. A carta voltará para o vendedor.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Motivo (opcional)</label>
                    <textarea
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value)}
                      placeholder="Informe o motivo da remoção..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                {modalType === 'view' ? 'Fechar' : 'Cancelar'}
              </button>
              {modalType === 'remove' && (
                <button
                  onClick={handleRemoveListing}
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                  {processing ? 'Removendo...' : 'Remover Anúncio'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

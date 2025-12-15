import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tag, Coins, Loader2, Plus, Edit2, Trash2, X, Check,
  Package, AlertCircle, ChevronLeft, Eye, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const MyListings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const toast = useToast();
  
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, sold, cancelled
  
  // Modal de edição
  const [editModal, setEditModal] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal de confirmação de cancelamento
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchListings();
    }
  }, [isAuthenticated]);

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const response = await api.get('/market/listings/my/');
      setListings(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      toast.error('Erro ao carregar seus anúncios', 'Erro');
    } finally {
      setLoadingListings(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    return listing.status?.toLowerCase() === filter;
  });

  const openEditModal = (listing) => {
    setEditModal(listing);
    setEditPrice(listing.price?.toString() || '');
    setEditQuantity(listing.quantity?.toString() || '1');
    setEditDescription(listing.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    
    const price = parseFloat(editPrice);
    const quantity = parseInt(editQuantity);
    
    if (isNaN(price) || price <= 0) {
      toast.error('Preço inválido', 'Erro');
      return;
    }
    if (isNaN(quantity) || quantity < 1) {
      toast.error('Quantidade inválida', 'Erro');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/market/listings/${editModal.id}/update/`, {
        price,
        quantity,
        description: editDescription
      });
      toast.success('Anúncio atualizado!', 'Sucesso');
      setEditModal(null);
      fetchListings();
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao atualizar anúncio';
      toast.error(msg, 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelListing = async () => {
    if (!cancelModal) return;
    
    setCancelling(true);
    try {
      await api.delete(`/market/listings/${cancelModal.id}/cancel/`);
      toast.success('Anúncio cancelado!', 'Sucesso');
      setCancelModal(null);
      fetchListings();
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao cancelar anúncio';
      toast.error(msg, 'Erro');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Ativo</span>;
      case 'sold':
        return <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">Vendido</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full">Cancelado</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Meus Anúncios</h1>
          <p className="text-sm text-gray-400">{listings.length} anúncio(s)</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'Ativos' },
          { id: 'sold', label: 'Vendidos' },
          { id: 'cancelled', label: 'Cancelados' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-amber-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Botão de novo anúncio */}
      <button
        onClick={() => navigate('/sell')}
        className="w-full mb-6 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center gap-2 font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
      >
        <Plus className="w-5 h-5" />
        Criar Novo Anúncio
      </button>

      {/* Lista de anúncios */}
      {loadingListings ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 mb-4">
            {filter === 'all' 
              ? 'Você ainda não tem anúncios' 
              : `Nenhum anúncio ${filter === 'active' ? 'ativo' : filter === 'sold' ? 'vendido' : 'cancelado'}`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={() => navigate('/sell')}
              className="px-6 py-2 bg-amber-500 rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              Vender sua primeira carta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden"
            >
              <div className="p-4 flex gap-4">
                {/* Imagem */}
                <div 
                  className="w-20 h-28 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/card/${listing.card_id}`)}
                >
                  {listing.card_image ? (
                    <img
                      src={listing.card_image}
                      alt={listing.card_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm truncate">{listing.card_name}</h3>
                    {getStatusBadge(listing.status)}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {listing.condition} • {listing.language}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {listing.price}
                    </span>
                    {listing.quantity > 1 && (
                      <span className="text-xs text-gray-500">
                        Qtd: {listing.quantity}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Criado em {formatDate(listing.created_at)}
                  </p>
                </div>
              </div>

              {/* Ações (apenas para ativos) */}
              {listing.status?.toLowerCase() === 'active' && (
                <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-800 flex gap-2">
                  <button
                    onClick={() => openEditModal(listing)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => setCancelModal(listing)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              )}

              {/* Info de venda */}
              {listing.status?.toLowerCase() === 'sold' && listing.sold_at && (
                <div className="px-4 py-3 bg-blue-900/20 border-t border-blue-800/30 text-sm text-blue-400">
                  Vendido em {formatDate(listing.sold_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      {editModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Editar Anúncio</h2>
              <button 
                onClick={() => setEditModal(null)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview da carta */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-800/50 rounded-xl">
              {editModal.card_image && (
                <img 
                  src={editModal.card_image} 
                  alt={editModal.card_name}
                  className="w-12 h-16 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-bold text-sm">{editModal.card_name}</h3>
                <p className="text-xs text-gray-500">{editModal.condition} • {editModal.language}</p>
              </div>
            </div>

            {/* Preço */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Preço (tokens)</label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Quantidade */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Quantidade</label>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                min="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Descrição */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Descrição (opcional)</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Detalhes adicionais sobre a carta..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold mb-2">Cancelar Anúncio?</h2>
              <p className="text-sm text-gray-400">
                Você está prestes a cancelar o anúncio de <span className="font-bold text-white">{cancelModal.card_name}</span>. 
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelListing}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Cancelar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;

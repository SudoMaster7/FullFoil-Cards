import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Coins, CreditCard, LogOut, 
  ShoppingBag, Tag, ArrowUpRight, ArrowDownLeft, 
  Settings, ChevronRight, Loader2, Package, Gift,
  MapPin, Truck, Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, wallet, isAuthenticated, logout, refreshWallet, loading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Debug
  console.log('Profile - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoadingData(true);
        
        // Atualiza wallet
        await refreshWallet();
        
        // Busca transações
        try {
          const txResponse = await api.get('/wallet/wallet/transactions/');
          setTransactions(txResponse.data.results || txResponse.data || []);
        } catch (e) {
          console.error('Erro ao carregar transações:', e);
        }
        
        // Busca listagens do usuário
        try {
          const listingsResponse = await api.get('/market/listings/my/');
          setMyListings(listingsResponse.data.results || listingsResponse.data || []);
        } catch (e) {
          console.error('Erro ao carregar listagens:', e);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isAuthenticated, refreshWallet]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-5 h-5" />;
      case 'PURCHASE':
        return <ShoppingBag className="w-5 h-5" />;
      case 'SALE':
        return <Tag className="w-5 h-5" />;
      case 'WITHDRAW':
        return <ArrowUpRight className="w-5 h-5" />;
      case 'BONUS':
      case 'REFERRAL':
        return <Gift className="w-5 h-5" />;
      default:
        return <Coins className="w-5 h-5" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
      case 'SALE':
      case 'BONUS':
      case 'REFERRAL':
        return 'text-green-500 bg-green-500/10';
      case 'WITHDRAW':
      case 'PURCHASE':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const isPositiveTransaction = (type) => {
    return ['DEPOSIT', 'SALE', 'BONUS', 'REFERRAL'].includes(type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header com info do usuário */}
      <div className="bg-gradient-to-br from-purple-900/50 to-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{user?.username || 'Usuário'}</h1>
              <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{user?.email || 'email@exemplo.com'}</span>
              </p>
              {user?.date_joined && (
                <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  Desde {formatDate(user.date_joined)}
                </p>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 bg-gray-800 hover:bg-red-900/50 rounded-lg border border-gray-700 hover:border-red-700 transition-colors flex-shrink-0"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="bg-gradient-to-br from-yellow-600/20 to-amber-900/20 rounded-2xl p-4 sm:p-6 border border-yellow-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-yellow-200/70 text-xs sm:text-sm mb-1">Saldo Disponível</p>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                <span className="text-3xl sm:text-4xl font-bold text-yellow-400">
                  {(Number(wallet?.balance) || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-4 py-3 sm:py-2 rounded-xl sm:rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Gerenciar Carteira
            </button>
          </div>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'transactions', label: 'Transações' },
            { id: 'listings', label: 'Minhas Vendas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Stats Cards - 2x2 grid on mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
                    <p className="text-gray-500 text-[10px] sm:text-xs mb-1">Saldo</p>
                    <p className="text-lg sm:text-xl font-bold text-yellow-400">{(Number(wallet?.balance) || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
                    <p className="text-gray-500 text-[10px] sm:text-xs mb-1">Vendas Ativas</p>
                    <p className="text-lg sm:text-xl font-bold">{myListings.filter(l => l.status === 'active').length}</p>
                  </div>
                  <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
                    <p className="text-gray-500 text-[10px] sm:text-xs mb-1">Vendidos</p>
                    <p className="text-lg sm:text-xl font-bold text-green-400">{myListings.filter(l => l.status === 'sold').length}</p>
                  </div>
                  <div className="bg-gray-900/80 rounded-xl p-3 sm:p-4 border border-gray-800">
                    <p className="text-gray-500 text-[10px] sm:text-xs mb-1">Transações</p>
                    <p className="text-lg sm:text-xl font-bold">{transactions.length}</p>
                  </div>
                </div>

                {/* Quick Actions - Full width buttons on mobile */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Pedidos</span>
                  </button>
                  <button
                    onClick={() => navigate('/sales')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                      <Store className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Vendas</span>
                  </button>
                  <button
                    onClick={() => navigate('/addresses')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                      <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Endereços</span>
                  </button>
                  <button
                    onClick={() => navigate('/my-cards')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                      <Package className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Cartas</span>
                  </button>
                </div>

                {/* Segunda linha de Quick Actions */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <button
                    onClick={() => navigate('/catalog')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-pink-600/20 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-pink-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Catálogo</span>
                  </button>
                  <button
                    onClick={() => navigate('/sell')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-orange-600/20 flex items-center justify-center">
                      <Tag className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Vender</span>
                  </button>
                  <button
                    onClick={() => navigate('/wallet')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                      <Coins className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Tokens</span>
                  </button>
                  <button
                    onClick={() => navigate('/my-listings')}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-900/80 rounded-xl border border-gray-800 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
                      <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-center">Anúncios</span>
                  </button>
                </div>

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                  <div className="bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-400">Transações Recentes</h3>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Ver todas
                      </button>
                    </div>
                    <div className="divide-y divide-gray-800">
                      {transactions.slice(0, 3).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(tx.transaction_type)}`}>
                              {getTransactionIcon(tx.transaction_type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">{tx.description || tx.transaction_type}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <span className={`font-bold text-sm sm:text-base flex-shrink-0 ${isPositiveTransaction(tx.transaction_type) ? 'text-green-500' : 'text-red-400'}`}>
                            {isPositiveTransaction(tx.transaction_type) ? '+' : '-'}
                            {Number(tx.amount).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Coins className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma transação ainda</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(tx.transaction_type)}`}>
                            {getTransactionIcon(tx.transaction_type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{tx.description || tx.transaction_type}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm sm:text-base flex-shrink-0 ${isPositiveTransaction(tx.transaction_type) ? 'text-green-500' : 'text-red-400'}`}>
                          {isPositiveTransaction(tx.transaction_type) ? '+' : '-'}
                          {Number(tx.amount).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-3">
                {/* Botão para gerenciar */}
                <button
                  onClick={() => navigate('/my-listings')}
                  className="w-full p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center gap-2 font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  Gerenciar Meus Anúncios
                </button>

                {myListings.length === 0 ? (
                  <div className="bg-gray-900/80 rounded-xl border border-gray-800 text-center py-12 text-gray-500">
                    <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-4">Você ainda não tem cartas à venda</p>
                    <button
                      onClick={() => navigate('/sell')}
                      className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl text-sm font-medium"
                    >
                      Vender Carta
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {myListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="bg-gray-900/80 rounded-xl border border-gray-800 p-3 sm:p-4 flex items-center gap-3"
                      >
                        {listing.card_image && (
                          <img
                            src={listing.card_image}
                            alt={listing.card_name}
                            className="w-12 h-18 sm:w-16 sm:h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm sm:text-base truncate">{listing.card_name}</h4>
                          <p className="text-xs text-gray-400 truncate">
                            {listing.condition} • {listing.language}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-4 mt-2 flex-wrap">
                            <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
                              <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                              {listing.price}
                            </span>
                            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${
                              listing.status === 'active' 
                                ? 'bg-green-900/50 text-green-400' 
                                : listing.status === 'sold'
                                ? 'bg-blue-900/50 text-blue-400'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {listing.status === 'active' ? 'Ativo' : 
                               listing.status === 'sold' ? 'Vendido' : listing.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;

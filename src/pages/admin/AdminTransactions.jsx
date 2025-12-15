import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  GiftIcon,
  ArrowsRightLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function AdminTransactions() {
  const { showError } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    type: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters.type]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/admin-panel/transactions/?${params.toString()}`);
      setTransactions(response.data.results || response.data);
      if (response.data.total_pages) {
        setPagination(prev => ({
          ...prev,
          total_pages: response.data.total_pages,
          total: response.data.total
        }));
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      showError('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const getTypeConfig = (type) => {
    const types = {
      'DEPOSIT': { 
        label: 'Depósito', 
        icon: ArrowDownIcon, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20',
        isPositive: true
      },
      'WITHDRAW': { 
        label: 'Saque', 
        icon: ArrowUpIcon, 
        color: 'text-red-400', 
        bg: 'bg-red-500/20',
        isPositive: false
      },
      'SALE': { 
        label: 'Venda', 
        icon: ShoppingBagIcon, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20',
        isPositive: true
      },
      'PURCHASE': { 
        label: 'Compra', 
        icon: ShoppingBagIcon, 
        color: 'text-red-400', 
        bg: 'bg-red-500/20',
        isPositive: false
      },
      'BONUS': { 
        label: 'Bônus', 
        icon: GiftIcon, 
        color: 'text-purple-400', 
        bg: 'bg-purple-500/20',
        isPositive: true
      },
      'REFERRAL_BONUS': { 
        label: 'Bônus Indicação', 
        icon: UserIcon, 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/20',
        isPositive: true
      },
      'ADMIN_ADJUSTMENT': { 
        label: 'Ajuste Admin', 
        icon: ArrowsRightLeftIcon, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20',
        isPositive: null // depends on amount
      },
      'REFUND': { 
        label: 'Reembolso', 
        icon: ArrowDownIcon, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20',
        isPositive: true
      }
    };
    return types[type] || { 
      label: type, 
      icon: ArrowsRightLeftIcon, 
      color: 'text-gray-400', 
      bg: 'bg-gray-500/20',
      isPositive: null
    };
  };

  const transactionTypes = [
    { value: '', label: 'Todos' },
    { value: 'DEPOSIT', label: 'Depósitos' },
    { value: 'WITHDRAW', label: 'Saques' },
    { value: 'SALE', label: 'Vendas' },
    { value: 'PURCHASE', label: 'Compras' },
    { value: 'BONUS', label: 'Bônus' },
    { value: 'REFERRAL_BONUS', label: 'Indicações' },
    { value: 'ADMIN_ADJUSTMENT', label: 'Ajustes' },
    { value: 'REFUND', label: 'Reembolsos' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-gray-400">Histórico de todas as transações do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{pagination.total} transações</span>
          <button
            onClick={fetchTransactions}
            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
            title="Atualizar"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar por usuário ou descrição..."
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
          {transactionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setFilters(prev => ({ ...prev, type: type.value }));
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.type === type.value
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const typeConfig = getTypeConfig(transaction.transaction_type);
                  const amount = parseFloat(transaction.amount);
                  const isPositive = typeConfig.isPositive !== null ? typeConfig.isPositive : amount >= 0;
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                            <typeConfig.icon className={`w-4 h-4 ${typeConfig.color}`} />
                          </div>
                          <span className={`text-sm font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-900 font-bold">
                              {transaction.user?.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="text-white">{transaction.user?.username || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-300 max-w-xs truncate" title={transaction.description}>
                          {transaction.description || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''} R$ {Math.abs(amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-sm">
                        <p>{new Date(transaction.created_at).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs">{new Date(transaction.created_at).toLocaleTimeString('pt-BR')}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Página {pagination.page} de {pagination.total_pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

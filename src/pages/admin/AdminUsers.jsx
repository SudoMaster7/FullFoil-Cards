import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    verified: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'view', 'edit', 'balance'
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [editData, setEditData] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.verified) params.append('verified', filters.verified);

      const response = await api.get(`/admin-panel/users/?${params.toString()}`);
      setUsers(response.data.results || response.data);
      if (response.data.total_pages) {
        setPagination(prev => ({
          ...prev,
          total_pages: response.data.total_pages,
          total: response.data.total
        }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (user, type) => {
    setModalType(type);
    setSelectedUser(user);
    setShowModal(true);

    if (type === 'view') {
      try {
        const response = await api.get(`/admin-panel/users/${user.id}/`);
        setSelectedUser(response.data);
      } catch (err) {
        showError('Erro ao carregar detalhes do usuário');
      }
    } else if (type === 'edit') {
      setEditData({
        is_active: user.is_active,
        is_verified: user.is_verified
      });
    } else if (type === 'balance') {
      setBalanceAmount('');
      setBalanceReason('');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalType(null);
    setBalanceAmount('');
    setBalanceReason('');
    setEditData({});
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      setProcessing(true);
      await api.patch(`/admin-panel/users/${selectedUser.id}/update/`, editData);
      showSuccess('Usuário atualizado com sucesso');
      closeModal();
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.error || 'Erro ao atualizar usuário');
    } finally {
      setProcessing(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceAmount || !balanceReason) {
      showError('Preencha todos os campos');
      return;
    }
    try {
      setProcessing(true);
      await api.post(`/admin-panel/users/${selectedUser.id}/balance/`, {
        amount: parseFloat(balanceAmount),
        reason: balanceReason
      });
      showSuccess('Saldo ajustado com sucesso');
      closeModal();
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.error || 'Erro ao ajustar saldo');
    } finally {
      setProcessing(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', verified: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-gray-400">Gerencie os usuários do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{pagination.total} usuários</span>
          <button
            onClick={fetchUsers}
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
              placeholder="Buscar por nome, email ou username..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filtros
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Verificação</label>
              <select
                value={filters.verified}
                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="">Todos</option>
                <option value="true">Verificados</option>
                <option value="false">Não Verificados</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cadastro</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-900 font-bold">
                            {user.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium flex items-center gap-1">
                            {user.username}
                            {user.is_verified && (
                              <CheckBadgeIcon className="w-4 h-4 text-blue-500" title="Verificado" />
                            )}
                            {user.is_staff && (
                              <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded">Admin</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-400">{user.first_name} {user.last_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-300">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className="text-green-400 font-medium">
                        R$ {parseFloat(user.balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">
                      {new Date(user.date_joined).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(user, 'view')}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                          title="Ver detalhes"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openModal(user, 'edit')}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openModal(user, 'balance')}
                          className="p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                          title="Ajustar saldo"
                        >
                          <CurrencyDollarIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {modalType === 'view' && 'Detalhes do Usuário'}
                {modalType === 'edit' && 'Editar Usuário'}
                {modalType === 'balance' && 'Ajustar Saldo'}
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
              {modalType === 'view' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <span className="text-2xl text-gray-900 font-bold">
                        {selectedUser.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{selectedUser.username}</h4>
                      <p className="text-gray-400">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Saldo</p>
                      <p className="text-lg font-bold text-green-400">
                        R$ {parseFloat(selectedUser.balance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Saldo Bloqueado</p>
                      <p className="text-lg font-bold text-yellow-400">
                        R$ {parseFloat(selectedUser.locked_balance || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Nome</span>
                      <span className="text-white">{selectedUser.first_name} {selectedUser.last_name || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Status</span>
                      <span className={selectedUser.is_active ? 'text-green-400' : 'text-red-400'}>
                        {selectedUser.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Verificado</span>
                      <span className={selectedUser.is_verified ? 'text-blue-400' : 'text-gray-400'}>
                        {selectedUser.is_verified ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Admin</span>
                      <span className={selectedUser.is_staff ? 'text-yellow-400' : 'text-gray-400'}>
                        {selectedUser.is_staff ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Cadastro</span>
                      <span className="text-white">
                        {new Date(selectedUser.date_joined).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Último Login</span>
                      <span className="text-white">
                        {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('pt-BR') : 'Nunca'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Total de Transações</span>
                      <span className="text-white">{selectedUser.transactions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Total de Anúncios</span>
                      <span className="text-white">{selectedUser.listings?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'edit' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <span className="text-gray-900 font-bold">
                        {selectedUser.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedUser.username}</p>
                      <p className="text-sm text-gray-400">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editData.is_active}
                          onChange={(e) => setEditData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="text-white">Conta Ativa</span>
                      </label>
                      <p className="text-sm text-gray-400 ml-8">Desativar impede o usuário de fazer login</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editData.is_verified}
                          onChange={(e) => setEditData(prev => ({ ...prev, is_verified: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="text-white">Verificado</span>
                      </label>
                      <p className="text-sm text-gray-400 ml-8">Usuários verificados podem fazer saques</p>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'balance' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <span className="text-gray-900 font-bold">
                        {selectedUser.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedUser.username}</p>
                      <p className="text-sm text-gray-400">Saldo atual: R$ {parseFloat(selectedUser.balance || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Valor do Ajuste</label>
                    <input
                      type="number"
                      step="0.01"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      placeholder="Ex: 50.00 ou -20.00"
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use valores negativos para débito</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Motivo</label>
                    <textarea
                      value={balanceReason}
                      onChange={(e) => setBalanceReason(e.target.value)}
                      placeholder="Descreva o motivo do ajuste..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 resize-none"
                    />
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Novo saldo após ajuste:</p>
                    <p className={`text-lg font-bold ${
                      parseFloat(selectedUser.balance || 0) + parseFloat(balanceAmount || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      R$ {(parseFloat(selectedUser.balance || 0) + parseFloat(balanceAmount || 0)).toFixed(2)}
                    </p>
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
              {modalType === 'edit' && (
                <button
                  onClick={handleUpdateUser}
                  disabled={processing}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  {processing ? 'Salvando...' : 'Salvar'}
                </button>
              )}
              {modalType === 'balance' && (
                <button
                  onClick={handleAdjustBalance}
                  disabled={processing || !balanceAmount || !balanceReason}
                  className="px-6 py-2 bg-green-500 hover:bg-green-400 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  {processing ? 'Processando...' : 'Confirmar Ajuste'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

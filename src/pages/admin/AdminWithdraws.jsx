import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  UserIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AdminWithdraws() {
  const { showSuccess, showError } = useToast();
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'approve', 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdraws();
  }, [pagination.page, filters]);

  const fetchWithdraws = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/admin-panel/withdraws/?${params.toString()}`);
      setWithdraws(response.data.results || response.data);
      if (response.data.total_pages) {
        setPagination(prev => ({
          ...prev,
          total_pages: response.data.total_pages,
          total: response.data.total
        }));
      }
    } catch (err) {
      console.error('Error fetching withdraws:', err);
      showError('Erro ao carregar saques');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (withdraw, action) => {
    setSelectedWithdraw(withdraw);
    setModalAction(action);
    setRejectReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWithdraw(null);
    setModalAction(null);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedWithdraw) return;
    try {
      setProcessing(true);
      await api.post(`/admin-panel/withdraws/${selectedWithdraw.id}/approve/`);
      showSuccess('Saque aprovado com sucesso!');
      closeModal();
      fetchWithdraws();
    } catch (err) {
      showError(err.response?.data?.error || 'Erro ao aprovar saque');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdraw || !rejectReason.trim()) {
      showError('Informe o motivo da rejeição');
      return;
    }
    try {
      setProcessing(true);
      await api.post(`/admin-panel/withdraws/${selectedWithdraw.id}/reject/`, {
        reason: rejectReason
      });
      showSuccess('Saque rejeitado');
      closeModal();
      fetchWithdraws();
    } catch (err) {
      showError(err.response?.data?.error || 'Erro ao rejeitar saque');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
            <ClockIcon className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
            <XCircleIcon className="w-3.5 h-3.5" />
            Rejeitado
          </span>
        );
      default:
        return status;
    }
  };

  const pendingCount = withdraws.filter(w => w.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Saques</h1>
          <p className="text-gray-400">Gerencie as solicitações de saque</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-500 rounded-lg text-sm">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={fetchWithdraws}
            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
            title="Atualizar"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filtros
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilters({ status: '' });
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
                setFilters({ status: 'pending' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.status === 'pending' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => {
                setFilters({ status: 'approved' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.status === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Aprovados
            </button>
            <button
              onClick={() => {
                setFilters({ status: 'rejected' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Rejeitados
            </button>
          </div>
        </div>
      </div>

      {/* Withdraws List */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chave PIX</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
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
              ) : withdraws.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    Nenhum saque encontrado
                  </td>
                </tr>
              ) : (
                withdraws.map((withdraw) => (
                  <tr key={withdraw.id} className={`hover:bg-gray-700/30 ${withdraw.status === 'pending' ? 'bg-yellow-500/5' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-900 font-bold">
                            {withdraw.user?.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{withdraw.user?.username || 'Usuário'}</p>
                          <p className="text-sm text-gray-400">{withdraw.user?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-lg font-bold text-white">
                        R$ {parseFloat(withdraw.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white">{withdraw.pix_key}</p>
                        <p className="text-xs text-gray-400 capitalize">{withdraw.pix_type}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(withdraw.status)}
                      {withdraw.reject_reason && (
                        <p className="text-xs text-red-400 mt-1 max-w-[200px] truncate" title={withdraw.reject_reason}>
                          {withdraw.reject_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">
                      <p>{new Date(withdraw.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs">{new Date(withdraw.created_at).toLocaleTimeString('pt-BR')}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {withdraw.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => openModal(withdraw, 'approve')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors text-sm"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => openModal(withdraw, 'reject')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              Rejeitar
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            {withdraw.status === 'approved' ? 'Processado' : 'Finalizado'}
                          </span>
                        )}
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
      {showModal && selectedWithdraw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-gray-800 rounded-xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {modalAction === 'approve' ? 'Aprovar Saque' : 'Rejeitar Saque'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Withdraw Info */}
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Usuário</span>
                  <span className="text-white font-medium">{selectedWithdraw.user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Valor</span>
                  <span className="text-xl font-bold text-green-400">
                    R$ {parseFloat(selectedWithdraw.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chave PIX</span>
                  <span className="text-white">{selectedWithdraw.pix_key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo</span>
                  <span className="text-white capitalize">{selectedWithdraw.pix_type}</span>
                </div>
              </div>

              {modalAction === 'approve' ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-green-400 font-medium">Confirmar aprovação?</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Ao aprovar, o saque será marcado como concluído. Certifique-se de que o pagamento PIX foi realizado.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-red-400 font-medium">Rejeitar saque?</p>
                        <p className="text-sm text-gray-400 mt-1">
                          O valor será devolvido ao saldo do usuário automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Motivo da Rejeição *</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Informe o motivo da rejeição..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              {modalAction === 'approve' ? (
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-400 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {processing ? 'Processando...' : 'Confirmar Aprovação'}
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  <XCircleIcon className="w-5 h-5" />
                  {processing ? 'Processando...' : 'Confirmar Rejeição'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

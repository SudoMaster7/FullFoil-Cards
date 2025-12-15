import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin, Loader2, Copy, Send } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Sales() {
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [shippingModal, setShippingModal] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchSummary();
  }, [statusFilter]);

  const fetchSales = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/market/sales/${params}`);
      const data = response.data.results || response.data || [];
      setSales(data);
    } catch (err) {
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/market/sales/summary/');
      setSummary(response.data);
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
    }
  };

  const handleMarkShipped = async (saleId) => {
    setProcessing(true);
    try {
      await api.post(`/market/sales/${saleId}/ship/`, {
        tracking_code: trackingCode
      });
      toast.success('Envio registrado com sucesso!');
      setShippingModal(null);
      setTrackingCode('');
      fetchSales();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao registrar envio');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Endereço copiado!');
  };

  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': { label: 'Aguardando Envio', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
      'PREPARING': { label: 'Preparando', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Package },
      'SHIPPED': { label: 'Enviado', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Truck },
      'DELIVERED': { label: 'Entregue', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
      'RECEIVED': { label: 'Recebido', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
      'CANCELLED': { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20', icon: Clock },
    };
    return configs[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Package className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Minhas Vendas</h1>
            <p className="text-gray-400 text-sm">Gerencie seus envios</p>
          </div>
        </div>

        {/* Resumo */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">Aguardando Envio</p>
              <p className="text-2xl font-bold text-yellow-400">{summary.pending}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">Enviados</p>
              <p className="text-2xl font-bold text-cyan-400">{summary.shipped}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">Recebidos</p>
              <p className="text-2xl font-bold text-green-400">{summary.received}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">Total Vendido</p>
              <p className="text-2xl font-bold text-yellow-500">R$ {summary.total_amount?.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !statusFilter ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'PENDING' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Aguardando Envio
          </button>
          <button
            onClick={() => setStatusFilter('SHIPPED')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'SHIPPED' ? 'bg-cyan-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Enviados
          </button>
          <button
            onClick={() => setStatusFilter('RECEIVED')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'RECEIVED' ? 'bg-green-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Recebidos
          </button>
        </div>

        {/* Lista de Vendas */}
        {sales.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              {statusFilter ? 'Nenhuma venda com esse status' : 'Nenhuma venda ainda'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => {
              const statusConfig = getStatusConfig(sale.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={sale.id} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex gap-4">
                    <img
                      src={sale.card_image}
                      alt={sale.card_name}
                      className="w-20 h-28 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-white">{sale.card_name}</h3>
                          <p className="text-sm text-gray-400">Comprador: {sale.buyer_username}</p>
                          <p className="text-sm text-gray-400">Pedido: #{sale.order_id?.slice(0, 8)}</p>
                          <p className="text-sm text-gray-400">Quantidade: {sale.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-500 font-bold">
                            R$ {Number(sale.total_price).toFixed(2)}
                          </p>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Endereço de envio */}
                      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium">Enviar para:</span>
                            </div>
                            <p className="text-sm text-gray-300">{sale.shipping_address?.name}</p>
                            <p className="text-xs text-gray-400">
                              {sale.shipping_address?.street}, {sale.shipping_address?.number}
                              {sale.shipping_address?.complement && ` - ${sale.shipping_address?.complement}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {sale.shipping_address?.neighborhood} - {sale.shipping_address?.city}/{sale.shipping_address?.state}
                            </p>
                            <p className="text-xs text-gray-500">CEP: {sale.shipping_address?.cep}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(
                              `${sale.shipping_address?.name}\n${sale.shipping_address?.street}, ${sale.shipping_address?.number}${sale.shipping_address?.complement ? ` - ${sale.shipping_address?.complement}` : ''}\n${sale.shipping_address?.neighborhood}\n${sale.shipping_address?.city}/${sale.shipping_address?.state}\nCEP: ${sale.shipping_address?.cep}`
                            )}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Copiar endereço"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Código de rastreio já enviado */}
                      {sale.tracking_code && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-cyan-400" />
                          <span className="text-gray-400">Rastreio:</span>
                          <span className="font-mono text-cyan-400">{sale.tracking_code}</span>
                        </div>
                      )}

                      {/* Botão de marcar como enviado */}
                      {sale.status === 'PENDING' && (
                        <button
                          onClick={() => setShippingModal(sale)}
                          className="mt-3 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Marcar como Enviado
                        </button>
                      )}

                      {sale.status === 'RECEIVED' && sale.received_at && (
                        <p className="mt-3 text-sm text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Recebido pelo comprador em {new Date(sale.received_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Envio */}
        {shippingModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Registrar Envio</h3>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Carta: <span className="text-white">{shippingModal.card_name}</span></p>
                <p className="text-gray-400 text-sm">Comprador: <span className="text-white">{shippingModal.buyer_username}</span></p>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Código de Rastreio (opcional)
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Ex: BR123456789BR"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O código de rastreio dos Correios será mostrado ao comprador
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShippingModal(null);
                    setTrackingCode('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleMarkShipped(shippingModal.id)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      Confirmar Envio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

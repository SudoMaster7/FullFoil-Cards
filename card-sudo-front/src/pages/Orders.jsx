import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, MapPin, ChevronLeft, Loader2, Copy, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

// Componente para listar todos os pedidos
export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/market/orders/');
      const data = response.data.results || response.data || [];
      setOrders(data);
    } catch (err) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'PENDING_PAYMENT': { label: 'Aguardando Pagamento', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
      'PAID': { label: 'Pago', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: CheckCircle },
      'PREPARING': { label: 'Preparando Envio', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Package },
      'SHIPPED': { label: 'Enviado', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Truck },
      'DELIVERED': { label: 'Entregue', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
      'RECEIVED': { label: 'Recebido', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
      'CANCELLED': { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20', icon: Clock },
      'DISPUTED': { label: 'Em Disputa', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Clock },
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Package className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meus Pedidos</h1>
            <p className="text-gray-400 text-sm">Acompanhe suas compras</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum pedido encontrado</p>
            <Link
              to="/"
              className="inline-block mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
            >
              Explorar Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-400">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {order.items?.slice(0, 4).map((item, idx) => (
                      <img
                        key={idx}
                        src={item.card_image}
                        alt={item.card_name}
                        className="w-16 h-24 object-cover rounded flex-shrink-0"
                      />
                    ))}
                    {order.items?.length > 4 && (
                      <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-sm">+{order.items.length - 4}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                    <span className="text-sm text-gray-400">{order.items?.length || 0} item(ns)</span>
                    <span className="text-lg font-bold text-yellow-500">
                      R$ {Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para detalhes de um pedido específico
export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/market/orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      toast.error('Pedido não encontrado');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const confirmReceived = async (itemId) => {
    setConfirming(itemId);
    try {
      await api.post(`/market/orders/items/${itemId}/received/`);
      toast.success('Recebimento confirmado!');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao confirmar recebimento');
    } finally {
      setConfirming(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const getItemStatusConfig = (status) => {
    const configs = {
      'PENDING': { label: 'Aguardando Envio', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
      'PREPARING': { label: 'Preparando', color: 'text-purple-400', bg: 'bg-purple-500/20' },
      'SHIPPED': { label: 'Enviado', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
      'DELIVERED': { label: 'Entregue', color: 'text-green-400', bg: 'bg-green-500/20' },
      'RECEIVED': { label: 'Recebido', color: 'text-green-400', bg: 'bg-green-500/20' },
      'CANCELLED': { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20' },
    };
    return configs[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-500/20' };
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar aos pedidos
        </button>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
              <p className="text-sm text-gray-400">
                {new Date(order.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className="text-2xl font-bold text-yellow-500">
              R$ {Number(order.total).toFixed(2)}
            </span>
          </div>

          {/* Endereço de entrega */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Endereço de Entrega</span>
            </div>
            <p className="text-gray-300">{order.shipping_name}</p>
            <p className="text-sm text-gray-400">
              {order.shipping_street}, {order.shipping_number}
              {order.shipping_complement && ` - ${order.shipping_complement}`}
            </p>
            <p className="text-sm text-gray-400">
              {order.shipping_neighborhood} - {order.shipping_city}/{order.shipping_state}
            </p>
            <p className="text-sm text-gray-500">CEP: {order.shipping_cep}</p>
          </div>
        </div>

        {/* Itens do pedido */}
        <h2 className="text-lg font-semibold mb-4">Itens do Pedido</h2>
        <div className="space-y-4">
          {order.items?.map((item) => {
            const statusConfig = getItemStatusConfig(item.status);
            
            return (
              <div key={item.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex gap-4">
                  <img
                    src={item.card_image}
                    alt={item.card_name}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white">{item.card_name}</h3>
                        <p className="text-sm text-gray-400">Vendedor: {item.seller_username}</p>
                        <p className="text-sm text-gray-400">Condição: {item.condition}</p>
                        <p className="text-sm text-gray-400">Quantidade: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-500 font-bold">
                          R$ {Number(item.total_price).toFixed(2)}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Código de rastreio */}
                    {item.tracking_code && (
                      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400">Código de Rastreio</p>
                            <p className="font-mono text-yellow-400">{item.tracking_code}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(item.tracking_code)}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title="Copiar"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <a
                              href={`https://www.linkcorreios.com.br/?id=${item.tracking_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title="Rastrear"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botão de confirmar recebimento */}
                    {(item.status === 'SHIPPED' || item.status === 'DELIVERED') && (
                      <button
                        onClick={() => confirmReceived(item.id)}
                        disabled={confirming === item.id}
                        className="mt-3 w-full py-2 bg-green-500 hover:bg-green-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {confirming === item.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Confirmando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Confirmar Recebimento
                          </>
                        )}
                      </button>
                    )}

                    {item.status === 'RECEIVED' && item.received_at && (
                      <p className="mt-3 text-sm text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Recebido em {new Date(item.received_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Orders;

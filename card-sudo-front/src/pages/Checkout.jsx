import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, CreditCard, Loader2, Plus, ChevronLeft, Package, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, clearCart, total } = useCart();
  const { wallet, refreshWallet, isAuthenticated } = useAuth();
  const toast = useToast();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, [cartItems, navigate, isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/market/addresses/');
      const data = response.data.results || response.data || [];
      setAddresses(data);
      // Seleciona o endereço padrão automaticamente
      const defaultAddr = data.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (data.length > 0) {
        setSelectedAddress(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar endereços:', err);
      toast.error('Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const hasBalance = Number(wallet?.balance || 0) >= total;

  const handleCheckout = async () => {
    if (!selectedAddress) {
      toast.error('Selecione um endereço de entrega');
      return;
    }

    if (!hasBalance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      const listingIds = cartItems.map(item => item.id);

      const response = await api.post('/market/checkout/', {
        address_id: selectedAddress,
        listing_ids: listingIds
      });

      toast.success('Pedido realizado com sucesso! 🎉');
      clearCart();
      await refreshWallet();
      navigate(`/orders/${response.data.order_id}`);
    } catch (err) {
      const message = err.response?.data?.error || 'Erro ao processar pedido';
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 pb-24">
      {/* Header */}
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar ao carrinho
      </button>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" />
        Finalizar Pedido
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Endereço de Entrega */}
          <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Endereço de Entrega</h2>
              </div>
              <button
                onClick={() => navigate('/addresses')}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Gerenciar
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">Nenhum endereço cadastrado</p>
                <button
                  onClick={() => navigate('/addresses')}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                >
                  Adicionar Endereço
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAddress === address.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddress === address.id}
                        onChange={() => setSelectedAddress(address.id)}
                        className="mt-1 w-4 h-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium">{address.name}</span>
                          {address.is_default && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                        </p>
                        <p className="text-sm text-gray-400">
                          {address.neighborhood} - {address.city}/{address.state}
                        </p>
                        <p className="text-sm text-gray-500">CEP: {address.cep}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Itens do Pedido */}
          <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Itens do Pedido ({cartItems.length})</h2>
            </div>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="w-14 h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        🃏
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-400">Vendedor: @{item.seller}</p>
                    <p className="text-xs text-gray-400">Condição: {item.condition_display || item.condition}</p>
                    <p className="text-xs text-gray-400">Qtd: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-primary font-bold text-sm">
                      🪙 {(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-800 sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Itens ({cartItems.length})</span>
                <span>🪙 {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Frete</span>
                <span className="text-green-400">A combinar*</span>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">🪙 {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Saldo */}
            <div className={`p-3 rounded-lg mb-4 ${hasBalance ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Seu saldo</span>
                <span className={`font-bold ${hasBalance ? 'text-green-400' : 'text-red-400'}`}>
                  🪙 {Number(wallet?.balance || 0).toFixed(2)}
                </span>
              </div>
              {!hasBalance && (
                <p className="text-xs text-red-400 mt-2">
                  Saldo insuficiente. Deposite mais tokens para continuar.
                </p>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing || !hasBalance || !selectedAddress || addresses.length === 0}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Confirmar Pedido
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              * O frete será combinado diretamente com cada vendedor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

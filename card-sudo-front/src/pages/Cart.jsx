import React, { useState } from 'react';
import { Trash2, ArrowRight, ShoppingBag, Loader2, AlertCircle, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart, total, updateQuantity } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Faça login para continuar', 'Autenticação necessária');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Adicione itens ao carrinho primeiro', 'Carrinho vazio');
      return;
    }

    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 px-4">
        <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-20" />
        <p className="text-base sm:text-lg font-medium">Seu carrinho está vazio</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Voltar para o Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 pb-40">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
        Carrinho
      </h1>

      <div className="space-y-3 sm:space-y-4 mb-8">
        {cartItems.map((item) => (
          <div key={item.id} className="bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-800 flex gap-3 sm:gap-4 items-center">
            <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-800 rounded flex-shrink-0 overflow-hidden">
               {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 bg-gray-800">
                    IMG
                  </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xs sm:text-sm truncate">{item.name}</h3>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{item.condition_display || item.condition}</p>
              <p className="text-primary font-bold text-sm mt-1">🪙 {Number(item.price).toFixed(2)}</p>
              
              {/* Quantidade - só mostrar se o item suportar múltiplas quantidades */}
              {item.available_quantity > 1 && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity && updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                    className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity || 1}</span>
                  <button
                    onClick={() => updateQuantity && updateQuantity(item.id, Math.min(item.available_quantity, (item.quantity || 1) + 1))}
                    className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-gray-500">/{item.available_quantity} disp.</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-gray-500 hover:text-red-500 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer Fixo de Checkout */}
      <div className="fixed bottom-16 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 p-3 sm:p-4 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-end mb-3 sm:mb-4">
            <span className="text-gray-400 text-xs sm:text-sm">Total ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})</span>
            <span className="text-xl sm:text-2xl font-bold text-white">🪙 {total.toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm sm:text-base"
          >
            Finalizar Compra
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

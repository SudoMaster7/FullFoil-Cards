import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShoppingCart, User, LogIn, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { cartItems } = useCart();
  const { wallet, isAuthenticated, user, loading } = useAuth();

  // Usa o saldo real da carteira ou 0 se não autenticado
  const balance = Number(wallet?.balance) || 0;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 z-50">
      <Link to="/" className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
        FullFoil
      </Link>

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-20 h-6 bg-gray-800 rounded-full animate-pulse" />
        ) : isAuthenticated ? (
          <>
            {/* Admin Link */}
            {user?.is_staff && (
              <Link 
                to="/admin" 
                className="p-2 text-yellow-500 hover:text-yellow-400 transition-colors"
                title="Painel Admin"
              >
                <Shield className="w-5 h-5" />
              </Link>
            )}

            <Link to="/wallet" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors border border-gray-700">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm text-yellow-400">
                {balance.toFixed(2)}
              </span>
            </Link>

            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItems.length}
                </span>
              )}
            </Link>

            <Link 
              to="/profile" 
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold hover:opacity-90 transition-opacity"
              title={user?.username || 'Perfil'}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Link>
          </>
        ) : (
          <Link 
            to="/login" 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-full transition-colors text-sm font-medium"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

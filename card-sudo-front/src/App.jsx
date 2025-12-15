import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Wallet from './pages/Wallet';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import CardViewer from './pages/CardViewer';
import CardViewer3D from './pages/CardViewer3D';
import Login from './pages/Login';
import Register from './pages/Register';
import Sell from './pages/Sell';
import Profile from './pages/Profile';
import MyCards from './pages/MyCards';
import MyListings from './pages/MyListings';
import Addresses from './pages/Addresses';
import Checkout from './pages/Checkout';
import { Orders, OrderDetail } from './pages/Orders';
import Sales from './pages/Sales';
import {
  AdminLayout,
  AdminDashboard,
  AdminUsers,
  AdminWithdraws,
  AdminListings,
  AdminTransactions,
  AdminReports,
  AdminSettings
} from './pages/admin';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Auth Routes (sem Layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Card Viewers (sem Layout) */}
              <Route path="/card/:id" element={<CardViewer />} />
              <Route path="/card3d/:id" element={<CardViewer3D />} />
              
              {/* Rotas com Layout */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/scanner" element={<Layout><Scanner /></Layout>} />
              <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
              <Route path="/wallet" element={<Layout><Wallet /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/sell" element={<Layout><Sell /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/my-cards" element={<Layout><MyCards /></Layout>} />
              <Route path="/my-listings" element={<Layout><MyListings /></Layout>} />
              <Route path="/addresses" element={<Layout><Addresses /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
              <Route path="/orders" element={<Layout><Orders /></Layout>} />
              <Route path="/orders/:id" element={<Layout><OrderDetail /></Layout>} />
              <Route path="/sales" element={<Layout><Sales /></Layout>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="withdraws" element={<AdminWithdraws />} />
                <Route path="listings" element={<AdminListings />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

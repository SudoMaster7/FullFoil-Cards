import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Loader2, Sparkles, Gift, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    referral_code: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Pega código de referral da URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referral_code: refCode }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const result = await register(formData);
    
    if (result.success) {
      navigate('/');
    } else {
      setErrors(result.errors);
    }
    setLoading(false);
  };

  const getErrorMessage = (field) => {
    if (errors[field]) {
      return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    }
    return null;
  };

  const hasReferralCode = formData.referral_code.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-gray-900 to-black">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
            FullFoil
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Marketplace de Cards Yu-Gi-Oh!</p>
      </div>

      {/* Bonus Badge */}
      <div className={`mb-4 px-4 py-2 border rounded-full flex items-center gap-2 ${
        hasReferralCode 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-primary/10 border-primary/30'
      }`}>
        <Gift className={`w-4 h-4 ${hasReferralCode ? 'text-green-400' : 'text-primary'}`} />
        <span className={`text-sm font-medium ${hasReferralCode ? 'text-green-400' : 'text-primary'}`}>
          {hasReferralCode 
            ? 'Ganhe 20 tokens com código de convite!' 
            : 'Ganhe 10 tokens de boas-vindas!'}
        </span>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6 text-center">Criar conta</h2>

        {errors.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {errors.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome de usuário
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:outline-none transition-colors ${
                getErrorMessage('username') ? 'border-red-500' : 'border-gray-700 focus:border-primary'
              }`}
              placeholder="Como quer ser chamado?"
              required
            />
            {getErrorMessage('username') && (
              <p className="mt-1 text-xs text-red-400">{getErrorMessage('username')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:outline-none transition-colors ${
                getErrorMessage('email') ? 'border-red-500' : 'border-gray-700 focus:border-primary'
              }`}
              placeholder="seu@email.com"
              required
            />
            {getErrorMessage('email') && (
              <p className="mt-1 text-xs text-red-400">{getErrorMessage('email')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:outline-none transition-colors pr-12 ${
                  getErrorMessage('password') ? 'border-red-500' : 'border-gray-700 focus:border-primary'
                }`}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {getErrorMessage('password') && (
              <p className="mt-1 text-xs text-red-400">{getErrorMessage('password')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirmar senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:outline-none transition-colors ${
                getErrorMessage('password_confirm') ? 'border-red-500' : 'border-gray-700 focus:border-primary'
              }`}
              placeholder="Digite a senha novamente"
              required
              minLength={6}
            />
            {getErrorMessage('password_confirm') && (
              <p className="mt-1 text-xs text-red-400">{getErrorMessage('password_confirm')}</p>
            )}
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Código de convite (opcional)
            </label>
            <input
              type="text"
              name="referral_code"
              value={formData.referral_code}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl focus:outline-none transition-colors uppercase ${
                getErrorMessage('referral_code') 
                  ? 'border-red-500' 
                  : hasReferralCode 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-gray-700 focus:border-purple-500'
              }`}
              placeholder="Ex: ABC12345"
              maxLength={8}
            />
            {getErrorMessage('referral_code') && (
              <p className="mt-1 text-xs text-red-400">{getErrorMessage('referral_code')}</p>
            )}
            {hasReferralCode && !getErrorMessage('referral_code') && (
              <p className="mt-1 text-xs text-purple-400">+10 tokens extras de bônus!</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Criar conta
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

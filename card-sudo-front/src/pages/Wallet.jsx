import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Coins, ArrowUpRight, ArrowDownLeft, History, Loader2, LogIn, 
  ShoppingBag, Tag, Gift, Users, Copy, Check, X, Clock, 
  CheckCircle, XCircle, AlertCircle, Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Wallet = () => {
  const { isAuthenticated, wallet, refreshWallet, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [referralInfo, setReferralInfo] = useState(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingWithdraws, setLoadingWithdraws] = useState(false);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState('CPF');
  const [pixKey, setPixKey] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchWithdrawHistory();
      fetchReferralInfo();
    }
  }, [isAuthenticated]);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const response = await api.get('/wallet/wallet/transactions/');
      setTransactions(response.data);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  const fetchWithdrawHistory = async () => {
    setLoadingWithdraws(true);
    try {
      const response = await api.get('/wallet/wallet/withdraw/history/');
      setWithdrawHistory(response.data);
    } catch (err) {
      console.error('Erro ao buscar histórico de saques:', err);
    } finally {
      setLoadingWithdraws(false);
    }
  };

  const fetchReferralInfo = async () => {
    setLoadingReferral(true);
    try {
      const response = await api.get('/wallet/referral/');
      setReferralInfo(response.data);
    } catch (err) {
      console.error('Erro ao buscar info de convites:', err);
    } finally {
      setLoadingReferral(false);
    }
  };

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!depositAmount || isNaN(amount) || amount < 10) {
      toast.error('Valor mínimo para depósito é 10 tokens', 'Valor inválido');
      return;
    }

    setDepositing(true);
    try {
      await api.post('/wallet/wallet/deposit/', { amount });
      await refreshWallet();
      fetchTransactions();
      toast.success(`${amount} tokens depositados com sucesso!`, 'Depósito realizado 💰');
      setShowDepositModal(false);
      setDepositAmount('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Não foi possível realizar o depósito';
      toast.error(msg, 'Erro');
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount < 50) {
      toast.error('Valor mínimo para saque é 50 tokens', 'Valor inválido');
      return;
    }
    if (amount > 1000) {
      toast.error('Valor máximo por saque é 1000 tokens', 'Valor inválido');
      return;
    }
    if (!pixKey.trim()) {
      toast.error('Informe sua chave PIX', 'Chave PIX obrigatória');
      return;
    }

    setWithdrawing(true);
    try {
      await api.post('/wallet/wallet/withdraw/', { 
        amount,
        pix_key_type: pixKeyType,
        pix_key: pixKey
      });
      await refreshWallet();
      fetchTransactions();
      fetchWithdrawHistory();
      toast.success('Solicitação de saque enviada! Aguarde aprovação.', 'Saque solicitado 📤');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setPixKey('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Não foi possível realizar o saque';
      toast.error(msg, 'Erro');
    } finally {
      setWithdrawing(false);
    }
  };

  const copyReferralCode = () => {
    if (referralInfo?.code) {
      navigator.clipboard.writeText(referralInfo.code);
      setCopied(true);
      toast.success('Código copiado!', 'Sucesso');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = () => {
    if (referralInfo?.code) {
      const link = `${window.location.origin}/register?ref=${referralInfo.code}`;
      if (navigator.share) {
        navigator.share({
          title: 'FullFoil - Convite',
          text: `Use meu código ${referralInfo.code} e ganhe 10 tokens de bônus!`,
          url: link
        });
      } else {
        navigator.clipboard.writeText(link);
        toast.success('Link copiado!', 'Sucesso');
      }
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-5 h-5" />;
      case 'WITHDRAW':
        return <ArrowUpRight className="w-5 h-5" />;
      case 'PURCHASE':
        return <ShoppingBag className="w-5 h-5" />;
      case 'SALE':
        return <Tag className="w-5 h-5" />;
      case 'BONUS':
      case 'REFERRAL':
        return <Gift className="w-5 h-5" />;
      default:
        return <Coins className="w-5 h-5" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
      case 'SALE':
      case 'BONUS':
      case 'REFERRAL':
        return 'text-green-500 bg-green-500/10';
      case 'WITHDRAW':
      case 'PURCHASE':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getWithdrawStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'COMPLETED':
        return <Check className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getWithdrawStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'APPROVED':
        return 'Aprovado';
      case 'REJECTED':
        return 'Rejeitado';
      case 'COMPLETED':
        return 'Concluído';
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="py-6 flex flex-col items-center justify-center h-[60vh] text-center">
        <Coins className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Faça login para ver sua carteira</h2>
        <p className="text-gray-500 text-sm mb-6">
          Gerencie seus tokens e veja seu histórico de transações.
        </p>
        <Link
          to="/login"
          className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Minha Carteira</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl p-6 border border-amber-500/30 shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Coins className="w-32 h-32" />
        </div>
        
        <p className="text-gray-400 text-sm font-medium mb-1">Olá, {user?.username}!</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold text-white">
            {wallet ? Number(wallet.balance).toFixed(0) : '---'}
          </span>
          <span className="text-xl text-amber-400 font-bold">TOKENS</span>
        </div>
        
        {wallet?.pending_balance > 0 && (
          <p className="text-sm text-yellow-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Number(wallet.pending_balance).toFixed(0)} pendentes
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => setShowDepositModal(true)}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Depositar
          </button>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Sacar
          </button>
        </div>
      </div>

      {/* Referral Card */}
      {referralInfo && (
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-5 border border-purple-500/30 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-lg">Convide e Ganhe!</h3>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">
            Ganhe <span className="text-green-400 font-bold">15 tokens</span> para cada amigo que se cadastrar com seu código!
          </p>
          
          <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Seu código de convite:</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold text-white tracking-wider">
                {referralInfo.code}
              </span>
              <button 
                onClick={copyReferralCode}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button 
                onClick={shareReferralLink}
                className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{referralInfo.uses_count || 0}</p>
              <p className="text-xs text-gray-500">Convites usados</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{referralInfo.total_earned || 0}</p>
              <p className="text-xs text-gray-500">Tokens ganhos</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Transações', icon: History },
          { id: 'withdraws', label: 'Saques', icon: ArrowUpRight },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-amber-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {loadingTx ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(tx.transaction_type)}`}>
                      {getTransactionIcon(tx.transaction_type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${
                    ['DEPOSIT', 'SALE', 'BONUS', 'REFERRAL'].includes(tx.transaction_type)
                      ? 'text-green-500' 
                      : 'text-red-400'
                  }`}>
                    {['DEPOSIT', 'SALE', 'BONUS', 'REFERRAL'].includes(tx.transaction_type) ? '+' : '-'}
                    {Number(tx.amount).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'withdraws' && (
        <div>
          {loadingWithdraws ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : withdrawHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ArrowUpRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum saque solicitado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawHistory.map((w) => (
                <div key={w.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-white">{Number(w.amount).toFixed(0)} tokens</span>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800">
                      {getWithdrawStatusIcon(w.status)}
                      <span className="text-xs font-medium">{getWithdrawStatusText(w.status)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    PIX {w.pix_key_type}: {w.pix_key}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(w.created_at)}</p>
                  {w.rejection_reason && (
                    <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">
                      Motivo: {w.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Depositar Tokens</h2>
              <button onClick={() => setShowDepositModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Quantidade (mín. 10)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="100"
                min="10"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => setDepositAmount(val.toString())}
                  className="py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-400">
                💡 Depósitos são processados instantaneamente (simulação).
              </p>
            </div>
            
            <button
              onClick={handleDeposit}
              disabled={depositing}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {depositing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ArrowDownLeft className="w-5 h-5" />
                  Depositar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Solicitar Saque</h2>
              <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Quantidade (mín. 50, máx. 1000)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="100"
                min="50"
                max="1000"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[50, 100, 250, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => setWithdrawAmount(val.toString())}
                  className="py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Tipo de Chave PIX</label>
              <div className="grid grid-cols-2 gap-2">
                {['CPF', 'EMAIL', 'PHONE', 'RANDOM'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPixKeyType(type)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      pixKeyType === type 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {type === 'PHONE' ? 'Telefone' : type === 'RANDOM' ? 'Aleatória' : type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Chave PIX</label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder={pixKeyType === 'CPF' ? '000.000.000-00' : pixKeyType === 'EMAIL' ? 'email@exemplo.com' : pixKeyType === 'PHONE' ? '+55 11 99999-9999' : 'Chave aleatória'}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-400">
                ⚠️ Saques são analisados manualmente e podem levar até 24h para serem processados.
              </p>
            </div>
            
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {withdrawing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5" />
                  Solicitar Saque
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;

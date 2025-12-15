import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Cog6ToothIcon,
  BanknotesIcon,
  GiftIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function AdminSettings() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [settings, setSettings] = useState({
    // Configurações Gerais
    site_name: 'FullFoil',
    site_description: 'Marketplace de cartas Yu-Gi-Oh TCG',
    maintenance_mode: false,
    
    // Configurações de Carteira
    min_deposit: 10,
    max_deposit: 10000,
    min_withdraw: 20,
    max_withdraw: 5000,
    platform_fee_percent: 5,
    
    // Configurações de Bônus
    welcome_bonus: 5,
    referral_bonus_referrer: 10,
    referral_bonus_referred: 5,
    
    // Configurações de Verificação
    require_verification_for_withdraw: true,
    require_verification_for_sell: false,
    max_unverified_withdraw: 100,
    
    // Notificações
    email_notifications: true,
    notify_new_user: true,
    notify_withdraw_request: true,
    notify_large_transaction: true,
    large_transaction_threshold: 500
  });

  const tabs = [
    { id: 'general', name: 'Geral', icon: Cog6ToothIcon },
    { id: 'wallet', name: 'Carteira', icon: BanknotesIcon },
    { id: 'bonus', name: 'Bônus', icon: GiftIcon },
    { id: 'verification', name: 'Verificação', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notificações', icon: BellIcon }
  ];

  const handleSave = async () => {
    try {
      setSaving(true);
      // Aqui seria a chamada para salvar no backend
      // await api.post('/admin-panel/settings/', settings);
      showSuccess('Configurações salvas com sucesso!');
    } catch (err) {
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400">Gerencie as configurações do sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          <CheckIcon className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-gray-800 rounded-xl p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-800 rounded-xl p-6">
          {/* Geral */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações Gerais</h3>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome do Site</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descrição do Site</label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Modo de Manutenção</p>
                  <p className="text-sm text-gray-400">Desabilitar acesso ao site para usuários</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* Carteira */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações de Carteira</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Depósito Mínimo (R$)</label>
                  <input
                    type="number"
                    value={settings.min_deposit}
                    onChange={(e) => updateSetting('min_deposit', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Depósito Máximo (R$)</label>
                  <input
                    type="number"
                    value={settings.max_deposit}
                    onChange={(e) => updateSetting('max_deposit', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Saque Mínimo (R$)</label>
                  <input
                    type="number"
                    value={settings.min_withdraw}
                    onChange={(e) => updateSetting('min_withdraw', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Saque Máximo (R$)</label>
                  <input
                    type="number"
                    value={settings.max_withdraw}
                    onChange={(e) => updateSetting('max_withdraw', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Taxa da Plataforma (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.platform_fee_percent}
                  onChange={(e) => updateSetting('platform_fee_percent', parseFloat(e.target.value))}
                  className="w-full sm:w-48 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">Porcentagem cobrada sobre cada venda</p>
              </div>
            </div>
          )}

          {/* Bônus */}
          {activeTab === 'bonus' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações de Bônus</h3>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Bônus de Boas-Vindas (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.welcome_bonus}
                  onChange={(e) => updateSetting('welcome_bonus', parseFloat(e.target.value))}
                  className="w-full sm:w-48 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">Valor creditado ao criar uma conta</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bônus para Quem Indica (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.referral_bonus_referrer}
                    onChange={(e) => updateSetting('referral_bonus_referrer', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bônus para Quem é Indicado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.referral_bonus_referred}
                    onChange={(e) => updateSetting('referral_bonus_referred', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Verificação */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações de Verificação</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Verificação para Saque</p>
                    <p className="text-sm text-gray-400">Exigir verificação de conta para sacar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_verification_for_withdraw}
                      onChange={(e) => updateSetting('require_verification_for_withdraw', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Verificação para Vender</p>
                    <p className="text-sm text-gray-400">Exigir verificação de conta para anunciar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_verification_for_sell}
                      onChange={(e) => updateSetting('require_verification_for_sell', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Limite de Saque sem Verificação (R$)</label>
                <input
                  type="number"
                  value={settings.max_unverified_withdraw}
                  onChange={(e) => updateSetting('max_unverified_withdraw', parseFloat(e.target.value))}
                  className="w-full sm:w-48 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">Valor máximo que usuários não verificados podem sacar</p>
              </div>
            </div>
          )}

          {/* Notificações */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações de Notificações</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Notificações por Email</p>
                  <p className="text-sm text-gray-400">Habilitar envio de emails do sistema</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) => updateSetting('email_notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-400">Notificar Admin quando:</p>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_new_user}
                    onChange={(e) => updateSetting('notify_new_user', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-white">Novo usuário registrado</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_withdraw_request}
                    onChange={(e) => updateSetting('notify_withdraw_request', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-white">Nova solicitação de saque</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_large_transaction}
                    onChange={(e) => updateSetting('notify_large_transaction', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-white">Transação de alto valor</span>
                </label>
              </div>

              {settings.notify_large_transaction && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Valor para Notificação (R$)</label>
                  <input
                    type="number"
                    value={settings.large_transaction_threshold}
                    onChange={(e) => updateSetting('large_transaction_threshold', parseFloat(e.target.value))}
                    className="w-full sm:w-48 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Transações acima deste valor serão notificadas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

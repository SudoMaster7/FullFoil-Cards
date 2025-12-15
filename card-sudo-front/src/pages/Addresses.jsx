import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Check, Edit2, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Addresses() {
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/market/addresses/');
      const data = response.data.results || response.data || [];
      setAddresses(data);
    } catch (err) {
      toast.error('Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const searchCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    setSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setSearchingCep(false);
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    setFormData(prev => ({ ...prev, cep: value }));
    
    if (value.replace(/\D/g, '').length === 8) {
      searchCep(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== SUBMITTING ADDRESS ===');
    console.log('Form data:', formData);
    setSaving(true);
    
    try {
      if (editingId) {
        console.log('Updating address:', editingId);
        const response = await api.put(`/market/addresses/${editingId}/`, formData);
        console.log('Update response:', response.data);
        toast.success('Endereço atualizado!');
      } else {
        console.log('Creating new address');
        const response = await api.post('/market/addresses/create/', formData);
        console.log('Create response:', response.data);
        toast.success('Endereço adicionado!');
      }
      
      fetchAddresses();
      resetForm();
    } catch (err) {
      console.error('=== ERROR SAVING ADDRESS ===');
      console.error('Error:', err);
      console.error('Response:', err.response?.data);
      console.error('Status:', err.response?.status);
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Erro ao salvar endereço');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address) => {
    setFormData({
      name: address.name,
      cep: address.cep,
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      is_default: address.is_default
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja remover este endereço?')) return;
    
    try {
      await api.delete(`/market/addresses/${id}/delete/`);
      toast.success('Endereço removido');
      fetchAddresses();
    } catch (err) {
      toast.error('Erro ao remover endereço');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.post(`/market/addresses/${id}/default/`);
      toast.success('Endereço padrão atualizado');
      fetchAddresses();
    } catch (err) {
      toast.error('Erro ao definir endereço padrão');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      is_default: false
    });
    setEditingId(null);
    setShowForm(false);
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <MapPin className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Meus Endereços</h1>
              <p className="text-gray-400 text-sm">Gerencie seus endereços de entrega</p>
            </div>
          </div>
          
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Endereço
            </button>
          )}
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Editar Endereço' : 'Novo Endereço'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do destinatário</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={handleCepChange}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                      placeholder="00000-000"
                      required
                    />
                    {searchingCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500 animate-spin" />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">UF</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                    placeholder="SP"
                    maxLength={2}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="São Paulo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bairro</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Centro"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                    placeholder="Rua das Flores"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Número</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                    placeholder="123"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Complemento (opcional)</label>
                <input
                  type="text"
                  value={formData.complement}
                  onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Apto 101, Bloco A"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-300">Definir como endereço padrão</span>
              </label>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de endereços */}
        {addresses.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum endereço cadastrado</p>
            <p className="text-sm text-gray-500 mt-1">Adicione um endereço para realizar compras</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-gray-800 rounded-xl p-4 border-2 transition-colors ${
                  address.is_default ? 'border-yellow-500/50' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{address.name}</span>
                      {address.is_default && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {address.street}, {address.number}
                      {address.complement && ` - ${address.complement}`}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {address.neighborhood} - {address.city}/{address.state}
                    </p>
                    <p className="text-gray-500 text-sm">CEP: {address.cep}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                        title="Definir como padrão"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

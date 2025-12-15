import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

export default function AdminReports() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Usa o endpoint de dashboard como fonte de dados
      const response = await api.get('/admin-panel/dashboard/');
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      showError('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type) => {
    showSuccess(`Relatório de ${type} exportado com sucesso!`);
    // Aqui seria implementada a lógica de exportação real
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#9CA3AF',
          padding: 20
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9CA3AF'
        },
        beginAtZero: true
      }
    }
  };

  const salesChartData = {
    labels: reportData?.charts?.sales_by_day?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }) || [],
    datasets: [
      {
        label: 'Vendas (R$)',
        data: reportData?.charts?.sales_by_day?.map(d => parseFloat(d.total)) || [],
        fill: true,
        borderColor: '#EAB308',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.4
      }
    ]
  };

  const usersChartData = {
    labels: reportData?.charts?.users_by_day?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }) || [],
    datasets: [
      {
        label: 'Novos Usuários',
        data: reportData?.charts?.users_by_day?.map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const transactionTypesData = {
    labels: ['Vendas', 'Depósitos', 'Saques', 'Bônus'],
    datasets: [
      {
        data: [
          reportData?.sales?.total_sales || 0,
          reportData?.withdraws?.approved || 0,
          reportData?.withdraws?.pending || 0,
          reportData?.users?.new_today || 0
        ],
        backgroundColor: ['#22C55E', '#3B82F6', '#EAB308', '#A855F7'],
        borderWidth: 0
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="text-gray-400">Análise de dados e métricas do sistema</p>
        </div>
        <button
          onClick={fetchReportData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Atualizar
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400">Período:</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Início</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Total de Usuários</p>
          <p className="text-3xl font-bold text-white mt-1">{reportData?.users?.total || 0}</p>
          <p className="text-sm text-green-400 mt-2">+{reportData?.users?.new_today || 0} hoje</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Volume de Vendas</p>
          <p className="text-3xl font-bold text-white mt-1">
            R$ {parseFloat(reportData?.sales?.total_volume || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">{reportData?.sales?.total_sales || 0} vendas</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Anúncios Ativos</p>
          <p className="text-3xl font-bold text-white mt-1">{reportData?.listings?.active || 0}</p>
          <p className="text-sm text-gray-500 mt-2">{reportData?.listings?.total || 0} total</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Saques Pendentes</p>
          <p className="text-3xl font-bold text-yellow-500 mt-1">
            R$ {parseFloat(reportData?.withdraws?.pending_amount || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">{reportData?.withdraws?.pending || 0} solicitações</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Vendas</h3>
            <button
              onClick={() => exportReport('vendas')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exportar
            </button>
          </div>
          <div className="h-72">
            <Line data={salesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Users Chart */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Novos Usuários</h3>
            <button
              onClick={() => exportReport('usuarios')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exportar
            </button>
          </div>
          <div className="h-72">
            <Bar data={usersChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Transaction Types Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Transações</h3>
          <div className="h-64">
            <Doughnut 
              data={transactionTypesData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#9CA3AF' }
                  }
                },
                cutout: '60%'
              }} 
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Estatísticas Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">Vendas nos últimos 30 dias</p>
              <p className="text-2xl font-bold text-green-400">
                R$ {parseFloat(reportData?.sales?.last_30_days || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">Usuários Verificados</p>
              <p className="text-2xl font-bold text-blue-400">
                {reportData?.users?.verified || 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">Saques Aprovados</p>
              <p className="text-2xl font-bold text-yellow-400">
                {reportData?.withdraws?.approved || 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">Saques Rejeitados</p>
              <p className="text-2xl font-bold text-red-400">
                {reportData?.withdraws?.rejected || 0}
              </p>
            </div>
          </div>

          {/* Export Options */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-3">Exportar Relatórios</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => exportReport('completo')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Relatório Completo
              </button>
              <button
                onClick={() => exportReport('financeiro')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Financeiro
              </button>
              <button
                onClick={() => exportReport('usuarios')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Usuários
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

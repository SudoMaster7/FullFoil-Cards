import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  UsersIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin-panel/dashboard/');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Erro</h2>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Dados para gráfico de vendas por dia
  const salesChartData = {
    labels: stats?.charts?.sales_by_day?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }) || [],
    datasets: [
      {
        label: 'Vendas (R$)',
        data: stats?.charts?.sales_by_day?.map(d => parseFloat(d.total)) || [],
        fill: true,
        borderColor: '#EAB308',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#EAB308',
        pointBorderColor: '#EAB308',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // Dados para gráfico de usuários por dia
  const usersChartData = {
    labels: stats?.charts?.users_by_day?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }) || [],
    datasets: [
      {
        label: 'Novos Usuários',
        data: stats?.charts?.users_by_day?.map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // Dados para gráfico de status de saques
  const withdrawsChartData = {
    labels: ['Pendentes', 'Aprovados', 'Rejeitados'],
    datasets: [
      {
        data: [
          stats?.withdraws?.pending || 0,
          stats?.withdraws?.approved || 0,
          stats?.withdraws?.rejected || 0
        ],
        backgroundColor: ['#F59E0B', '#22C55E', '#EF4444'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9CA3AF',
          padding: 20
        }
      }
    },
    cutout: '60%'
  };

  const statCards = [
    {
      name: 'Total de Usuários',
      value: stats?.users?.total || 0,
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-600',
      link: '/admin/users',
      change: `+${stats?.users?.new_today || 0} hoje`
    },
    {
      name: 'Saques Pendentes',
      value: stats?.withdraws?.pending || 0,
      icon: BanknotesIcon,
      color: 'from-yellow-500 to-yellow-600',
      link: '/admin/withdraws',
      change: `R$ ${parseFloat(stats?.withdraws?.pending_amount || 0).toFixed(2)}`,
      urgent: (stats?.withdraws?.pending || 0) > 0
    },
    {
      name: 'Anúncios Ativos',
      value: stats?.listings?.active || 0,
      icon: ShoppingBagIcon,
      color: 'from-green-500 to-green-600',
      link: '/admin/listings',
      change: `${stats?.listings?.total || 0} total`
    },
    {
      name: 'Volume de Vendas',
      value: `R$ ${parseFloat(stats?.sales?.total_volume || 0).toFixed(2)}`,
      icon: ArrowsRightLeftIcon,
      color: 'from-purple-500 to-purple-600',
      link: '/admin/transactions',
      change: `${stats?.sales?.total_sales || 0} vendas`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Visão geral do sistema FullFoil</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className={`relative overflow-hidden rounded-xl bg-gray-800 p-5 hover:bg-gray-750 transition-colors group ${
              stat.urgent ? 'ring-2 ring-yellow-500/50' : ''
            }`}
          >
            {stat.urgent && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Vendas nos últimos 30 dias</h3>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <ArrowTrendingUpIcon className="w-4 h-4" />
              <span>R$ {parseFloat(stats?.sales?.last_30_days || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="h-72">
            <Line data={salesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Withdraws Status Chart */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Status dos Saques</h3>
          <div className="h-72">
            <Doughnut data={withdrawsChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Users Chart */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Novos Usuários</h3>
            <span className="text-sm text-gray-400">Últimos 30 dias</span>
          </div>
          <div className="h-64">
            <Bar data={usersChartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats?.recent_activity?.length > 0 ? (
              stats.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'sale' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'withdraw' ? 'bg-yellow-500/20 text-yellow-400' :
                    activity.type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {activity.type === 'sale' && <ShoppingBagIcon className="w-4 h-4" />}
                    {activity.type === 'withdraw' && <BanknotesIcon className="w-4 h-4" />}
                    {activity.type === 'user' && <UsersIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhuma atividade recente</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/withdraws?status=pending"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="p-3 rounded-full bg-yellow-500/20">
              <ClockIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-sm text-gray-300 text-center">Ver Saques Pendentes</span>
          </Link>
          <Link
            to="/admin/users?status=unverified"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="p-3 rounded-full bg-blue-500/20">
              <UsersIcon className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm text-gray-300 text-center">Usuários não Verificados</span>
          </Link>
          <Link
            to="/admin/listings?status=active"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="p-3 rounded-full bg-green-500/20">
              <ShoppingBagIcon className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm text-gray-300 text-center">Anúncios Ativos</span>
          </Link>
          <Link
            to="/admin/transactions"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="p-3 rounded-full bg-purple-500/20">
              <ArrowsRightLeftIcon className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-sm text-gray-300 text-center">Ver Transações</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

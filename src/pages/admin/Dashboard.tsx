import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  completedModules: number;
  checkinsThisMonth: number;
  meditationsThisMonth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    completedModules: 0,
    checkinsThisMonth: 0,
    meditationsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        { count: totalUsers },
        { count: activeSubscriptions },
        { count: completedModules },
        { count: checkinsThisMonth },
        { count: meditationsThisMonth }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('progress').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('checkins').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        supabase.from('meditation_sessions').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString())
      ]);

      const totalRevenue = (activeSubscriptions || 0) * 15;

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue,
        completedModules: completedModules || 0,
        checkinsThisMonth: checkinsThisMonth || 0,
        meditationsThisMonth: meditationsThisMonth || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      trend: '+12% ce mois'
    },
    {
      title: 'Abonnements actifs',
      value: stats.activeSubscriptions,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      trend: '+8% ce mois'
    },
    {
      title: 'Revenu mensuel',
      value: `${stats.totalRevenue}€`,
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
      trend: 'MRR estimé'
    },
    {
      title: 'Modules complétés',
      value: stats.completedModules,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      trend: 'Total'
    }
  ];

  const activityStats = [
    {
      title: 'Check-ins ce mois',
      value: stats.checkinsThisMonth,
      icon: Calendar
    },
    {
      title: 'Méditations ce mois',
      value: stats.meditationsThisMonth,
      icon: Calendar
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre plateforme Nirava</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl shadow-lg p-6 text-white`}
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8" />
                <span className="text-sm opacity-90">{stat.trend}</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm opacity-90">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {activityStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-gray-600">{stat.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
            >
              <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Gérer les utilisateurs</p>
            </a>
            <a
              href="/admin/content"
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
            >
              <BookOpen className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Gérer le contenu</p>
            </a>
            <a
              href="/admin/subscriptions"
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
            >
              <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Gérer les abonnements</p>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

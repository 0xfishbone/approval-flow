/**
 * Dashboard Page
 * Role-specific dashboard with stats and recent activity
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
  ArrowRight,
  type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRequestStore } from '@/store/requestStore';
import { UserRole, RequestStatus } from '@/types';
import RequestCard from '@/components/ui/RequestCard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { requests, fetchRequests } = useRequestStore();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const pending = requests.filter((r) => r.status === RequestStatus.PENDING || r.status === RequestStatus.IN_PROGRESS).length;
    const approved = requests.filter((r) => r.status === RequestStatus.APPROVED).length;
    const rejected = requests.filter((r) => r.status === RequestStatus.REJECTED).length;

    setStats({
      pending,
      approved,
      rejected,
      total: requests.length,
    });
  }, [requests]);

  const recentRequests = requests.slice(0, 5);

  interface StatCardProps {
    label: string;
    value: number;
    Icon: LucideIcon;
    colorScheme: {
      bg: string;
      iconBg: string;
      iconColor: string;
      textColor: string;
    };
  }

  const StatCard = ({ label, value, Icon, colorScheme }: StatCardProps) => (
    <div
      className={`
        relative overflow-hidden rounded-2xl border
        ${colorScheme.bg}
        p-6 shadow-sm hover:shadow-md transition-all duration-200
        group cursor-default
      `}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${colorScheme.iconBg} opacity-10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-300`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorScheme.iconBg}`}>
            <Icon size={24} className={colorScheme.iconColor} strokeWidth={2} aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-3xl font-bold ${colorScheme.textColor} tabular-nums`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Bonjour, {user?.firstName}!
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          {user?.role === UserRole.STAFF && 'Gérez vos demandes et suivez leur progression'}
          {user?.role === UserRole.MANAGER && 'Approuvez les demandes de votre équipe'}
          {user?.role === UserRole.CONTROLEUR && 'Vérifiez les demandes en attente'}
          {user?.role === UserRole.DIRECTION && 'Supervisez les approbations stratégiques'}
          {user?.role === UserRole.ECONOME && 'Validez les demandes finales'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6 mb-8">
        {/* Pending card - dominant with gradient */}
        <div className="sm:col-span-6 lg:col-span-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Clock size={28} className="text-white" strokeWidth={2} aria-hidden="true" />
                </div>
                <ArrowRight size={24} className="text-white/80 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-white/90">En attente</p>
                <p className="text-4xl font-bold text-white tabular-nums">
                  {stats.pending}
                </p>
                <p className="text-sm text-white/80 mt-2">Nécessitent votre attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Other cards - smaller */}
        <div className="sm:col-span-2 lg:col-span-2">
          <StatCard
            label="Approuvées"
            value={stats.approved}
            Icon={CheckCircle2}
            colorScheme={{
              bg: 'bg-white border-emerald-200',
              iconBg: 'bg-emerald-100',
              iconColor: 'text-emerald-600',
              textColor: 'text-emerald-600'
            }}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <StatCard
            label="Rejetées"
            value={stats.rejected}
            Icon={XCircle}
            colorScheme={{
              bg: 'bg-white border-red-200',
              iconBg: 'bg-red-100',
              iconColor: 'text-red-600',
              textColor: 'text-red-600'
            }}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <StatCard
            label="Total"
            value={stats.total}
            Icon={FileText}
            colorScheme={{
              bg: 'bg-white border-primary-200',
              iconBg: 'bg-primary-100',
              iconColor: 'text-primary-600',
              textColor: 'text-primary-600'
            }}
          />
        </div>
      </div>

      {/* Recent requests */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Demandes récentes</h2>
          <Link
            to="/requests"
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base group transition-colors min-h-[48px] px-2"
          >
            <span>Voir tout</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
          </Link>
        </div>

        {recentRequests.length > 0 ? (
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText size={32} className="text-gray-400" aria-hidden="true" />
            </div>
            <p className="text-gray-600 mb-4 text-base sm:text-lg font-medium">Aucune demande pour le moment</p>
            {user?.role === UserRole.STAFF && (
              <Link
                to="/requests/new"
                className="btn btn-primary inline-flex"
              >
                <Plus size={20} aria-hidden="true" />
                <span>Créer une demande</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {user?.role === UserRole.STAFF && recentRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/requests/new"
              className="btn btn-primary justify-center"
            >
              <Plus size={20} aria-hidden="true" />
              <span>Nouvelle demande</span>
            </Link>
            <Link
              to="/requests"
              className="btn btn-secondary justify-center"
            >
              <FileText size={20} aria-hidden="true" />
              <span>Mes demandes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

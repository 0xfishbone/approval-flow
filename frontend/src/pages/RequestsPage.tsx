/**
 * Requests Page
 * List all requests with filtering
 */

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Loader2, FileText } from 'lucide-react';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { RequestStatus, UserRole } from '@/types';
import RequestCard from '@/components/ui/RequestCard';

export default function RequestsPage() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { requests, fetchRequests, isLoading } = useRequestStore();
  const [filter, setFilter] = useState<RequestStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, location.key]); // Refetch when navigating back to this page

  const filteredRequests = filter === 'ALL'
    ? requests
    : requests.filter((r) => r.status === filter);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Demandes</h1>
          <p className="text-sm sm:text-base text-gray-600">{filteredRequests.length} demande(s)</p>
        </div>

        {user?.role === UserRole.STAFF && (
          <Link to="/requests/new" className="btn btn-primary justify-center sm:justify-start">
            <Plus size={20} aria-hidden="true" />
            <span>Nouvelle demande</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 scrollbar-hide">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-5 py-3 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ${
            filter === 'ALL'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter(RequestStatus.PENDING)}
          className={`px-5 py-3 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ${
            filter === RequestStatus.PENDING
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter(RequestStatus.IN_PROGRESS)}
          className={`px-5 py-3 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ${
            filter === RequestStatus.IN_PROGRESS
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
          }`}
        >
          En cours
        </button>
        <button
          onClick={() => setFilter(RequestStatus.APPROVED)}
          className={`px-5 py-3 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ${
            filter === RequestStatus.APPROVED
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
          }`}
        >
          Approuvées
        </button>
        <button
          onClick={() => setFilter(RequestStatus.REJECTED)}
          className={`px-5 py-3 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200 ${
            filter === RequestStatus.REJECTED
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
          }`}
        >
          Rejetées
        </button>
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 mb-4">
            <Loader2 size={32} className="text-primary-600 animate-spin" aria-hidden="true" />
          </div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FileText size={32} className="text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-gray-600 text-base sm:text-lg font-medium mb-2">Aucune demande trouvée</p>
          <p className="text-gray-500 text-sm">
            {filter === 'ALL' ? 'Créez votre première demande' : 'Essayez un autre filtre'}
          </p>
        </div>
      )}
    </div>
  );
}

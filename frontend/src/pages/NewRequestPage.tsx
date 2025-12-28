/**
 * New Request Page
 * Form to create a new approval request
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  Zap,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import type { RequestItem } from '@/types';

interface FormItem extends RequestItem {
  tempId: string;
}

type Urgency = 'flexible' | 'normal' | 'urgent';
type Category = 'alimentation' | 'equipement' | 'fournitures' | 'services' | 'autre';

export default function NewRequestPage() {
  const { user } = useAuthStore();
  const { createRequest } = useRequestStore();
  const navigate = useNavigate();

  const [items, setItems] = useState<FormItem[]>([
    { tempId: '1', description: '', quantity: 1, unit: '', estimatedCost: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [category, setCategory] = useState<Category>('fournitures');
  const [neededByDate, setNeededByDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => {
    setItems([
      ...items,
      { tempId: Date.now().toString(), description: '', quantity: 1, unit: '', estimatedCost: 0 },
    ]);
  };

  const removeItem = (tempId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.tempId !== tempId));
    }
  };

  const updateItem = (tempId: string, field: keyof RequestItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.tempId === tempId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const hasEmptyDescription = items.some((item) => !item.description.trim());
    if (hasEmptyDescription) {
      setError('Toutes les descriptions d\'articles sont requises');
      return;
    }

    const hasInvalidQuantity = items.some((item) => item.quantity <= 0);
    if (hasInvalidQuantity) {
      setError('Les quantités doivent être supérieures à zéro');
      return;
    }

    const hasInvalidCost = items.some((item) => !item.estimatedCost || item.estimatedCost <= 0);
    if (hasInvalidCost) {
      setError('Le coût estimé est requis pour tous les articles');
      return;
    }

    setIsLoading(true);

    try {
      // Remove tempId before sending
      const cleanItems: RequestItem[] = items.map(({ tempId, ...item }) => item);

      const request = await createRequest({
        departmentId: user!.departmentId,
        items: cleanItems,
        notes: notes.trim() || undefined,
      });

      navigate(`/requests/${request.id}`);
    } catch (err) {
      setError('Erreur lors de la création de la demande');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouvelle demande</h1>
        <p className="text-gray-600">Créez une demande d'approbation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Request Details */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Détails de la demande</h2>

          {/* Urgency */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Urgence *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setUrgency('flexible')}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                  ${urgency === 'flexible'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <Clock size={20} className={urgency === 'flexible' ? 'text-primary-600' : 'text-gray-400'} aria-hidden="true" />
                <span className={`font-medium text-sm ${urgency === 'flexible' ? 'text-primary-900' : 'text-gray-700'}`}>
                  Flexible
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                  ${urgency === 'normal'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <AlertCircle size={20} className={urgency === 'normal' ? 'text-primary-600' : 'text-gray-400'} aria-hidden="true" />
                <span className={`font-medium text-sm ${urgency === 'normal' ? 'text-primary-900' : 'text-gray-700'}`}>
                  Normal
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                  ${urgency === 'urgent'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <Zap size={20} className={urgency === 'urgent' ? 'text-orange-600' : 'text-gray-400'} aria-hidden="true" />
                <span className={`font-medium text-sm ${urgency === 'urgent' ? 'text-orange-900' : 'text-gray-700'}`}>
                  Urgent
                </span>
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="input pr-10 appearance-none"
                required
              >
                <option value="alimentation">🍴 Alimentation</option>
                <option value="equipement">🔧 Équipement</option>
                <option value="fournitures">📦 Fournitures</option>
                <option value="services">🤝 Services</option>
                <option value="autre">⋯ Autre</option>
              </select>
            </div>
          </div>

          {/* Needed By Date */}
          <div>
            <label htmlFor="neededByDate" className="block text-sm font-medium text-gray-700 mb-2">
              Date souhaitée
            </label>
            <div className="relative">
              <input
                id="neededByDate"
                type="date"
                value={neededByDate}
                onChange={(e) => setNeededByDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input"
              />
              <CalendarIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Articles</h2>
            <button type="button" onClick={addItem} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              + Ajouter un article
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.tempId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Article {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.tempId)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕ Supprimer
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.tempId, 'description', e.target.value)}
                      className="input"
                      placeholder="Ex: Ordinateur portable Dell XPS 15"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.tempId, 'quantity', parseInt(e.target.value))}
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unité
                      </label>
                      <input
                        type="text"
                        value={item.unit || ''}
                        onChange={(e) => updateItem(item.tempId, 'unit', e.target.value)}
                        className="input"
                        placeholder="Ex: pcs, kg"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coût estimé (FCFA) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.estimatedCost || ''}
                        onChange={(e) => updateItem(item.tempId, 'estimatedCost', parseFloat(e.target.value))}
                        className="input"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Notes (optionnel)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Ajoutez des informations supplémentaires sur cette demande..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Création...' : 'Créer la demande'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="btn btn-secondary"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

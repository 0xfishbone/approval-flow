/**
 * ApprovalModal Component
 * Modal for approving or rejecting requests with digital signature
 */

import { useState } from 'react';
import { X, CheckCircle2, XCircle, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import SignaturePad from '@/components/signature/SignaturePad';
import { UserRole } from '@/types';

interface ApprovalModalProps {
  mode: 'approve' | 'reject';
  requestId: string;
  userRole: UserRole;
  onSubmit: (data: ApprovalData) => Promise<void>;
  onCancel: () => void;
}

export interface ApprovalData {
  digitalSignature: string;
  rejectionReason?: string;
  additionalData?: {
    dailyCost?: number;
    notes?: string;
  };
}

export default function ApprovalModal({
  mode,
  requestId,
  userRole,
  onSubmit,
  onCancel,
}: ApprovalModalProps) {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [dailyCost, setDailyCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprove = mode === 'approve';
  const requiresDailyCost = isApprove && userRole === UserRole.CONTROLEUR;

  const handleSignatureSave = (sig: string) => {
    setSignature(sig);
    setShowSignaturePad(false);
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!signature) {
      setError('La signature est requise');
      return false;
    }

    if (!isApprove && rejectionReason.trim().length < 10) {
      setError('La raison du rejet doit contenir au moins 10 caractères');
      return false;
    }

    if (requiresDailyCost && (!dailyCost || parseFloat(dailyCost) <= 0)) {
      setError('Le coût journalier est requis pour le Contrôleur');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data: ApprovalData = {
        digitalSignature: signature!,
      };

      if (!isApprove) {
        data.rejectionReason = rejectionReason.trim();
      }

      if (isApprove && (dailyCost || notes)) {
        data.additionalData = {};
        if (dailyCost) {
          data.additionalData.dailyCost = parseFloat(dailyCost);
        }
        if (notes) {
          data.additionalData.notes = notes.trim();
        }
      }

      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              {isApprove ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" aria-hidden="true" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle size={20} className="text-red-600" aria-hidden="true" />
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {isApprove ? 'Approuver la demande' : 'Rejeter la demande'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
              aria-label="Fermer"
              disabled={isSubmitting}
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Rejection reason */}
            {!isApprove && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Raison du rejet <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous rejetez cette demande (minimum 10 caractères)..."
                  className="input min-h-[120px] resize-none"
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/10 caractères minimum
                </p>
              </div>
            )}

            {/* Daily cost for Contrôleur */}
            {requiresDailyCost && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Coût journalier (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={dailyCost}
                  onChange={(e) => setDailyCost(e.target.value)}
                  placeholder="Ex: 5000"
                  className="input"
                  disabled={isSubmitting}
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Requis pour les Contrôleurs
                </p>
              </div>
            )}

            {/* Notes (optional for approve) */}
            {isApprove && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes ou commentaires..."
                  className="input min-h-[80px] resize-none"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Signature <span className="text-red-500">*</span>
              </label>

              {signature ? (
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img
                    src={signature}
                    alt="Signature"
                    className="max-h-24 mx-auto"
                  />
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-3 w-full"
                    disabled={isSubmitting}
                  >
                    Modifier la signature
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignaturePad(true)}
                  className="btn btn-secondary w-full justify-center"
                  disabled={isSubmitting}
                >
                  Ajouter une signature
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 rounded-b-2xl">
            <button
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !signature}
              className={`btn ${isApprove ? 'btn-success' : 'btn-danger'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  {isApprove ? (
                    <ThumbsUp size={20} aria-hidden="true" />
                  ) : (
                    <ThumbsDown size={20} aria-hidden="true" />
                  )}
                  <span>{isApprove ? 'Approuver' : 'Rejeter'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setShowSignaturePad(false)}
          existingSignature={signature || undefined}
        />
      )}
    </>
  );
}

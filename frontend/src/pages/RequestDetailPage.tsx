/**
 * Request Detail Page
 * Full request details with timeline and approval actions
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import {
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  User as UserIcon,
  Building2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { Approval, Workflow, Comment, User } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import ApprovalProgress from '@/components/workflow/ApprovalProgress';
import CommentThread from '@/components/comments/CommentThread';
import ApprovalModal, { ApprovalData } from '@/components/approval/ApprovalModal';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentRequest, fetchRequestById } = useRequestStore();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    mode: 'approve' | 'reject';
  }>({ isOpen: false, mode: 'approve' });

  useEffect(() => {
    if (id) {
      loadRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      await fetchRequestById(id);

      // Fetch workflow status
      try {
        const wfData = await api.getWorkflowStatus<any>(id);
        setWorkflowData(wfData);
        setWorkflow(wfData.workflow);
        if (wfData.approvals) {
          setApprovals(wfData.approvals);
        }
      } catch (error) {
        console.log('Workflow endpoint not available yet');
      }

      try {
        const commentsData = await api.get<Comment[]>(`/requests/${id}/comments`);
        setComments(commentsData);

        // Extract unique participants from comments
        const uniqueUsers = new Map<string, User>();
        commentsData.forEach((comment) => {
          if (!uniqueUsers.has(comment.userId)) {
            uniqueUsers.set(comment.userId, comment.user);
          }
        });
        setParticipants(Array.from(uniqueUsers.values()));
      } catch (error) {
        console.log('Comments endpoint not available yet');
      }
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!id) return;

    const newComment = await api.post<Comment>(`/requests/${id}/comments`, {
      content,
    });

    setComments((prev) => [...prev, newComment]);

    // Add to participants if new
    if (!participants.some((p) => p.id === newComment.userId)) {
      setParticipants((prev) => [...prev, newComment.user]);
    }
  };

  const handleApprovalSubmit = async (data: ApprovalData) => {
    if (!id) return;

    try {
      if (approvalModal.mode === 'approve') {
        await api.approveRequest(id, {
          digitalSignature: data.digitalSignature,
          additionalData: data.additionalData,
        });
      } else {
        await api.rejectRequest(id, {
          digitalSignature: data.digitalSignature,
          rejectionReason: data.rejectionReason!,
        });
      }

      // Close modal
      setApprovalModal({ isOpen: false, mode: 'approve' });

      // Reload request data
      await loadRequest();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Échec de l\'opération');
    }
  };

  // Check if current user is the current approver
  const isCurrentApprover =
    user &&
    workflowData?.currentApprover &&
    !workflow?.isComplete &&
    user.id === workflowData.currentApprover.id;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 mb-4">
          <Loader2 size={32} className="text-primary-600 animate-spin" aria-hidden="true" />
        </div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!currentRequest) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <FileText size={32} className="text-gray-400" aria-hidden="true" />
        </div>
        <p className="text-gray-600 text-lg mb-4">Demande introuvable</p>
        <button onClick={() => navigate('/requests')} className="btn btn-primary">
          <ArrowLeft size={20} aria-hidden="true" />
          Retour aux demandes
        </button>
      </div>
    );
  }

  const totalCost = currentRequest.items.reduce(
    (sum, item) => sum + (item.estimatedCost || 0) * item.quantity,
    0
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/requests')}
          className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-2 font-medium transition-colors touch-target"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Retour</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {currentRequest.requestNumber}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Créée le {format(new Date(currentRequest.createdAt), 'PPP', { locale: fr })}
            </p>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={currentRequest.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          {currentRequest.creator && (
            <div className="card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                Informations de la demande
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <UserIcon size={20} className="text-primary-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Demandeur</p>
                    <p className="font-medium text-gray-900">
                      {currentRequest.creator.firstName} {currentRequest.creator.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{currentRequest.creator.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-gray-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Département</p>
                    <p className="font-medium text-gray-900">
                      {currentRequest.creator.departmentName || currentRequest.creator.departmentId || 'Non assigné'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(currentRequest.createdAt), 'PPP', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Articles demandés</h2>
            <div className="space-y-4">
              {currentRequest.items.map((item, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.description}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantité: {item.quantity} {item.unit || 'pcs'}
                      </p>
                    </div>
                    {item.estimatedCost && (
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {(item.estimatedCost * item.quantity).toLocaleString()} FCFA
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.estimatedCost.toLocaleString()} FCFA / {item.unit || 'pcs'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {totalCost > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total estimé</span>
                    <span className="font-bold text-primary-600 text-lg">
                      {totalCost.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {currentRequest.notes && (
            <div className="card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{currentRequest.notes}</p>
            </div>
          )}

          {/* Approval Progress */}
          {workflow && (
            <div className="card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-6">
                Processus d'approbation
              </h2>
              <ApprovalProgress
                approvals={approvals}
                currentStep={workflow.currentStep}
                totalSteps={workflow.totalSteps}
                isComplete={workflow.isComplete}
              />
            </div>
          )}

          {/* Comments */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-6">Commentaires</h2>
            <CommentThread
              comments={comments}
              onAddComment={handleAddComment}
              participants={participants}
              currentUserId={user!.id}
            />
          </div>
        </div>

        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block space-y-4 sm:space-y-6">
          {/* Actions */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {/* Approval actions - only for current approver */}
              {isCurrentApprover && (
                <>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="text-primary-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <p className="text-sm text-primary-700">
                        Cette demande nécessite votre approbation
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setApprovalModal({ isOpen: true, mode: 'approve' })}
                    className="btn btn-success w-full justify-center"
                  >
                    <ThumbsUp size={20} aria-hidden="true" />
                    <span>Approuver</span>
                  </button>

                  <button
                    onClick={() => setApprovalModal({ isOpen: true, mode: 'reject' })}
                    className="btn btn-danger w-full justify-center"
                  >
                    <ThumbsDown size={20} aria-hidden="true" />
                    <span>Rejeter</span>
                  </button>
                </>
              )}

              {/* Download PDF - only show after workflow is complete */}
              {workflow?.isComplete && (
                <button className="btn btn-secondary w-full justify-center">
                  <FileText size={20} aria-hidden="true" />
                  <span>Télécharger PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar - visible only on mobile */}
      {(isCurrentApprover || workflow?.isComplete) && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
          role="region"
          aria-label="Actions d'approbation"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          <div className="px-4 py-4 space-y-3">
            {/* Alert message for mobile */}
            {isCurrentApprover && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-primary-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-primary-700 font-medium">
                    Cette demande nécessite votre approbation
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {isCurrentApprover && (
                <>
                  <button
                    onClick={() => setApprovalModal({ isOpen: true, mode: 'approve' })}
                    className="btn btn-success w-full justify-center"
                    aria-label="Approuver cette demande"
                  >
                    <ThumbsUp size={20} aria-hidden="true" />
                    <span>Approuver</span>
                  </button>

                  <button
                    onClick={() => setApprovalModal({ isOpen: true, mode: 'reject' })}
                    className="btn btn-danger w-full justify-center"
                    aria-label="Rejeter cette demande"
                  >
                    <ThumbsDown size={20} aria-hidden="true" />
                    <span>Rejeter</span>
                  </button>
                </>
              )}

              {/* Download PDF - only show after workflow is complete */}
              {workflow?.isComplete && (
                <button
                  className="btn btn-secondary w-full justify-center"
                  aria-label="Télécharger le PDF de cette demande"
                >
                  <FileText size={20} aria-hidden="true" />
                  <span>Télécharger PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.isOpen && user && id && (
        <ApprovalModal
          mode={approvalModal.mode}
          requestId={id}
          userRole={user.role}
          onSubmit={handleApprovalSubmit}
          onCancel={() => setApprovalModal({ isOpen: false, mode: 'approve' })}
        />
      )}
    </div>
  );
}

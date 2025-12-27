/**
 * CommentThread Component
 * Display threaded comments with email indicator and add comment form
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { MessageSquare, Send, Mail, User } from 'lucide-react';
import type { Comment, User as UserType } from '@/types';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  participants: UserType[];
  currentUserId: string;
}

export default function CommentThread({
  comments,
  onAddComment,
  participants,
  currentUserId,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Participants */}
      {participants.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-gray-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-gray-700">
              Participants ({participants.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-xs">
                    {participant.firstName[0]}{participant.lastName[0]}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">
                  {participant.firstName} {participant.lastName}
                </span>
                <Mail size={12} className="text-gray-400" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <MessageSquare size={32} className="text-gray-400" aria-hidden="true" />
            </div>
            <p className="text-gray-500 text-sm">Aucun commentaire pour le moment</p>
          </div>
        ) : (
          comments.map((comment, index) => {
            const isCurrentUser = comment.userId === currentUserId;
            const isFirstFromUser =
              index === 0 || comments[index - 1].userId !== comment.userId;

            return (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                {isFirstFromUser && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-semibold text-xs">
                      {comment.user.firstName[0]}{comment.user.lastName[0]}
                    </span>
                  </div>
                )}
                {!isFirstFromUser && <div className="w-8" />}

                {/* Comment content */}
                <div className="flex-1">
                  {isFirstFromUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                          Vous
                        </span>
                      )}
                      <time className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), 'PPp', { locale: fr })}
                      </time>
                      {comment.emailSent && (
                        <div
                          className="inline-flex items-center gap-1 text-xs text-gray-500"
                          title="Notification envoyée par email"
                        >
                          <Mail size={12} aria-hidden="true" />
                          <span>Envoyé</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`
                      bg-white border border-gray-200 rounded-lg p-3
                      ${!isFirstFromUser ? 'mt-1' : ''}
                    `}
                  >
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={3}
              className="input resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail size={14} aria-hidden="true" />
            <span>Les participants seront notifiés par email</span>
          </div>

          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="btn btn-primary"
          >
            <Send size={16} aria-hidden="true" />
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );
}

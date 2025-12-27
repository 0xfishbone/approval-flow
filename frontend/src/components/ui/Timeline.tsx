/**
 * Timeline Component
 * Shows chronological history of request events with polished visual design
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import {
  FilePlus,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CheckCheck,
  Circle,
  type LucideIcon
} from 'lucide-react';
import type { TimelineEvent } from '@/types';

interface TimelineProps {
  events: TimelineEvent[];
}

interface EventConfig {
  Icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  ringColor: string;
}

const eventConfig: Record<string, EventConfig> = {
  created: {
    Icon: FilePlus,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    ringColor: 'ring-blue-200'
  },
  approved: {
    Icon: CheckCircle2,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    ringColor: 'ring-green-200'
  },
  rejected: {
    Icon: XCircle,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    ringColor: 'ring-red-200'
  },
  commented: {
    Icon: MessageSquare,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    ringColor: 'ring-gray-200'
  },
  completed: {
    Icon: CheckCheck,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    ringColor: 'ring-purple-200'
  },
};

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Circle size={32} className="text-gray-400" aria-hidden="true" />
        </div>
        <p className="text-gray-500 text-sm">Aucun événement pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const config = eventConfig[event.type] || {
          Icon: Circle,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          ringColor: 'ring-gray-200'
        };
        const { Icon } = config;

        return (
          <div key={event.id} className="flex gap-4 relative">
            {/* Timeline line */}
            <div className="flex flex-col items-center relative">
              {/* Icon circle */}
              <div
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                  ${config.bgColor} ${config.iconColor}
                  ring-2 sm:ring-4 ${config.ringColor} shadow-sm
                  relative z-10
                `}
                aria-hidden="true"
              >
                <Icon size={16} strokeWidth={2.5} className="sm:w-[18px] sm:h-[18px]" />
              </div>

              {/* Connecting line */}
              {index < events.length - 1 && (
                <div
                  className="w-0.5 h-full absolute top-8 sm:top-10 bg-gradient-to-b from-gray-300 to-gray-200"
                  style={{ minHeight: '48px' }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-1 sm:gap-4">
                <div>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">{event.user.name}</span>
                  <span className="text-gray-500 text-xs sm:text-sm ml-2">
                    ({event.user.role})
                  </span>
                </div>
                <time
                  className="text-xs sm:text-sm text-gray-500"
                  dateTime={new Date(event.timestamp).toISOString()}
                >
                  {format(new Date(event.timestamp), 'PPp', { locale: fr })}
                </time>
              </div>

              {/* Event message */}
              <p className="text-gray-700 text-sm leading-relaxed mb-2">
                {event.message}
              </p>

              {/* Comments/metadata */}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-3">
                  {typeof event.metadata.comments === 'string' && event.metadata.comments && (
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare
                          size={14}
                          className="text-gray-400 mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <p className="text-sm text-gray-600 italic">
                          "{event.metadata.comments as string}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

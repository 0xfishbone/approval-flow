import { Bell } from 'lucide-react';
import { useNotifications } from '../../lib/useNotifications';

export function NotificationBadge() {
  const { unreadCount } = useNotifications({
    pollInterval: 30000, // Poll every 30 seconds
    unreadOnly: true,
  });

  return (
    <div className="relative inline-flex">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * Main Layout
 * Navigation sidebar + content area for authenticated pages
 */

import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Bell,
  FolderOpen,
  LogOut,
  type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { NotificationBadge } from '@/components/ui/NotificationBadge';

interface NavItem {
  path: string;
  label: string;
  Icon: LucideIcon;
}

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems: NavItem[] = [
    { path: '/dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
    { path: '/requests', label: 'Demandes', Icon: FileText },
    { path: '/notifications', label: 'Notifications', Icon: Bell },
    { path: '/documents', label: 'Documents', Icon: FolderOpen },
  ];

  // Role-specific navigation items
  if (user?.role !== UserRole.STAFF) {
    navItems.push({ path: '/approvals', label: 'Approbations', Icon: ClipboardCheck });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm safe-area-inset-top">
        <h1 className="text-2xl font-bold text-primary-600">ApprovalFlow</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors px-2 py-2 rounded-lg hover:bg-gray-50 touch-target -mr-2"
          aria-label="Déconnexion"
        >
          <LogOut size={20} aria-hidden="true" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 min-h-screen shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary-600 mb-1">ApprovalFlow</h1>
            <p className="text-sm text-gray-500">v1.0.0</p>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-t border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm text-gray-500 truncate">{user?.role}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 flex-1">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${
                        active
                          ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.path === '/notifications' ? (
                      <NotificationBadge />
                    ) : (
                      <item.Icon
                        size={20}
                        strokeWidth={active ? 2.5 : 2}
                        aria-hidden="true"
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="
                w-full flex items-center gap-3 px-4 py-3
                text-gray-700 hover:bg-gray-50 hover:text-gray-900
                rounded-lg transition-all duration-200
              "
              aria-label="Déconnexion"
            >
              <LogOut size={20} aria-hidden="true" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 py-6 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
        role="navigation"
        aria-label="Navigation principale mobile"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="flex justify-around items-center px-1 py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg
                  transition-all duration-200 min-w-[60px] min-h-[56px] flex-1
                  ${
                    active
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                {item.path === '/notifications' ? (
                  <NotificationBadge size={20} />
                ) : (
                  <item.Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 2}
                    aria-hidden="true"
                  />
                )}
                <span className="text-[10px] font-medium leading-tight text-center truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/**
 * InstallPrompt Component
 * PWA install banner with smart dismissal
 */

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
      const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show prompt if never dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissal > 7) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-inset-bottom">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl border-2 border-primary-500 p-4 flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Download size={24} className="text-primary-600" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              Installer ApprovalFlow
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Accès rapide et hors ligne sur votre appareil
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X size={20} className="text-gray-500" />
            </button>
            <button
              onClick={handleInstall}
              className="btn btn-primary text-sm px-4 py-2"
            >
              Installer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

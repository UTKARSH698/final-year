import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'agrifuture_install_dismissed';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissed = Number(raw);
    if (isNaN(dismissed)) return false;
    const daysSince = (Date.now() - dismissed) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

const InstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only show on mobile/tablet
    if (window.innerWidth >= 1024) return;
    if (isDismissed()) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } catch (err) {
      console.error('[InstallPrompt] install failed:', err);
    }
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    setVisible(false);
    deferredPrompt.current = null;
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable — silently ignore
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="banner"
          className="fixed bottom-20 left-4 right-4 z-[100] sm:left-6 sm:right-6"
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-gold/20 bg-white/95 dark:bg-charcoal/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-gold/20 to-emerald-500/20 border border-gold/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-gold" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-outfit font-semibold text-gray-900 dark:text-white leading-snug">
                  Install AgriFuture for a faster experience
                </p>
                <p className="mt-1 text-xs font-inter text-gray-500 dark:text-gray-400 leading-relaxed">
                  Get instant access from your home screen with offline support.
                </p>

                {/* Install button */}
                <button
                  onClick={handleInstall}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold/80 text-black font-jakarta font-bold text-xs tracking-wide hover:from-gold/90 hover:to-gold/70 transition-all shadow-lg shadow-gold/20 active:scale-[0.97]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;

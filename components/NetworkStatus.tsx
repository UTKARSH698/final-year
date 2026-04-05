import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

type NetworkState = 'online' | 'offline' | 'restored';

const NetworkStatus: React.FC = () => {
  const [state, setState] = useState<NetworkState>('online');
  const restoredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
      setState('offline');
    };

    const handleOnline = () => {
      if (!wasOffline.current) return;
      wasOffline.current = false;
      setState('restored');
      restoredTimer.current = setTimeout(() => setState('online'), 3000);
    };

    // Check initial state
    if (!navigator.onLine) {
      wasOffline.current = true;
      setState('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
    };
  }, []);

  const isVisible = state === 'offline' || state === 'restored';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={state}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="alert"
          aria-live="assertive"
          className="fixed top-0 left-0 right-0 z-[100]"
        >
          <div
            className={`flex items-center justify-center gap-3 px-6 py-3 text-sm font-inter font-medium shadow-lg backdrop-blur-xl ${
              state === 'offline'
                ? 'bg-red-500/95 dark:bg-red-600/95 text-white'
                : 'bg-emerald-500/95 dark:bg-emerald-600/95 text-white'
            }`}
          >
            {state === 'offline' ? (
              <>
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>You're offline. Some features may be unavailable.</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 shrink-0" />
                <span>Back online!</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;

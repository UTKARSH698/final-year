import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  TrendingUp,
  Scan,
  Plane,
  ShoppingBag,
  FileText,
  Receipt,
  History,
  Search,
  Command,
  Shield,
  Code2,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  shortcut: string;
}

const COMMANDS: CommandItem[] = [
  { id: 'home', label: 'Home', icon: Home, shortcut: 'H' },
  { id: 'crop-guide', label: 'Crop Guide', icon: BookOpen, shortcut: 'G' },
  { id: 'market', label: 'Market Analysis', icon: TrendingUp, shortcut: 'M' },
  { id: 'disease-detect', label: 'Disease Scanner', icon: Scan, shortcut: 'D' },
  { id: 'agri-drone', label: 'Drone Analytics', icon: Plane, shortcut: 'A' },
  { id: 'shop', label: 'Agri Store', icon: ShoppingBag, shortcut: 'S' },
  { id: 'schemes', label: 'Government Schemes', icon: FileText, shortcut: 'F' },
  { id: 'expense', label: 'Expense Tracker', icon: Receipt, shortcut: 'E' },
  { id: 'history', label: 'Report History', icon: History, shortcut: 'R' },
  { id: 'tech-stack', label: 'Tech Stack', icon: Code2, shortcut: 'T' },
  { id: 'admin', label: 'Admin Panel', icon: Shield, shortcut: 'P' },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Small delay so the DOM is ready
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Clamp activeIndex when filtered list shrinks
  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const selectItem = useCallback(
    (id: string) => {
      onNavigate(id);
      onClose();
    },
    [onNavigate, onClose]
  );

  // Keyboard handling inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) {
          selectItem(filtered[activeIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] backdrop-blur-sm bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl
              bg-white dark:bg-obsidian border border-black/10 dark:border-white/10"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400
                  dark:placeholder-gray-500 font-jakarta text-sm outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]
                font-mono font-medium text-gray-400 dark:text-gray-500
                bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                ESC
              </kbd>
            </div>

            {/* Results list */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2" role="listbox">
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500 font-jakarta">
                  No results found
                </p>
              )}
              {filtered.map((cmd, index) => {
                const Icon = cmd.icon;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => selectItem(cmd.id)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-500/10'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`flex-1 text-sm font-jakarta font-medium transition-colors
                        ${
                          isActive
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {cmd.label}
                    </span>
                    <kbd
                      className={`hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]
                        font-mono font-medium border transition-colors
                        ${
                          isActive
                            ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'
                        }`}
                    >
                      <Command className="w-2.5 h-2.5" />
                      {cmd.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-black/5 dark:border-white/5 flex items-center gap-4">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-jakarta flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono">
                  &uarr;&darr;
                </kbd>
                navigate
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-jakarta flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono">
                  &crarr;
                </kbd>
                select
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-jakarta flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono">
                  esc
                </kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User as UserIcon, Phone, Mail, MapPin, Loader2, CheckCircle2, Edit3 } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [state, setState] = useState('');
  const [landSize, setLandSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, state, landSize: parseFloat(landSize) || undefined }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
        // Reload user data
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-white dark:bg-charcoal rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-900 to-obsidian p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/70">
            <X size={18} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-2xl font-bold text-black shadow-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-outfit font-bold">{user.name}</div>
              <div className="text-sm text-gray-400">{user.email || user.phone}</div>
              <div className="text-[10px] font-bold text-gold uppercase tracking-widest mt-1">AgriFuture Member</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Account Info */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Account Details</div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10">
              {user.email ? <Mail size={16} className="text-gold" /> : <Phone size={16} className="text-gold" />}
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{user.email || user.phone}</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10">
              <UserIcon size={16} className="text-gold" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">ID: {user.id}</span>
            </div>
          </div>

          {/* Edit Form */}
          {editing ? (
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Edit Profile</div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Your State</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="e.g. Punjab"
                  className="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Farm Size (acres)</label>
                <input
                  type="number"
                  value={landSize}
                  onChange={e => setLandSize(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : null}
                  SAVE
                </button>
                <button onClick={() => setEditing(false)} className="px-6 py-3 rounded-2xl border border-black/10 dark:border-white/10 text-gray-500 font-bold text-sm">
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-black/10 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-400 hover:border-gold hover:text-gold transition-all"
            >
              <Edit3 size={16} /> EDIT PROFILE
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

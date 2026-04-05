import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Shield, Users, FileText, Receipt, ShoppingCart,
  Database, Server, RefreshCw, Loader2, Crown, UserCheck, ChevronDown
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface AdminStats {
  tables: { users: number; reports: number; expenses: number; orders: number };
  dbSize: string;
  recentUsers: Array<{
    id: string; name: string; email: string | null; phone: string | null;
    role: string; created_at: string;
  }>;
}

interface Props {
  onBack: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/users', { credentials: 'include' }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error('Role update error:', err);
    } finally {
      setUpdatingRole(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-500 font-bold text-lg">Admin Access Required</p>
          <p className="text-gray-400 text-sm mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const tableCards = stats ? [
    { label: 'Users', count: stats.tables.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Reports', count: stats.tables.reports, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Expenses', count: stats.tables.expenses, icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Orders', count: stats.tables.orders, icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ] : [];

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest hover:text-gold transition-colors">
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Shield size={24} className="text-gold" />
              </div>
              <div>
                <h1 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-gray-500 font-medium text-sm">Database management & user administration</p>
              </div>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold text-sm tracking-widest mt-8 hover:scale-105 transition-all shadow-xl disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> REFRESH
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-gold" />
          </div>
        ) : (
          <>
            {/* DB Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {tableCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg"
                >
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon size={18} className={card.color} />
                  </div>
                  <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{card.count}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{card.label}</div>
                </motion.div>
              ))}
            </div>

            {/* DB Info */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <Database size={14} className="text-gold" /> Database Info
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Engine</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">PostgreSQL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Size</span>
                      <span className="text-sm font-bold text-gold">{stats.dbSize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total Records</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {stats.tables.users + stats.tables.reports + stats.tables.expenses + stats.tables.orders}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className="flex items-center gap-2 text-sm font-bold text-emerald-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <Server size={14} className="text-gold" /> Schema Tables
                  </div>
                  <div className="space-y-2">
                    {['users', 'reports', 'expenses', 'orders', 'otp_tokens', 'activity_log'].map(table => (
                      <div key={table} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 font-mono">{table}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                <Users size={14} className="text-gold" /> User Management ({allUsers.length} users)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-black/5 dark:border-white/10">
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id} className="border-b border-black/5 dark:border-white/5 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</div>
                              <div className="text-[10px] text-gray-400">{u.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-xs text-gray-600 dark:text-gray-400">{u.email || u.phone || 'N/A'}</div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-gold/20 text-gold'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                          }`}>
                            {u.role === 'admin' && <Crown size={10} />}
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="text-xs text-gray-500">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </div>
                        </td>
                        <td className="py-4">
                          {u.id === user?.id ? (
                            <span className="text-[10px] font-bold text-gray-400 italic">You</span>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                              disabled={updatingRole === u.id}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider border transition-all hover:scale-105 disabled:opacity-50 border-gold/30 text-gold hover:bg-gold/10"
                            >
                              {updatingRole === u.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : u.role === 'admin' ? 'REVOKE ADMIN' : 'MAKE ADMIN'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

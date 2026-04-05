import React, { useState, useEffect } from 'react';
import { Leaf, Mail, Phone, MapPin, ExternalLink, Database, Server } from 'lucide-react';

interface DbHealth {
  status: string;
  database: { engine: string; version: string; size: string; connected: boolean };
  tables: { users: number; reports: number; expenses: number; orders: number };
}

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const [db, setDb] = useState<DbHealth | null>(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setDb).catch(() => setDb(null));
    const iv = setInterval(() => {
      fetch('/api/health').then(r => r.json()).then(setDb).catch(() => setDb(null));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <footer className="relative border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-charcoal/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-outfit font-bold text-lg text-gray-900 dark:text-white">AgriFuture</span>
            </div>
            <p className="text-sm font-inter text-gray-500 dark:text-gray-400 leading-relaxed">
              AI-powered crop intelligence platform empowering Indian farmers with precision agriculture.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-jakarta font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Platform</h3>
            <ul className="space-y-3">
              {['Crop Prediction', 'Disease Detection', 'Market Analysis', 'Government Schemes', 'Expense Tracker'].map(link => (
                <li key={link}>
                  <span className="text-sm font-inter text-gray-600 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors cursor-pointer">
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-jakarta font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Resources</h3>
            <ul className="space-y-3">
              {[
                { label: 'Crop Guide', href: '#' },
                { label: 'Agri Store', href: '#' },
                { label: 'Drone Analytics', href: '#' },
                { label: 'Weather Dashboard', href: '#' },
              ].map(link => (
                <li key={link.label}>
                  <span className="text-sm font-inter text-gray-600 dark:text-gray-400 hover:text-gold dark:hover:text-gold transition-colors cursor-pointer inline-flex items-center gap-1">
                    {link.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-jakarta font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm font-inter text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-gold shrink-0" />
                ITM Vocational University, Vadodara
              </li>
              <li className="flex items-center gap-2 text-sm font-inter text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                contact@agrifuture.in
              </li>
            </ul>
          </div>
        </div>

        {/* Database Status Panel */}
        {db && (
          <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-gold" />
              <h3 className="font-jakarta font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">Database Status</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* Connection */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
                <div className={`w-2 h-2 rounded-full ${db.database?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{db.database?.connected ? 'Connected' : 'Offline'}</span>
              </div>
              {/* Engine */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
                <Server className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{db.database?.version || 'N/A'}</span>
              </div>
              {/* Size */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
                <Database className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{db.database?.size || 'N/A'}</span>
              </div>
              {/* Table counts */}
              {db.tables && Object.entries(db.tables).map(([table, count]) => (
                <div key={table} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{table}</span>
                  <span className="text-[10px] font-bold text-gold ml-2">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-inter text-gray-400 dark:text-gray-500">
            &copy; {year} AgriFuture India. Built with AI for Indian Agriculture.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs font-inter text-gray-400 dark:text-gray-500 hover:text-gold transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-xs font-inter text-gray-400 dark:text-gray-500 hover:text-gold transition-colors cursor-pointer">Terms of Service</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-inter text-gray-400 dark:text-gray-500 hover:text-gold transition-colors inline-flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

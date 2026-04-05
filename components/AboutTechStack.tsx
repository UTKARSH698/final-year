import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Cpu, Database, Globe, Lock, Smartphone, Brain,
  Server, Palette, Zap, Shield, Cloud, Code2, Layers
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

const STACK_SECTIONS = [
  {
    title: 'Frontend',
    icon: Palette,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    items: [
      { name: 'React 19', desc: 'UI component library with hooks & suspense' },
      { name: 'TypeScript', desc: 'Type-safe development across the stack' },
      { name: 'Vite', desc: 'Lightning-fast build tool with HMR & code splitting' },
      { name: 'Framer Motion', desc: 'Production-grade animations & transitions' },
      { name: 'Tailwind CSS', desc: 'Utility-first CSS with dark mode support' },
      { name: 'Lucide React', desc: 'Beautiful open-source icon library' },
    ],
  },
  {
    title: 'Backend',
    icon: Server,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    items: [
      { name: 'Express 5', desc: 'Fast Node.js HTTP server with ESM modules' },
      { name: 'PostgreSQL', desc: 'Enterprise-grade relational database (hosted on Render)' },
      { name: 'Node.js + TSX', desc: 'Server-side TypeScript execution' },
      { name: 'Helmet + CORS', desc: 'HTTP security headers & cross-origin policy' },
      { name: 'Zod', desc: 'Runtime schema validation for all API inputs' },
    ],
  },
  {
    title: 'AI & Intelligence',
    icon: Brain,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    items: [
      { name: 'Google Gemini', desc: 'Multimodal AI for crop prediction, disease detection, market analysis' },
      { name: 'Hybrid ML System', desc: 'Custom ML model with Gemini fallback for crop recommendation' },
      { name: 'Image Analysis', desc: 'Canvas compression + AI-powered plant disease detection' },
      { name: 'Natural Language', desc: 'AI chatbot for farming queries in multiple languages' },
    ],
  },
  {
    title: 'Authentication & Security',
    icon: Shield,
    color: 'text-gold',
    bg: 'bg-gold/10',
    items: [
      { name: 'JWT Tokens', desc: '7-day HTTP-only cookie sessions' },
      { name: 'bcryptjs', desc: 'Password hashing with salt rounds' },
      { name: 'Role-Based Access', desc: 'Admin/User privilege system with middleware guards' },
      { name: 'MSG91 OTP', desc: 'Phone & email OTP verification widget' },
      { name: 'Rate Limiting', desc: 'Brute-force protection on auth endpoints' },
    ],
  },
  {
    title: 'Integrations',
    icon: Cloud,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    items: [
      { name: 'Razorpay', desc: 'Payment gateway for agri-store purchases' },
      { name: 'Nominatim', desc: 'Reverse geocoding for GPS location resolution' },
      { name: 'OpenWeatherMap', desc: 'Real-time weather data for crop recommendations' },
      { name: 'PWA', desc: 'Installable app with service worker & offline caching' },
    ],
  },
  {
    title: 'Architecture',
    icon: Layers,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    items: [
      { name: 'Code Splitting', desc: 'Lazy-loaded routes for fast initial page load' },
      { name: 'Responsive Design', desc: 'Mobile-first layout with breakpoint system' },
      { name: 'Dark Mode', desc: 'System-aware theme with localStorage persistence' },
      { name: 'Error Boundaries', desc: 'Graceful error handling with fallback UI' },
      { name: 'Activity Logging', desc: 'Server-side audit trail for all user actions' },
    ],
  },
];

export const AboutTechStack: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest hover:text-gold transition-colors">
            <ArrowLeft size={16} /> DASHBOARD
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-emerald-500/20 border border-gold/30 flex items-center justify-center">
              <Code2 size={28} className="text-gold" />
            </div>
            <div>
              <h1 className="text-5xl font-outfit font-bold text-gray-900 dark:text-white">Tech Stack</h1>
              <p className="text-gray-500 font-medium">Full-stack architecture powering AgriFuture India</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {['React', 'TypeScript', 'PostgreSQL', 'Express', 'Gemini AI', 'JWT', 'Razorpay', 'PWA'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-bold text-gold uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STACK_SECTIONS.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
              className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center`}>
                  <section.icon size={18} className={section.color} />
                </div>
                <h2 className="text-lg font-outfit font-bold text-gray-900 dark:text-white">{section.title}</h2>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.name} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-8 shadow-lg"
        >
          <h2 className="text-lg font-outfit font-bold text-gray-900 dark:text-white mb-6">System Architecture</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {[
              { label: 'Client', sub: 'React + Vite', icon: Smartphone, color: 'bg-blue-500' },
              { label: 'API Server', sub: 'Express 5', icon: Server, color: 'bg-emerald-500' },
              { label: 'Database', sub: 'PostgreSQL', icon: Database, color: 'bg-purple-500' },
              { label: 'AI Engine', sub: 'Google Gemini', icon: Brain, color: 'bg-gold' },
            ].map((node, i) => (
              <React.Fragment key={node.label}>
                {i > 0 && (
                  <div className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-gray-200 dark:from-white/10 to-gray-300 dark:to-white/20" />
                )}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-16 rounded-2xl ${node.color} flex items-center justify-center shadow-lg`}>
                    <node.icon size={28} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{node.label}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{node.sub}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutTechStack;

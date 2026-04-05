
import React, { useEffect, useRef, useState } from 'react';
import { motion, Variants, useInView } from 'framer-motion';
import { MapPin, Sprout, CloudRain, Users, Wheat, BarChart3, Globe2, Shield } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

const useCounter = (end: number, duration: number = 2000, start: boolean = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return value;
};

interface HeroProps {
  language: Language;
}

const STATS = [
  { icon: Wheat, value: 55, suffix: '+', label: 'Crops Supported', color: 'text-emerald-500' },
  { icon: BarChart3, value: 95, suffix: '%', label: 'Prediction Accuracy', color: 'text-gold' },
  { icon: Globe2, value: 15, suffix: '+', label: 'Indian States', color: 'text-blue-500' },
  { icon: Shield, value: 100, suffix: '%', label: 'Data Privacy', color: 'text-purple-500' },
];

const StatsCounter: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative z-10 w-full max-w-4xl mx-auto px-6 mb-24"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((stat, i) => {
          const count = useCounter(stat.value, 2000, inView);
          return (
            <div key={i} className="text-center space-y-2">
              <stat.icon className={`w-6 h-6 mx-auto ${stat.color} opacity-70`} />
              <div className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 dark:text-white">
                {count}{stat.suffix}
              </div>
              <div className="text-xs font-jakarta text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export const Hero: React.FC<HeroProps> = ({ language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS[Language.EN];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Array<{x: number, y: number, r: number, vx: number, vy: number, alpha: number}> = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.12, 
        vy: (Math.random() - 0.5) * 0.12,
        alpha: Math.random() * 0.5 + 0.1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176, 139, 90, ${p.alpha})`; 
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center pt-20 pb-32 overflow-hidden">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-60 dark:opacity-40" />
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow mix-blend-multiply dark:mix-blend-normal" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow mix-blend-multiply dark:mix-blend-normal" style={{ animationDelay: '2s' }} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-900/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-jakarta tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">AI</span>
        </motion.div>

        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-8xl font-outfit font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 drop-shadow-sm pb-2"
        >
          {t.heroTitle}
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-xl md:text-2xl font-inter font-light text-gray-600 dark:text-gray-400"
        >
          {t.heroSub}
        </motion.p>

        <motion.p 
          variants={itemVariants}
          className="max-w-2xl mx-auto text-gray-500 dark:text-gray-500 font-inter leading-relaxed text-lg"
        >
          {t.desc}
        </motion.p>

        {/* Quick Actions Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-12">
          {[
            { 
              icon: Sprout, 
              label: 'Recommend', 
              color: 'from-emerald-50 to-white dark:from-emerald-900/50 dark:to-emerald-800/20', 
              hover: 'from-emerald-100 to-emerald-50 dark:from-emerald-600/30 dark:to-emerald-900/80',
              iconColor: 'text-emerald-800 dark:text-white/70',
              action: 'Start',
              targetId: 'prediction-engine'
            },
            { 
              icon: MapPin, 
              label: 'Location', 
              color: 'from-blue-50 to-white dark:from-blue-900/50 dark:to-blue-800/20', 
              hover: 'from-blue-100 to-blue-50 dark:from-blue-600/30 dark:to-blue-900/80',
              iconColor: 'text-blue-800 dark:text-white/70',
              action: 'Detect',
              targetId: 'prediction-engine'
            },
            {
              icon: CloudRain,
              label: 'Weather',
              color: 'from-slate-100 to-white dark:from-slate-800/50 dark:to-slate-700/20',
              hover: 'from-slate-200 to-slate-100 dark:from-slate-600/30 dark:to-slate-900/80',
              iconColor: 'text-slate-800 dark:text-white/70',
              action: 'Live',
              targetId: 'weather-section'
            },
            {
              icon: Users,
              label: 'About Us',
              color: 'from-amber-50 to-white dark:from-amber-900/40 dark:to-amber-800/10',
              hover: 'from-amber-100 to-amber-50 dark:from-amber-600/25 dark:to-amber-900/70',
              iconColor: 'text-amber-700 dark:text-amber-400/80',
              action: 'Team',
              targetId: 'about-us'
            },
          ].map((item, idx) => (
            <motion.button 
              key={idx} 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToSection(item.targetId)}
              className={`group relative overflow-hidden rounded-3xl border border-white dark:border-white/5 bg-gradient-to-br ${item.color} p-6 backdrop-blur-sm transition-all duration-500 hover:border-gold shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl cursor-pointer`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.hover} opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out`} />
              <div className="flex flex-col items-center gap-4 relative z-10">
                <item.icon className={`w-8 h-8 ${item.iconColor} group-hover:text-emerald-900 dark:group-hover:text-white transition-all duration-500 ease-out group-hover:scale-125`} />
                <div className="text-center">
                  <div className="text-[10px] font-jakarta text-gray-500 uppercase tracking-widest mb-1 group-hover:text-emerald-900 dark:group-hover:text-white/60 transition-colors font-bold">{item.action}</div>
                  <div className="text-base font-outfit font-bold text-gray-900 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">{item.label}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Animated Stats */}
      <StatsCounter />

      {/* Weather Strip */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: "circOut" }}
        className="absolute bottom-0 w-full bg-white/60 dark:bg-white/5 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-xs font-jakarta text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold">MONSOON SYNC: ACTIVE</span>
          </div>
          <div className="hidden md:flex gap-8 font-bold">
            <span>UV INDEX: MODERATE</span>
            <span>WIND: 12 KM/H NW</span>
            <span>HUMIDITY: 65%</span>
          </div>
          <div className="text-emerald-700 dark:text-emerald-400 font-bold">LIVE DATA FEED ●</div>
        </div>
      </motion.div>
    </section>
  );
};

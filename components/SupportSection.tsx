
import React from 'react';
import { Linkedin, Github, Heart } from 'lucide-react';

const TEAM = [
  {
    name: 'Utkarsh Batham',
    role: 'UI/UX & Backend Lead',
    description: 'Built Crop Recommendation, AgriDrone V2, Crop Encyclopedia, Admin Dashboard, Auth System, and PostgreSQL integration. Designed the entire UI/UX.',
    gradient: 'from-orange-400 to-pink-600',
    initials: 'UB',
    linkedin: 'https://www.linkedin.com/in/utkarsh-batham-531913247?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    github: 'https://github.com/UTKARSH698'
  },
  {
    name: 'Nikhil Sharma',
    role: 'AI & Intelligence Lead',
    description: 'Developed Disease Detector, Market Forecasting, Digital Twin, Gemini AI Integration, and Crop Calendar — powering the platform\'s AI core.',
    gradient: 'from-blue-400 to-cyan-600',
    initials: 'NS',
    linkedin: 'https://www.linkedin.com/in/nikhil-sh10/',
    github: 'https://github.com/Nikhilsh10'
  },
  {
    name: 'Hiren Mahida',
    role: 'Features & Data Lead',
    description: 'Built Scheme Finder, Expense Tracker, AgriStore, Mandi Ticker, and the Crop Database powering recommendations across the platform.',
    gradient: 'from-emerald-400 to-green-600',
    initials: 'HM',
    linkedin: 'https://www.linkedin.com/in/hiren-mahida-ab59a2333/',
    github: 'https://share.google/a3eBlpK7dc9oajJYH'
  },
  {
    name: 'Harsh Kumar',
    role: 'Infrastructure & DevOps Lead',
    description: 'Implemented Weather Dashboard, AgriBot, Razorpay Payments, PWA support, and managed cloud deployment on Render.',
    gradient: 'from-purple-400 to-indigo-600',
    initials: 'HK',
    linkedin: 'https://www.linkedin.com/in/harsh-singh-42a78b274/',
    github: 'https://github.com/kumaraharsh84'
  },
];

export const SupportSection: React.FC = () => {
  return (
    <section id="about-us" className="py-24 px-6 relative overflow-hidden border-t border-black/5 dark:border-white/5 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5">
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
            <Heart className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-current" />
            <span className="text-[10px] font-jakarta tracking-widest text-emerald-800 dark:text-emerald-400 font-bold uppercase">The Minds Behind</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
            Architects of the Future
          </h2>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {TEAM.map((member, idx) => (
            <div key={idx} className="group relative p-6 rounded-3xl bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 hover:border-gold/50 dark:hover:border-gold/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl shadow-sm flex flex-col h-full">
              
              {/* Abstract Avatar */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.gradient} mb-6 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500 shrink-0`}>
                <span className="font-outfit text-xl font-bold text-white tracking-wider">{member.initials}</span>
              </div>

              {/* Info */}
              <div className="flex-grow">
                <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gold transition-colors">{member.name}</h3>
                <p className="text-xs font-jakarta tracking-wide uppercase text-emerald-700 dark:text-emerald-400 font-bold mb-4">{member.role}</p>
                
                <p className="text-sm font-inter text-gray-900 dark:text-gray-400 leading-relaxed opacity-90 font-medium">
                  {member.description}
                </p>
              </div>

              {/* Social placeholders (decorative) */}
              <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 mt-6 pt-4 border-t border-black/5 dark:border-white/5">
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
                </a>
                <a href={member.github} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Motivating Lines */}
        <div className="relative text-center max-w-4xl mx-auto py-12">
            {/* Decorative Quotes */}
            <div className="absolute top-0 left-0 text-9xl font-serif text-black/5 dark:text-white/5 leading-none">“</div>
            
            <h3 className="text-3xl md:text-5xl font-outfit font-bold leading-tight text-gray-900 dark:text-white mb-6">
              "Innovating from the <span className="text-emerald-600 dark:text-emerald-400">Roots</span> up to the <span className="text-blue-600 dark:text-blue-400">Cloud</span>."
            </h3>
            
            <p className="text-lg md:text-xl font-inter font-medium text-gray-600 dark:text-gray-400 italic mb-4">
              Empowering every Kisaan with the precision of science and the dignity of luxury technology.
            </p>
            
            <p className="text-xl md:text-2xl font-outfit font-bold text-gray-900 dark:text-white opacity-90">
              "विज्ञान की शक्ति, किसान की तरक्की।"
            </p>
            
             <div className="mt-12 w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto opacity-50"></div>
        </div>

      </div>
    </section>
  );
};

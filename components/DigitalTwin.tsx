
import React, { useState, useEffect } from 'react';

// --- SLIDESHOW IMAGE NODE ---
const SlideshowNode = ({ images, colorClass }: { images: string[], colorClass: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center will-change-transform">
      {/* Decorative Rings - HUD Style (Keeping these rotating for tech feel) */}
      <div className={`absolute w-48 h-48 rounded-full border border-dashed ${colorClass} opacity-20 animate-[spin_12s_linear_infinite]`}></div>
      <div className={`absolute w-40 h-40 rounded-full border border-dotted ${colorClass} opacity-40 animate-[spin_15s_linear_infinite_reverse]`}></div>
      
      {/* Main Image Container */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.2)] border-2 border-white/30 group-hover:scale-105 transition-transform duration-500 z-10 bg-gray-100">
         <img 
           key={index} // Force remount for animation
           src={images[index]} 
           alt="Digital Node" 
           className="w-full h-full object-cover animate-in slide-in-from-left duration-700 fade-in" 
           onError={(e) => {
             e.currentTarget.src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80"; // Fallback nature image
           }}
         />
         {/* Glass Glare Overlay */}
         <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none"></div>
      </div>
      
      {/* Floating Particles */}
      <div className={`absolute -top-4 right-10 w-2 h-2 rounded-full ${colorClass} animate-ping`}></div>
      <div className={`absolute bottom-4 left-10 w-1.5 h-1.5 rounded-full ${colorClass} animate-pulse`}></div>
    </div>
  );
};

const Card3D = ({ title, sub, color, images, borderColor, animationClass, status = 'LIVE' }: { title: string, sub: string, color: string, images: string[], borderColor: string, animationClass: string, status?: string }) => (
  <div className={`group h-80 w-full perspective-1000 ${animationClass}`}>
    <div className="relative h-full w-full transition-all duration-700 ease-out preserve-3d group-hover:rotate-y-180">
      
      {/* Front */}
      <div className={`absolute inset-0 h-full w-full rounded-[2rem] bg-white border border-white/60 p-6 backdrop-blur-md backface-hidden flex flex-col justify-between shadow-2xl dark:shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden`}>
        
        {/* Soft Ambient Glow */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full ${color} blur-[80px] opacity-10`}></div>
        
        {/* Model Container */}
        <div className="flex-1 flex items-center justify-center relative z-10 scale-90 group-hover:scale-100 transition-transform duration-700 ease-out">
            <SlideshowNode images={images} colorClass={borderColor} />
        </div>

        <div className="relative z-10 mt-2">
          <h3 className="text-2xl font-outfit text-gray-900 font-bold tracking-tight">{title}</h3>
          <div className="flex items-center justify-between mt-1">
             <p className="text-[10px] text-gray-500 font-jakarta font-bold uppercase tracking-widest">{sub}</p>
             {/* Replaced 3 dots with a simple line indicator */}
             <div className={`w-8 h-1 rounded-full ${color} opacity-50`}></div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-6 right-6 flex items-center gap-2 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider whitespace-nowrap">{status}</span>
        </div>
      </div>

      {/* Back - Info Panel */}
      <div className={`absolute inset-0 h-full w-full rounded-[2rem] bg-white border border-gold/30 p-8 rotate-y-180 backface-hidden flex flex-col items-center justify-center text-center shadow-[0_0_60px_rgba(212,175,55,0.15)]`}>
           <div className="text-gold-dim font-jakarta text-[10px] tracking-[0.2em] mb-4 font-bold uppercase">System Metrics</div>
           
           <div className="relative mb-2">
             <div className="text-6xl font-outfit text-gray-900 font-bold tracking-tighter">98<span className="text-3xl text-gold align-top">%</span></div>
           </div>
           
           <div className="text-gray-400 text-xs font-medium mb-8 max-w-[150px] leading-relaxed">Optimization Efficiency currently active</div>
           
           <button className="px-8 py-3 rounded-xl bg-gray-900 text-white text-xs font-bold tracking-wide hover:bg-gold hover:text-black transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300 ease-out">
             VIEW REPORT
           </button>
      </div>
    </div>
  </div>
);

export const DigitalTwin: React.FC = () => {
  return (
    <section id="digital-ecosystem" className="py-32 px-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl mx-auto pointer-events-none">
          <div className="absolute top-40 left-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-20 text-center md:text-left">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-500/20 bg-gray-500/5 backdrop-blur-md mb-4">
              <span className="text-[10px] font-jakarta tracking-widest text-taupe dark:text-gray-400 font-bold uppercase">AgriFuture Ecosystem v2.0</span>
           </div>
           <h2 className="text-5xl md:text-7xl font-outfit text-espresso dark:text-white mb-6 font-bold tracking-tight">Digital Ecosystem</h2>
           <p className="text-taupe dark:text-gray-400 max-w-xl text-lg font-light leading-relaxed md:mx-0 mx-auto">
             A live antigravity simulation of your field's parameters. Powered by Gemini.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
           <Card3D 
             title="Soil Strata" 
             sub="Layer Analysis" 
             color="bg-amber-500" 
             borderColor="border-amber-500"
             images={[
               "https://images.unsplash.com/photo-1516528387618-afa90b13e000?auto=format&fit=crop&w=600&q=80", // Dry soil texture
               "https://images.unsplash.com/photo-1629806471329-3075bb627581?auto=format&fit=crop&w=600&q=80", // Rich soil close-up
               "https://images.unsplash.com/photo-1486745583856-2e86b47c870c?auto=format&fit=crop&w=600&q=80"  // Earth layers/strata
             ]}
             animationClass="animate-drift-1"
             status="COMING SOON"
           />
           <Card3D 
             title="Drone Scout" 
             sub="Aerial Coverage" 
             color="bg-blue-500" 
             borderColor="border-blue-500"
             images={[
               "https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&w=600&q=80",
               "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=600&q=80",
               "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=80"
             ]}
             animationClass="animate-drift-2"
             status="COMING SOON"
           />
           <Card3D 
             title="Smart Drip" 
             sub="Hydro-Flow" 
             color="bg-cyan-500" 
             borderColor="border-cyan-500"
             images={[
               "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80",
               "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=600&q=80",
               "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&w=600&q=80"
             ]}
             animationClass="animate-drift-3"
             status="COMING SOON"
           />
           <Card3D 
             title="Precision Farming" 
             sub="Growth Projection" 
             color="bg-emerald-500" 
             borderColor="border-emerald-500"
             images={[
               "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=600&q=80",
               "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80",
               "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80"
             ]}
             animationClass="animate-drift-4"
             status="COMING SOON"
           />
        </div>
      </div>
    </section>
  );
};

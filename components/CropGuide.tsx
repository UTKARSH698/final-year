
import React, { useState } from 'react';
import { ArrowLeft, Droplets, Calendar, Sprout, IndianRupee, X, Scale, Check, Plus, BookOpen, ChevronRight, Search } from 'lucide-react';
import { CROP_DATABASE, CropData } from '../services/geminiService';
import { useToast } from './Toast';

interface CropGuideProps {
  onBack: () => void;
}

interface CropCardProps {
  crop: CropData;
  isSelected: boolean;
  onToggle: (crop: CropData) => void;
  disabled: boolean;
}

const CropCard: React.FC<CropCardProps> = ({ crop, isSelected, onToggle, disabled }) => {
  const waterRequirement = `${crop.minRain}${crop.maxRain ? ` - ${crop.maxRain}` : '+'} mm`;

  return (
    <div 
      onClick={() => !disabled && onToggle(crop)}
      className={`relative bg-white dark:bg-charcoal border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full cursor-pointer group ${
        isSelected 
          ? 'border-gold ring-1 ring-gold shadow-2xl scale-[1.02] bg-gold/5 dark:bg-gold/5' 
          : 'border-black/5 dark:border-white/10 hover:border-gold/50 hover:shadow-xl'
      }`}
    >
      {/* Selection Indicator */}
      <div className={`absolute top-4 right-4 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
        isSelected 
          ? 'bg-gold text-black shadow-lg scale-100' 
          : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-500 hover:bg-gold/20 scale-90'
      }`}>
        {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
      </div>

      <div className="p-6 flex flex-col h-full">
        {/* Header (Text Only) */}
        <div className="mb-6">
           <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-jakarta font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                 crop.name.includes("Rice") || crop.name.includes("Wheat") ? 'bg-blue-100 text-blue-800' :
                 crop.name.includes("Cotton") ? 'bg-purple-100 text-purple-800' : 
                 'bg-emerald-100 text-emerald-800'
              }`}>
                 {crop.highN ? 'High Nutrient' : 'Standard'}
              </span>
           </div>
           <h3 className="font-outfit font-bold text-2xl text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-gold transition-colors">{crop.name}</h3>
           <p className="font-inter text-sm text-gray-600 dark:text-gray-400 font-medium">{crop.hindi}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-black/5 dark:bg-white/5 w-full mb-6"></div>

        {/* Stats Grid */}
        <div className="space-y-4 flex-grow">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
               <Sprout size={14} className="text-emerald-500" />
               <span className="font-medium text-xs uppercase tracking-wide">Yield</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-right">{crop.yield}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
               <Droplets size={14} className="text-blue-500" />
               <span className="font-medium text-xs uppercase tracking-wide">Water</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-right">{waterRequirement}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
               <Calendar size={14} className="text-orange-500" />
               <span className="font-medium text-xs uppercase tracking-wide">Duration</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-right">{crop.duration}</span>
          </div>
        </div>

        {/* Footer Price */}
        <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
             <span className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">Est. Rate</span>
             <div className="flex items-center gap-1 text-gold font-bold font-mono text-lg">
                <IndianRupee size={14} /> {crop.price.split(' ')[0].replace('₹', '')}
             </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonView: React.FC<{ crops: CropData[]; onBack: () => void }> = ({ crops, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 text-sm font-bold tracking-wide"
          >
            <ArrowLeft size={16} /> BACK TO GRID
          </button>
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 dark:text-white flex items-center gap-3">
             <Scale className="text-gold" size={32} />
             Crop Comparison
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="min-w-[800px] grid grid-cols-[200px_repeat(3,1fr)] gap-4">
          
          {/* Labels Column */}
          <div className="space-y-4 pt-24">
             {['Crop Type', 'Yield Potential', 'Market Rate', 'Water Needs', 'Cycle Duration', 'Ideal Soil', 'Nitrogen', 'pH Level'].map((label, i) => (
                <div key={i} className="h-16 flex items-center text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider px-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                   {label}
                </div>
             ))}
          </div>

          {/* Crop Columns */}
          {crops.map(crop => (
             <div key={crop.name} className="space-y-4">
                {/* Header Card (Text Only) */}
                <div className="h-24 p-6 bg-white dark:bg-charcoal border border-gold/30 rounded-2xl flex flex-col justify-center shadow-lg">
                   <div className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{crop.name}</div>
                   <div className="text-sm opacity-80 font-inter text-gray-600 dark:text-gray-400">{crop.hindi}</div>
                </div>

                {/* Data Rows */}
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm font-bold text-gray-900 dark:text-white">
                   {crop.name.includes("Rice") || crop.name.includes("Wheat") ? "Cereal" : crop.name.includes("Gram") ? "Pulse" : "Cash Crop"}
                </div>
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm font-bold text-gray-900 dark:text-white">
                   {crop.yield}
                </div>
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm font-bold text-gold">
                   {crop.price}
                </div>
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm font-bold text-blue-600 dark:text-blue-400">
                   {crop.minRain}{crop.maxRain ? ` - ${crop.maxRain}` : '+'} mm
                </div>
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm font-bold text-gray-900 dark:text-white">
                   {crop.duration}
                </div>
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm text-xs font-medium text-gray-900 dark:text-gray-300 leading-tight">
                   {crop.soilTypes.slice(0, 2).join(", ")}
                </div>
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm font-bold text-gray-900 dark:text-white">
                   {crop.highN ? "High Demand" : "Low Demand"}
                </div>
                <div className="h-16 flex items-center px-6 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 shadow-sm font-bold text-gray-900 dark:text-white">
                   {crop.idealPh} pH
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CropGuide: React.FC<CropGuideProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [selectedCrops, setSelectedCrops] = useState<CropData[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Cereal' | 'Pulse' | 'Cash Crop' | 'Vegetable' | 'Fruit' | 'Spice'>('All');

  const filteredCrops = CROP_DATABASE.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         crop.hindi.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'All') return matchesSearch;
    
    const name = crop.name.toLowerCase();
    if (activeCategory === 'Cereal') return matchesSearch && (name.includes('rice') || name.includes('wheat') || name.includes('maize') || name.includes('barley') || name.includes('millet') || name.includes('sorghum') || name.includes('jowar') || name.includes('bajra') || name.includes('ragi'));
    if (activeCategory === 'Pulse') return matchesSearch && (name.includes('dal') || name.includes('gram') || name.includes('lentil') || name.includes('pea') || name.includes('soybean'));
    if (activeCategory === 'Cash Crop') return matchesSearch && (name.includes('cotton') || name.includes('sugarcane') || name.includes('tobacco') || name.includes('jute') || name.includes('sunflower') || name.includes('mustard') || name.includes('sesame') || name.includes('castor') || name.includes('guar'));
    if (activeCategory === 'Vegetable') return matchesSearch && (name.includes('potato') || name.includes('onion') || name.includes('tomato') || name.includes('garlic') || name.includes('ginger') || name.includes('chili') || name.includes('cauliflower') || name.includes('cabbage') || name.includes('brinjal') || name.includes('okra') || name.includes('carrot') || name.includes('radish') || name.includes('spinach'));
    if (activeCategory === 'Fruit') return matchesSearch && (name.includes('banana') || name.includes('mango') || name.includes('grape') || name.includes('pomegranate') || name.includes('papaya') || name.includes('watermelon') || name.includes('muskmelon'));
    if (activeCategory === 'Spice') return matchesSearch && (name.includes('turmeric') || name.includes('pepper') || name.includes('cardamom') || name.includes('coffee') || name.includes('tea') || name.includes('coriander') || name.includes('jeera') || name.includes('cumin') || name.includes('fennel') || name.includes('saunf') || name.includes('fenugreek'));
    
    return matchesSearch;
  });

  const handleToggleSelect = (crop: CropData) => {
    if (selectedCrops.find(c => c.name === crop.name)) {
      setSelectedCrops(prev => prev.filter(c => c.name !== crop.name));
    } else {
      if (selectedCrops.length >= 3) {
        toast("You can compare up to 3 crops at a time.", 'info');
        return;
      }
      setSelectedCrops(prev => [...prev, crop]);
    }
  };

  if (showCompare) {
    return (
       <div className="min-h-screen pt-24 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
             <ComparisonView crops={selectedCrops} onBack={() => setShowCompare(false)} />
          </div>
       </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative bg-ivory dark:bg-obsidian">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 text-sm font-bold tracking-wide"
            >
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white">Crop Encyclopedia</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Comprehensive text-only database for low-bandwidth access.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="text-3xl font-bold font-outfit text-emerald-600 dark:text-emerald-400">{CROP_DATABASE.length}</div>
                <div className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-500 font-bold">Varieties</div>
             </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 space-y-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search by name or Hindi name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-gray-900 dark:text-white shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'Cereal', 'Pulse', 'Cash Crop', 'Vegetable', 'Fruit', 'Spice'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${
                  activeCategory === cat 
                    ? 'bg-gold text-black shadow-lg scale-105' 
                    : 'bg-white dark:bg-charcoal text-gray-500 border border-black/5 dark:border-white/10 hover:border-gold/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
          {filteredCrops.map((crop) => {
             const isSelected = !!selectedCrops.find(c => c.name === crop.name);
             const isMaxed = selectedCrops.length >= 3 && !isSelected;
             
             return (
               <div key={crop.name} className={isMaxed ? 'opacity-50 grayscale transition-all' : ''}>
                 <CropCard 
                    crop={crop} 
                    isSelected={isSelected}
                    onToggle={handleToggleSelect}
                    disabled={isMaxed}
                 />
               </div>
             );
          })}
        </div>

        {filteredCrops.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4"><BookOpen size={48} className="mx-auto opacity-20" /></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No varieties found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>

      {/* Floating Compare Action Bar */}
      <div className={`fixed bottom-8 left-0 right-0 z-50 transition-all duration-500 transform ${selectedCrops.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
         <div className="max-w-lg mx-auto bg-charcoal/90 dark:bg-white/10 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
               <span className="bg-gold text-black font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {selectedCrops.length}
               </span>
               <span className="text-white font-jakarta text-sm font-bold tracking-wide">CROPS SELECTED</span>
            </div>

            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setSelectedCrops([])}
                 className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                 title="Clear Selection"
               >
                 <X size={18} />
               </button>
               <button 
                 onClick={() => setShowCompare(true)}
                 className="bg-white dark:bg-gold text-black px-6 py-2.5 rounded-full font-jakarta text-xs font-bold tracking-widest hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
               >
                 COMPARE <Scale size={14} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

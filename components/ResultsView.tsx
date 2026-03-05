
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Share2, Save, CheckCircle2,
  AlertCircle, TrendingUp, Wallet,
  BarChart3, Activity, Info, ShieldAlert, Sparkles,
  Thermometer, Droplet, Zap, Bug, Pill, FlaskConical,
  Calculator, Leaf, ArrowRight, TrendingDown, Eye, Check, Loader2, CalendarDays
} from 'lucide-react';
import { PredictionResult } from '../types';
import { CropCalendar } from './CropCalendar';

import { useAuth } from '../AuthContext';

interface ResultsViewProps {
  result: PredictionResult;
  onReset: () => void;
  onOpenLogin: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, onOpenLogin }) => {
  const [activeTab, setActiveTab] = useState<'chemical' | 'organic'>('chemical');
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCropCalendar, setShowCropCalendar] = useState(false);
  const [landAcres, setLandAcres] = useState<number>(1);
  const { user } = useAuth();

  const totalChemCost = result.fertilizerNeeds.chemical.reduce((acc, c) => acc + parseInt(c.costEstimate.replace('₹', '')), 0);
  const totalOrgCost = result.fertilizerNeeds.organic.reduce((acc, c) => acc + parseInt(c.costEstimate.replace('₹', '')), 0);

  const handleShare = async () => {
    const shareText = `AgriFuture Analysis: Recommended Crop - ${result.cropName}. Confidence: ${result.confidence}%. Yield Estimate: ${result.yieldEstimate}. Check out my field report at AgriFuture!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgriFuture Report: ${result.cropName}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("Report summary copied to clipboard!");
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please login to save reports to your account.");
      onOpenLogin();
      return;
    }
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      
      if (response.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        console.error("Failed to save report to backend");
        // Fallback to localStorage if backend fails
        const reports = JSON.parse(localStorage.getItem('agrifuture_reports') || '[]');
        reports.push({ ...result, date: new Date().toISOString() });
        localStorage.setItem('agrifuture_reports', JSON.stringify(reports));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (error) {
      console.error("Error saving report:", error);
      // Fallback
      const reports = JSON.parse(localStorage.getItem('agrifuture_reports') || '[]');
      reports.push({ ...result, date: new Date().toISOString() });
      localStorage.setItem('agrifuture_reports', JSON.stringify(reports));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('results-report-content');
    if (!element) {
      setIsExporting(false);
      return;
    }

    element.classList.add('pdf-export-mode');

    const opt = {
      margin: 0.2,
      filename: `AgriFuture_Report_${result.cropName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        allowTaint: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#050505' : '#FFFCF5'
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await new Promise(r => setTimeout(r, 500));
      await (window as any).html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Something went wrong during high-quality PDF generation. Opening system print as backup.");
      window.print();
    } finally {
      element.classList.remove('pdf-export-mode');
      setIsExporting(false);
    }
  };

  const handleWhatsAppExport = () => {
    const text = `*AgriFuture Analysis Report*%0A%0A*Crop:* ${result.cropName}%0A*Confidence:* ${result.confidence}%%0A*Net Profit:* ${result.profitability.netProfit}%0A*Risk:* ${result.profitability.riskLevel}%0A%0A_Generated via AgriFuture AI_`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
    <section className="py-20 px-4 min-h-screen">
       <motion.div 
         id="results-report-content" 
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="max-w-6xl mx-auto space-y-8 p-8 rounded-[3rem]"
       >
         
         {/* Top Logo - Only visible in PDF/Export */}
         <div className="hidden print:flex items-center gap-2 mb-8 border-b border-gold/20 pb-4">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
              <Leaf className="text-black w-4 h-4" />
            </div>
            <span className="font-outfit font-bold text-xl text-black dark:text-white">AgriFuture Intelligence</span>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-2 bg-gradient-to-br from-emerald-900 to-obsidian border border-emerald-500/20 rounded-[3rem] p-1 relative overflow-hidden group shadow-2xl"
            >
               <div className="bg-obsidian/40 backdrop-blur-xl rounded-[2.9rem] p-10 h-full flex flex-col justify-between relative z-10">
                   <div className="flex flex-col gap-4">
                       <div className="flex items-center gap-4 mb-4">
                           <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-jakarta tracking-widest border border-emerald-500/20 font-bold uppercase">
                             Match Precision: {result.confidence}%
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-jakarta font-bold text-gold tracking-widest uppercase">
                              <Activity size={12} className="animate-pulse" /> Environmental Sync
                           </div>
                       </div>
                       <div>
                           <h2 className="text-5xl md:text-7xl font-outfit text-white font-bold mb-3 tracking-tight">{result.cropName}</h2>
                           <h3 className="text-2xl md:text-3xl font-inter text-gray-400 font-light italic">{result.cropHindi}</h3>
                       </div>
                   </div>
                   <div className="grid grid-cols-3 gap-8 border-t border-white/10 pt-10 mt-10">
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">Duration</div>
                        <div className="text-xl font-outfit text-white font-bold">{result.duration}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">Avg Yield</div>
                        <div className="text-xl font-outfit text-white font-bold">{result.yieldEstimate}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">Market Rate</div>
                        <div className="text-xl font-outfit text-gold font-bold">{result.marketPriceEstimate}</div>
                      </div>
                   </div>
               </div>
            </motion.div>

            <div className="flex flex-col gap-6">
               <motion.div variants={itemVariants} className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                  <h4 className="font-outfit text-gold text-xl mb-4 font-bold flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                       <AlertCircle size={18} className="text-gold" />
                    </div>
                    Agronomist Insight
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-inter font-medium">{result.agronomistNote}</p>
               </motion.div>

               <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-obsidian border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 flex-grow">
                  <h4 className="font-jakarta text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Secondary Choices</h4>
                  <div className="space-y-6">
                     {result.alternatives.map((alt, i) => (
                       <div key={i} className="flex items-center justify-between group">
                          <div>
                             <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-gold transition-colors">{alt.cropName}</div>
                             <div className="text-[10px] text-gray-500 uppercase tracking-widest">{alt.cropHindi}</div>
                          </div>
                          <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{alt.confidence}%</div>
                       </div>
                     ))}
                  </div>
               </motion.div>
            </div>
         </div>

         {/* AI REASONING / SHAP EXPLANATION */}
         <motion.div variants={itemVariants} className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Eye size={120} />
            </div>
            
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles size={24} />
               </div>
               <div>
                  <h3 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">Model Interpretability</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Why did the AI choose {result.cropName}?</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {result.reasons.map((reason, i) => (
                 <motion.div 
                   key={i} 
                   whileHover={{ y: -5 }}
                   className="p-6 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 group hover:border-gold/30 transition-all"
                 >
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest">{reason.feature}</span>
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          reason.impact === 'positive' ? 'bg-emerald-500/20 text-emerald-500' : 
                          reason.impact === 'negative' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'
                       }`}>
                          {reason.impact === 'positive' ? <Check size={12} strokeWidth={3} /> : <Info size={12} />}
                       </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed group-hover:text-gold transition-colors">{reason.description}</p>
                 </motion.div>
               ))}
            </div>
         </motion.div>

         {/* FERTILIZER RECOMMENDATION ENGINE */}
         <motion.div variants={itemVariants} className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-10">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <FlaskConical size={28} />
                     </div>
                     <div>
                        <h3 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">Fertilizer Precision Plan</h3>
                        <p className="text-sm text-gray-500 font-medium">Science-backed soil replenishment strategy.</p>
                     </div>
                  </div>

                  <div className="flex bg-gray-100 dark:bg-black/40 p-1.5 rounded-2xl border border-black/5 dark:border-white/10 self-start md:self-center no-print">
                     <button 
                        onClick={() => setActiveTab('chemical')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-jakarta font-bold tracking-widest transition-all ${
                           activeTab === 'chemical' ? 'bg-white dark:bg-charcoal text-emerald-600 shadow-lg' : 'text-gray-400'
                        }`}
                     >
                        CHEMICAL
                     </button>
                     <button 
                        onClick={() => setActiveTab('organic')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-jakarta font-bold tracking-widest transition-all ${
                           activeTab === 'organic' ? 'bg-white dark:bg-charcoal text-emerald-600 shadow-lg' : 'text-gray-400'
                        }`}
                     >
                        ORGANIC
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-4">
                     <AnimatePresence mode="wait">
                       <motion.div
                         key={activeTab}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: 20 }}
                         transition={{ duration: 0.3 }}
                         className="space-y-4"
                       >
                         {(activeTab === 'chemical' ? result.fertilizerNeeds.chemical : result.fertilizerNeeds.organic).map((plan, i) => (
                            <div key={i} className="group relative p-8 rounded-[2rem] bg-gray-50 dark:bg-white/2 border border-black/5 dark:border-white/5 hover:border-emerald-500/30 transition-all">
                               <div className="flex flex-col md:flex-row justify-between gap-6">
                                  <div className="flex-grow space-y-4">
                                     <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'chemical' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                           {activeTab === 'chemical' ? <FlaskConical size={20} /> : <Leaf size={20} />}
                                        </div>
                                        <h4 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                     </div>
                                     <p className="text-sm text-gray-500 dark:text-gray-400 font-inter leading-relaxed max-w-lg">{plan.description}</p>
                                     
                                     <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                                           <div className="text-[10px] font-jakarta font-bold text-gray-400 tracking-widest uppercase mb-1">DOSAGE</div>
                                           <div className="text-sm font-bold text-gray-900 dark:text-white">{plan.dosage}</div>
                                        </div>
                                        <div className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                                           <div className="text-[10px] font-jakarta font-bold text-gray-400 tracking-widest uppercase mb-1">TIMING</div>
                                           <div className="text-sm font-bold text-gray-900 dark:text-white">{plan.timing}</div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="shrink-0 flex flex-col items-center md:items-end justify-center">
                                     <div className="text-[10px] font-jakarta font-bold text-gold uppercase tracking-widest mb-1">EST. COST</div>
                                     <div className="text-3xl font-outfit font-bold text-emerald-600 dark:text-emerald-400">{plan.costEstimate}</div>
                                  </div>
                               </div>
                            </div>
                         ))}
                       </motion.div>
                     </AnimatePresence>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                     <div className="p-8 rounded-[2.5rem] bg-obsidian dark:bg-black/40 border border-white/5 text-white h-full flex flex-col justify-between">
                        <div>
                           <div className="flex items-center gap-2 text-gold mb-6">
                              <Calculator size={18} />
                              <span className="text-[10px] font-jakarta font-bold uppercase tracking-widest">Financial Summary</span>
                           </div>
                           <div className="space-y-6">
                              <div className="flex justify-between items-end">
                                 <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Investment</div>
                                 <div className="text-4xl font-outfit font-bold text-white">₹{(activeTab === 'chemical' ? totalChemCost : totalOrgCost).toLocaleString()}</div>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed italic">{result.fertilizerNeeds.summary}</p>
                           </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/10">
                           <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                 <TrendingDown size={18} />
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">SAVINGS ALERT</div>
                                 <div className="text-xs font-bold text-white mt-0.5">{result.fertilizerNeeds.savingWithOrganic}</div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </motion.div>

         {/* FERTILIZER DOSE CALCULATOR */}
         <motion.div variants={itemVariants} className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl">
           <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
               <Calculator size={24} className="text-gold" />
             </div>
             <div>
               <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Dose Calculator</h3>
               <p className="text-xs text-gray-500 font-medium">Scale fertilizer quantities to your farm size.</p>
             </div>
           </div>
           <div className="flex items-center gap-4 mb-6 flex-wrap">
             <label className="text-sm font-bold text-gray-600 dark:text-gray-400 shrink-0">Your Land Size (Acres):</label>
             <input
               type="number"
               min={0.5}
               max={1000}
               step={0.5}
               value={landAcres}
               onChange={e => setLandAcres(Math.max(0.5, parseFloat(e.target.value) || 1))}
               className="w-28 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white font-bold text-center focus:outline-none focus:border-gold"
             />
           </div>
           <div className="p-5 rounded-2xl bg-gold/5 border border-gold/20">
             <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-4">
               For <span className="font-bold text-gold">{landAcres} acre{landAcres !== 1 ? 's' : ''}</span>, multiply each dosage by <span className="font-bold text-gold">{landAcres}×</span>.
             </p>
             <div className="flex flex-wrap gap-3">
               <div className="px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-black/5 dark:border-white/5 text-center">
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Chemical Total</div>
                 <div className="text-xl font-outfit font-bold text-gold">₹{(totalChemCost * landAcres).toLocaleString()}</div>
               </div>
               <div className="px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-black/5 dark:border-white/5 text-center">
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Organic Total</div>
                 <div className="text-xl font-outfit font-bold text-emerald-500">₹{(totalOrgCost * landAcres).toLocaleString()}</div>
               </div>
               <div className="px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-black/5 dark:border-white/5 text-center">
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Savings w/ Organic</div>
                 <div className="text-xl font-outfit font-bold text-emerald-600">₹{Math.max(0, (totalChemCost - totalOrgCost) * landAcres).toLocaleString()}</div>
               </div>
             </div>
           </div>
         </motion.div>

         {/* DISEASE CARD */}
         <motion.div
           variants={itemVariants}
           className={`relative overflow-hidden rounded-[3rem] border transition-all duration-500 ${
             result.diseaseRisk.level === 'High' || result.diseaseRisk.level === 'Critical' 
             ? 'border-red-500/30 bg-red-500/5' 
             : 'border-blue-500/20 bg-blue-500/5'
         }`}>
            <div className="p-10 grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
               <div className="lg:col-span-1 flex flex-col items-center text-center">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl ${
                        result.diseaseRisk.level === 'High' ? 'bg-red-500 shadow-red-500/40' : 'bg-blue-500 shadow-blue-500/40'
                    }`}
                  >
                      {result.diseaseRisk.level === 'High' ? <Bug size={32} className="text-white" /> : <ShieldAlert size={32} className="text-white" />}
                  </motion.div>
                  <h3 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">Disease Alert</h3>
                  <div className={`mt-2 px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase ${
                      result.diseaseRisk.level === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>{result.diseaseRisk.level} Priority</div>
               </div>

               <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Detected Risk</div>
                        <div className="text-xl font-outfit font-bold text-gray-900 dark:text-white">{result.diseaseRisk.type}</div>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Symptoms to Scout</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{result.diseaseRisk.symptoms}</p>
                     </div>
                  </div>
                  <div className="space-y-4 p-6 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10">
                     <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                           <Pill size={14} /> Recommended Treatment
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">{result.diseaseRisk.treatment}</p>
                     </div>
                  </div>
               </div>
            </div>
         </motion.div>

         {/* PROFITABILITY DASHBOARD */}
         <motion.div variants={itemVariants} className="relative bg-white dark:bg-charcoal border border-black/5 dark:border-gold/20 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="px-10 py-8 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-white/2">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold text-black flex items-center justify-center shadow-lg">
                     <BarChart3 size={24} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">Planning Dashboard</h3>
                     <p className="text-xs text-gray-500 font-medium">Regional Profitability Projections per Acre.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 bg-white dark:bg-black/20 px-5 py-2.5 rounded-2xl border border-black/5 dark:border-white/10">
                  <span className={`text-xs font-bold uppercase ${result.profitability.riskColor}`}>{result.profitability.riskLevel} Risk</span>
               </div>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                     <Zap size={14} className="text-blue-500" />
                     <span className="text-[10px] font-jakarta font-bold uppercase tracking-[0.1em]">Target Yield</span>
                  </div>
                  <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{result.profitability.expectedYieldPerAcre}</div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                     <Wallet size={14} className="text-red-400" />
                     <span className="text-[10px] font-jakarta font-bold uppercase tracking-[0.1em]">Input Costs</span>
                  </div>
                  <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{result.profitability.costOfCultivation}</div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                     <TrendingUp size={14} className="text-gold" />
                     <span className="text-[10px] font-jakarta font-bold uppercase tracking-[0.1em]">Gross Value</span>
                  </div>
                  <div className="text-3xl font-outfit font-bold text-gold">{result.profitability.marketValue}</div>
               </div>
               <div className="p-6 rounded-3xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                     <CheckCircle2 size={14} />
                     <span className="text-[10px] font-jakarta font-bold uppercase tracking-[0.1em]">Expected Surplus</span>
                  </div>
                  <div className="text-4xl font-outfit font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{result.profitability.netProfit}</div>
               </div>
            </div>
         </motion.div>

         {/* EXPORT ACTIONS */}
         <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-xl no-print">
            <button 
              onClick={onReset}
              className="text-sm font-jakarta font-bold text-gray-500 hover:text-gold transition-colors flex items-center gap-2 px-6"
            >
               Analyse Different Field Parameters
            </button>
            <div className="flex items-center gap-3 flex-wrap">
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setShowCropCalendar(true)}
                 title="View Crop Schedule"
                 className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all text-[10px] font-bold tracking-widest"
               >
                 <CalendarDays size={18} /> CROP CALENDAR
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleSave}
                 title="Save Report"
                 className={`p-4 rounded-2xl border border-black/10 dark:border-white/10 transition-all ${isSaved ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gold hover:text-black'}`}
               >
                 {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleExportPDF}
                 disabled={isExporting}
                 title="Download PDF Report"
                 className="flex items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gold hover:text-black transition-all min-w-[3.5rem]"
               >
                 {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleWhatsAppExport}
                 className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500 text-white font-bold tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
               >
                 EXPORT TO WHATSAPP <Share2 size={18} />
               </motion.button>
            </div>
         </motion.div>

       </motion.div>
    </section>

    {showCropCalendar && (
      <CropCalendar
        cropName={result.cropName}
        duration={result.duration}
        state=""
        onClose={() => setShowCropCalendar(false)}
      />
    )}
    </>
  );
};

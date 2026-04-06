
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShoppingBag, Star, Zap, ShoppingCart,
  Filter, Search, ChevronRight, TrendingUp, Info,
  X, Plus, Minus, Trash2, CreditCard, Truck,
  CheckCircle2, ArrowRight, Wallet, Activity,
  Sprout, FlaskConical, Cpu, ThermometerSun, Droplets,
  Shield, Clock, Award, ArrowUpDown, Leaf,
  Bug, Headphones
} from 'lucide-react';
import { Product, ProductType, ThemeMode, CartItem } from '../types';
import { MANDI_RATES } from '../constants';
import { useToast } from './Toast';

const PRODUCTS: Product[] = [
  // --- SEEDS (Text-only, no images) ---
  { id: 's1', name: 'Rice (Paddy) Seeds', brand: 'AgriFuture Elite', type: 'Seed', basePrice: 2300, unit: 'Quintal', image: '', description: 'Certified high-yield paddy seeds for Kharif season.', marketLinked: true, rating: 4.8 },
  { id: 's2', name: 'Premium Wheat Seeds', brand: 'AgriFuture Elite', type: 'Seed', basePrice: 2425, unit: 'Quintal', image: '', description: 'Certified Sharbati wheat seeds with 98% germination.', marketLinked: true, rating: 5.0 },
  { id: 's3', name: 'Hybrid Maize Gold', brand: 'AgriFuture Elite', type: 'Seed', basePrice: 2225, unit: 'Quintal', image: '', description: 'Drought resistant hybrid maize for dual purpose.', marketLinked: true, rating: 4.7 },
  { id: 's4', name: 'Malting Barley Seeds', brand: 'BrewMaster', type: 'Seed', basePrice: 1980, unit: 'Quintal', image: '', description: 'Industrial grade barley for premium malting.', marketLinked: true, rating: 4.5 },
  { id: 's5', name: 'Pearl Millet (Bajra)', brand: 'Rajasthan Gold', type: 'Seed', basePrice: 2625, unit: 'Quintal', image: '', description: 'Arid zone specialist for dryland farming.', marketLinked: true, rating: 4.8 },
  { id: 's6', name: 'Sorghum (Jowar) Seeds', brand: 'Deccan Seeds', type: 'Seed', basePrice: 3371, unit: 'Quintal', image: '', description: 'Best for grain and nutritious cattle fodder.', marketLinked: true, rating: 4.6 },
  { id: 's7', name: 'Finger Millet (Ragi)', brand: 'Kavery Bio', type: 'Seed', basePrice: 4290, unit: 'Quintal', image: '', description: 'Calcium rich traditional millet seeds.', marketLinked: true, rating: 4.9 },
  { id: 's8', name: 'Yellow Soybean Seeds', brand: 'Malwa Seeds', type: 'Seed', basePrice: 4892, unit: 'Quintal', image: '', description: 'High oil-content shattering resistant pods.', marketLinked: true, rating: 4.7 },
  { id: 's9', name: 'Bt Cotton Seeds', brand: 'Nuziveedu', type: 'Seed', basePrice: 7521, unit: 'Quintal', image: '', description: 'Bollworm resistant long staple cotton.', marketLinked: true, rating: 4.8 },
  { id: 's10', name: 'Sugarcane Sets', brand: 'SugarTech', type: 'Seed', basePrice: 340, unit: 'Quintal', image: '', description: 'High sugar recovery variety sets.', marketLinked: true, rating: 4.4 },
  { id: 's11', name: 'Turmeric Rhizomes', brand: 'Erode Gold', type: 'Seed', basePrice: 13500, unit: 'Quintal', image: '', description: 'Curcumin-rich seed rhizomes.', marketLinked: true, rating: 5.0 },
  { id: 's12', name: 'Seed Potato (Jyoti)', brand: 'Shimla Cold', type: 'Seed', basePrice: 1450, unit: 'Quintal', image: '', description: 'Disease-free potato seeds from Shimla.', marketLinked: true, rating: 4.6 },
  { id: 's13', name: 'Red Onion Seeds', brand: 'Nasik Pride', type: 'Seed', basePrice: 2200, unit: 'Quintal', image: '', description: 'Best Nashik dark red variety.', marketLinked: true, rating: 4.9 },
  { id: 's14', name: 'Hybrid Tomato Seeds', brand: 'Precision Bio', type: 'Seed', basePrice: 1800, unit: 'Quintal', image: '', description: 'Determinate variety for bulk production.', marketLinked: true, rating: 4.7 },
  { id: 's15', name: 'Yellow Mustard Seeds', brand: 'AgriFuture Elite', type: 'Seed', basePrice: 5950, unit: 'Quintal', image: '', description: 'High oil content Rabi oilseed.', marketLinked: true, rating: 4.8 },
  { id: 's16', name: 'Groundnut (Bold)', brand: 'Gujarat Gold', type: 'Seed', basePrice: 6783, unit: 'Quintal', image: '', description: 'Bold variety with high protein content.', marketLinked: true, rating: 4.7 },
  { id: 's17', name: 'Moong Dal Seeds', brand: 'Kisan Shakti', type: 'Seed', basePrice: 8682, unit: 'Quintal', image: '', description: 'Early maturing green gram seeds.', marketLinked: true, rating: 4.9 },
  { id: 's18', name: 'Urad Dal Seeds', brand: 'Latur Special', type: 'Seed', basePrice: 7400, unit: 'Quintal', image: '', description: 'Best for papad and culinary use.', marketLinked: true, rating: 4.6 },
  { id: 's19', name: 'Tur (Arhar) Seeds', brand: 'Karnataka Elite', type: 'Seed', basePrice: 7550, unit: 'Quintal', image: '', description: 'Foundation seeds for Indian pulses.', marketLinked: true, rating: 4.8 },
  { id: 's20', name: 'Chana (Gram) Seeds', brand: 'Vidisha Gold', type: 'Seed', basePrice: 5650, unit: 'Quintal', image: '', description: 'Rabi season king protein source.', marketLinked: true, rating: 4.7 },
  { id: 's21', name: 'Masoor (Lentil) Seeds', brand: 'Patna Special', type: 'Seed', basePrice: 6700, unit: 'Quintal', image: '', description: 'Fast cooking high fiber lentils.', marketLinked: true, rating: 4.6 },
  { id: 's22', name: 'Garlic Bulbs (Seed)', brand: 'Mandsaur Elite', type: 'Seed', basePrice: 16500, unit: 'Quintal', image: '', description: 'High pungency seed garlic bulbs.', marketLinked: true, rating: 4.9 },
  { id: 's23', name: 'Fresh Ginger (Seed)', brand: 'Wayanad Special', type: 'Seed', basePrice: 6200, unit: 'Quintal', image: '', description: 'Organic certified ginger rhizomes.', marketLinked: true, rating: 4.8 },
  { id: 's24', name: 'Guntur Red Chili Seeds', brand: 'Andhra Spice', type: 'Seed', basePrice: 18000, unit: 'Quintal', image: '', description: 'Extra hot Guntur variety seeds.', marketLinked: true, rating: 4.8 },
  { id: 's25', name: 'Coriander Seeds', brand: 'Kota Pride', type: 'Seed', basePrice: 6800, unit: 'Quintal', image: '', description: 'Dual use coriander for leaves/seed.', marketLinked: true, rating: 4.7 },
  { id: 's26', name: 'Jeera (Cumin) Seeds', brand: 'Unjha Supreme', type: 'Seed', basePrice: 24500, unit: 'Quintal', image: '', description: 'World famous Unjha cumin seeds.', marketLinked: true, rating: 4.9 },
  { id: 's27', name: 'Fennel (Saunf) Seeds', brand: 'AgriFuture Elite', type: 'Seed', basePrice: 12000, unit: 'Quintal', image: '', description: 'Aromatic fennel for premium export.', marketLinked: true, rating: 4.8 },
  { id: 's28', name: 'Fenugreek Seeds', brand: 'Rajasthan Methi', type: 'Seed', basePrice: 5500, unit: 'Quintal', image: '', description: 'Medicinal grade methi seeds.', marketLinked: true, rating: 4.7 },
  { id: 's29', name: 'Black Pepper Vines', brand: 'Idukki Gold', type: 'Seed', basePrice: 65000, unit: 'Quintal', image: '', description: 'King of spices - Malabar Pepper.', marketLinked: true, rating: 5.0 },
  { id: 's30', name: 'Green Cardamom Seeds', brand: 'Coorg Special', type: 'Seed', basePrice: 125000, unit: 'Quintal', image: '', description: 'Elite green cardamom seeds.', marketLinked: true, rating: 5.0 },
  { id: 's31', name: 'Arabica Coffee Seeds', brand: 'Chikmagalur', type: 'Seed', basePrice: 45000, unit: 'Quintal', image: '', description: 'High altitude Arabica coffee.', marketLinked: true, rating: 4.9 },
  { id: 's32', name: 'CTC Tea Grafts', brand: 'Assam Gold', type: 'Seed', basePrice: 25000, unit: 'Quintal', image: '', description: 'High yield Assam tea varieties.', marketLinked: true, rating: 4.8 },
  { id: 's33', name: 'Virginia Tobacco Seeds', brand: 'Guntur Elite', type: 'Seed', basePrice: 18000, unit: 'Quintal', image: '', description: 'Flue-cured Virginia tobacco.', marketLinked: true, rating: 4.6 },
  { id: 's34', name: 'Jute Seeds (Tossa)', brand: 'Bengal Fiber', type: 'Seed', basePrice: 5200, unit: 'Quintal', image: '', description: 'Premium golden fiber jute seeds.', marketLinked: true, rating: 4.7 },
  { id: 's35', name: 'Sunflower Seeds', brand: 'Latur Special', type: 'Seed', basePrice: 7280, unit: 'Quintal', image: '', description: 'Photo-insensitive oilseed hybrid.', marketLinked: true, rating: 4.7 },
  { id: 's36', name: 'Safflower Seeds', brand: 'Parbhani Gold', type: 'Seed', basePrice: 5940, unit: 'Quintal', image: '', description: 'Drought tolerant oilseed seeds.', marketLinked: true, rating: 4.6 },
  { id: 's37', name: 'Til (Sesame) Seeds', brand: 'Gujarat Special', type: 'Seed', basePrice: 9267, unit: 'Quintal', image: '', description: 'White sesame seeds for export.', marketLinked: true, rating: 4.8 },
  { id: 's38', name: 'Castor Seeds (Hybrid)', brand: 'Junagadh Elite', type: 'Seed', basePrice: 7200, unit: 'Quintal', image: '', description: 'High oil castor hybrid seeds.', marketLinked: true, rating: 4.7 },
  { id: 's39', name: 'Guar Seed (Gum Grade)', brand: 'Merta Special', type: 'Seed', basePrice: 5400, unit: 'Quintal', image: '', description: 'Export grade guar gum seeds.', marketLinked: true, rating: 4.8 },
  { id: 's40', name: 'Cauliflower Seeds', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 3500, unit: 'Quintal', image: '', description: 'Snowball variety cauliflower.', marketLinked: true, rating: 4.7 },
  { id: 's41', name: 'Cabbage Seeds', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 2800, unit: 'Quintal', image: '', description: 'Tight-head winter cabbage.', marketLinked: true, rating: 4.8 },
  { id: 's42', name: 'Brinjal Seeds (Black)', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 1500, unit: 'Quintal', image: '', description: 'Pest resistant round brinjal.', marketLinked: true, rating: 4.6 },
  { id: 's43', name: 'Okra (Bhindi) Seeds', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 3200, unit: 'Quintal', image: '', description: 'YVMV resistant okra hybrid.', marketLinked: true, rating: 4.8 },
  { id: 's44', name: 'Pea (Matar) Seeds', brand: 'Kashi Special', type: 'Seed', basePrice: 4500, unit: 'Quintal', image: '', description: 'Sweet early maturing garden peas.', marketLinked: true, rating: 4.9 },
  { id: 's45', name: 'Carrot Seeds (Red)', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 1600, unit: 'Quintal', image: '', description: 'Deep red high sugar carrots.', marketLinked: true, rating: 4.8 },
  { id: 's46', name: 'Radish Seeds (White)', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 1200, unit: 'Quintal', image: '', description: 'Pungent long white radish.', marketLinked: true, rating: 4.7 },
  { id: 's47', name: 'Spinach Seeds', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 1000, unit: 'Quintal', image: '', description: 'Broad leaf nutrient rich spinach.', marketLinked: true, rating: 4.8 },
  { id: 's48', name: 'Banana Suckers', brand: 'Jalgaon Gold', type: 'Seed', basePrice: 2500, unit: 'Quintal', image: '', description: 'G9 tissue culture suckers.', marketLinked: true, rating: 4.9 },
  { id: 's49', name: 'Mango Grafts', brand: 'Alphonso Elite', type: 'Seed', basePrice: 6000, unit: 'Quintal', image: '', description: 'Certified Ratnagiri Alphonso.', marketLinked: true, rating: 5.0 },
  { id: 's50', name: 'Grape Cuttings', brand: 'Nashik Grape', type: 'Seed', basePrice: 8500, unit: 'Quintal', image: '', description: 'Export quality seedless grapes.', marketLinked: true, rating: 4.9 },
  { id: 's51', name: 'Pomegranate Grafts', brand: 'Bhagwa Special', type: 'Seed', basePrice: 12000, unit: 'Quintal', image: '', description: 'Premium deep red pomegranate.', marketLinked: true, rating: 4.9 },
  { id: 's52', name: 'Papaya Seeds (Hybrid)', brand: 'Red Lady', type: 'Seed', basePrice: 2200, unit: 'Quintal', image: '', description: 'Taiwan Red Lady 786 seeds.', marketLinked: true, rating: 4.9 },
  { id: 's53', name: 'Watermelon Seeds', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 1500, unit: 'Quintal', image: '', description: 'Icebox type hybrid watermelon.', marketLinked: true, rating: 4.8 },
  { id: 's54', name: 'Muskmelon Seeds', brand: 'AgriFuture Veg', type: 'Seed', basePrice: 2500, unit: 'Quintal', image: '', description: 'High brix aromatic muskmelon.', marketLinked: true, rating: 4.7 },
  { id: 's55', name: 'Cabbage Hybrid F1', brand: 'Seminis Elite', type: 'Seed', basePrice: 3100, unit: 'Quintal', image: '', description: 'Global standard F1 cabbage.', marketLinked: true, rating: 4.8 },

  // --- FERTILIZERS ---
  { id: 'f1', name: 'Nano Urea (Liquid)', brand: 'IFFCO Eco', type: 'Fertilizer', basePrice: 240, unit: '500ml Bottle', image: '', description: 'Advanced nitrogen delivery system. One 500ml bottle replaces one bag of conventional urea.', rating: 5.0 },
  { id: 'f2', name: 'Bio-Organic NPK Mix', brand: 'GreenEarth', type: 'Fertilizer', basePrice: 850, unit: '50kg Bag', image: '', description: '100% natural organic fertilizer enriched with beneficial soil microbes.', rating: 4.8 },
  { id: 'f3', name: 'Seaweed Liquid Extract', brand: 'Sagarika Bio', type: 'Fertilizer', basePrice: 650, unit: '1L Bottle', image: '', description: 'Organic growth promoter with over 60 natural nutrients and amino acids.', rating: 4.9 },
  { id: 'f4', name: 'DAP (Di-Ammonium Phosphate)', brand: 'IFFCO Classic', type: 'Fertilizer', basePrice: 1350, unit: '50kg Bag', image: '', description: 'Essential phosphorus source for root development and early crop vigour.', rating: 4.7 },
  { id: 'f5', name: 'Muriate of Potash (MOP)', brand: 'IPL Gold', type: 'Fertilizer', basePrice: 1700, unit: '50kg Bag', image: '', description: 'Potassium-rich fertilizer for fruit quality, disease resistance, and water retention.', rating: 4.6 },
  { id: 'f6', name: 'Premium Vermicompost', brand: 'EarthWorm Pro', type: 'Fertilizer', basePrice: 450, unit: '25kg Bag', image: '', description: 'Nutrient-dense earthworm castings improving soil structure, aeration, and microbial life.', rating: 4.9 },
  { id: 'f7', name: 'Humic Acid Granules', brand: 'HumiGold', type: 'Fertilizer', basePrice: 520, unit: '5kg Pack', image: '', description: 'Improves nutrient uptake efficiency by 30%. Enhances root zone CEC and water holding capacity.', rating: 4.8 },
  { id: 'f8', name: 'Zinc Sulphate (21%)', brand: 'Zuari Agri', type: 'Fertilizer', basePrice: 180, unit: '5kg Pack', image: '', description: 'Micronutrient corrector for zinc-deficient soils. Essential for rice, wheat, and maize.', rating: 4.5 },
  { id: 'f9', name: 'Calcium Nitrate', brand: 'Yara Liva', type: 'Fertilizer', basePrice: 950, unit: '25kg Bag', image: '', description: 'Water-soluble calcium and nitrogen for drip fertigation. Prevents blossom end rot.', rating: 4.7 },
  { id: 'f10', name: 'Neem Cake (Organic)', brand: 'NeemGuard', type: 'Fertilizer', basePrice: 380, unit: '10kg Bag', image: '', description: 'Natural soil enricher and pest deterrent. Improves soil fertility while repelling nematodes.', rating: 4.8 },

  // --- EQUIPMENT (Actual images retained) ---
  {
    id: 'e1',
    name: 'Precision Soil Sensor v4',
    brand: 'AgriFuture Tech',
    type: 'Equipment',
    basePrice: 4299,
    unit: 'Unit',
    image: '/equipment-soil-sensor.svg',
    description: 'Cloud-integrated probe for real-time NPK and moisture telemetry.',
    rating: 4.9
  },
  {
    id: 'e2',
    name: 'Met-Station Pro-Sync',
    brand: 'AgriFuture Tech',
    type: 'Equipment',
    basePrice: 28499,
    unit: 'Unit',
    image: '/equipment-weather-station.svg',
    description: 'Hyper-local weather grid measuring barometric pressure, wind, and rainfall.',
    rating: 5.0
  },
  {
    id: 'e3',
    name: 'Hydra-Flow Smart Valve',
    brand: 'Netafim Smart',
    type: 'Equipment',
    basePrice: 5800,
    unit: 'Unit',
    image: '/equipment-smart-valve.svg',
    description: 'AI-controlled valve that manages water flow based on regional evapotranspiration.',
    rating: 4.7
  },
  {
    id: 'e4',
    name: 'AgriDrone X1 Sprayer',
    brand: 'AgriFuture Tech',
    type: 'Equipment',
    basePrice: 185000,
    unit: 'Unit',
    image: '/equipment-drone.svg',
    description: '10L payload agricultural drone with RTK GPS. Covers 1 acre in 10 minutes with precision spraying.',
    rating: 4.9
  },
  {
    id: 'e5',
    name: 'Solar Water Pump (3HP)',
    brand: 'Tata Solar',
    type: 'Equipment',
    basePrice: 95000,
    unit: 'Unit',
    image: '/equipment-solar-pump.svg',
    description: 'Off-grid solar powered submersible pump. Zero electricity bills, 25-year panel warranty.',
    rating: 5.0
  },
  {
    id: 'e6',
    name: 'Smart Seed Drill',
    brand: 'Mahindra Agri',
    type: 'Equipment',
    basePrice: 42000,
    unit: 'Unit',
    image: '/equipment-seed-drill.svg',
    description: 'GPS-guided variable rate seeder with automatic depth control and seed spacing optimization.',
    rating: 4.8
  },
  {
    id: 'e7',
    name: 'Portable Soil Test Kit',
    brand: 'AgriFuture Tech',
    type: 'Equipment',
    basePrice: 3499,
    unit: 'Kit',
    image: '/equipment-soil-kit.svg',
    description: 'Digital NPK, pH, EC, and moisture testing. Results in 60 seconds via Bluetooth app.',
    rating: 4.7
  },
  {
    id: 'e8',
    name: 'GPS Field Mapper Pro',
    brand: 'TrimbleAg',
    type: 'Equipment',
    basePrice: 18500,
    unit: 'Unit',
    image: '/equipment-gps-mapper.svg',
    description: 'Sub-meter accuracy field boundary mapping with area calculator and zone management.',
    rating: 4.8
  },

  // --- CROP PROTECTION ---
  { id: 'p1', name: 'Neem Oil Bio-Pesticide', brand: 'NeemGuard', type: 'Protection', basePrice: 420, unit: '1L Bottle', image: '', description: 'Cold-pressed azadirachtin-rich neem extract. Controls 200+ pests organically with zero residue.', rating: 4.9 },
  { id: 'p2', name: 'Trichoderma Bio-Fungicide', brand: 'BioShield', type: 'Protection', basePrice: 350, unit: '1kg Pack', image: '', description: 'Living fungal antagonist preventing root rot, wilt, and damping off. Soil and seed treatment.', rating: 4.8 },
  { id: 'p3', name: 'Beauveria Bassiana', brand: 'BioShield', type: 'Protection', basePrice: 480, unit: '1kg Pack', image: '', description: 'Entomopathogenic fungus targeting whitefly, thrips, aphids, and borers without chemical residue.', rating: 4.7 },
  { id: 'p4', name: 'Copper Oxychloride (50%)', brand: 'Bayer CropSci', type: 'Protection', basePrice: 580, unit: '500g Pack', image: '', description: 'Broad-spectrum contact fungicide for blight, downy mildew, and bacterial leaf spot.', rating: 4.6 },
  { id: 'p5', name: 'Imidacloprid (17.8% SL)', brand: 'Syngenta', type: 'Protection', basePrice: 650, unit: '250ml Bottle', image: '', description: 'Systemic insecticide for sucking pests — aphids, jassids, and brown plant hopper.', rating: 4.5 },
  { id: 'p6', name: 'Glyphosate Herbicide (41%)', brand: 'Excel Crop', type: 'Protection', basePrice: 520, unit: '1L Bottle', image: '', description: 'Non-selective post-emergent weedicide for plantation crops, orchards, and non-crop areas.', rating: 4.4 },
  { id: 'p7', name: 'Yellow Sticky Traps (Pack of 50)', brand: 'TrapMaster', type: 'Protection', basePrice: 290, unit: 'Pack', image: '', description: 'UV-resistant dual-sided adhesive traps for whitefly, aphids, leaf miners, and thrips monitoring.', rating: 4.8 },
  { id: 'p8', name: 'Pheromone Lure Trap Set', brand: 'PestWatch', type: 'Protection', basePrice: 380, unit: 'Set of 5', image: '', description: 'Species-specific pheromone traps for fruit fly, bollworm, and stem borer mass trapping.', rating: 4.7 },

  // --- SERVICES ---
  { id: 'sv1', name: 'Comprehensive Soil Test Report', brand: 'AgriFuture Labs', type: 'Service', basePrice: 999, unit: 'Report', image: '', description: 'Lab analysis of 12 parameters — NPK, pH, EC, OC, micronutrients. Includes fertilizer dosage recommendation.', rating: 5.0 },
  { id: 'sv2', name: 'Drone Aerial Survey (per acre)', brand: 'AgriFuture Drone', type: 'Service', basePrice: 1500, unit: 'Acre', image: '', description: 'NDVI multispectral mapping, crop health assessment, pest hotspot detection with AI report.', rating: 4.9 },
  { id: 'sv3', name: 'AI Crop Advisory (Season)', brand: 'AgriFuture AI', type: 'Service', basePrice: 2499, unit: 'Season', image: '', description: 'Personalized weekly AI-generated crop calendar, pest alerts, irrigation scheduling, and market timing.', rating: 4.9 },
  { id: 'sv4', name: 'Pradhan Mantri Fasal Bima', brand: 'AgriFuture Assist', type: 'Service', basePrice: 750, unit: 'Application', image: '', description: 'End-to-end PMFBY crop insurance filing assistance. Document preparation, submission, and claim follow-up.', rating: 4.8 },
];

type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'name';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Seed: <Sprout size={40} />,
  Fertilizer: <FlaskConical size={40} />,
  Protection: <Bug size={40} />,
  Service: <Headphones size={40} />,
};

const SERVICE_BENEFITS = [
  { icon: <Truck size={28} />, title: 'Pan-India Logistics', desc: 'Free doorstep delivery on orders above ₹5,000 across all states', gradient: 'from-amber-500/20 to-orange-500/10', accent: 'text-amber-500', border: 'border-amber-500/20', image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=60' },
  { icon: <Shield size={28} />, title: 'ICAR Certified Seeds', desc: 'Every batch lab-tested with 98%+ germination & govt quality seal', gradient: 'from-emerald-500/20 to-green-500/10', accent: 'text-emerald-500', border: 'border-emerald-500/20', image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=400&q=60' },
  { icon: <TrendingUp size={28} />, title: 'Live Mandi Pricing', desc: 'Real-time APMC mandi rates synced to regulate all product prices', gradient: 'from-blue-500/20 to-cyan-500/10', accent: 'text-blue-500', border: 'border-blue-500/20', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=60' },
  { icon: <Clock size={28} />, title: 'Express 48hr Dispatch', desc: 'Packed within 24 hours, delivered to your nearest hub in 48 hours', gradient: 'from-violet-500/20 to-purple-500/10', accent: 'text-violet-500', border: 'border-violet-500/20', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=60' },
  { icon: <Award size={28} />, title: 'Kisan Trust Promise', desc: '100% replacement guarantee if germination falls below stated rate', gradient: 'from-gold/20 to-yellow-500/10', accent: 'text-gold', border: 'border-gold/20', image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=400&q=60' },
  { icon: <Leaf size={28} />, title: 'Organic & Sustainable', desc: 'Eco-certified inputs promoting soil health & sustainable farming', gradient: 'from-teal-500/20 to-emerald-500/10', accent: 'text-teal-500', border: 'border-teal-500/20', image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=400&q=60' },
];

export const Shop: React.FC<{ onBack: () => void, theme: ThemeMode }> = ({ onBack, theme }) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<ProductType | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  const avgMandiChange = useMemo(() => {
    return MANDI_RATES.reduce((acc, curr) => acc + curr.change, 0) / MANDI_RATES.length;
  }, []);

  const regulatedProducts = useMemo(() => {
    return PRODUCTS.map(p => {
      if (!p.marketLinked) return p;
      const adjustment = 1 + (avgMandiChange / 100);
      return { ...p, basePrice: Math.round(p.basePrice * adjustment) };
    });
  }, [avgMandiChange]);

  const filtered = useMemo(() => {
    const list = regulatedProducts.filter(p =>
      (filter === 'All' || p.type === filter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()))
    );
    switch (sortBy) {
      case 'price-low': return [...list].sort((a, b) => a.basePrice - b.basePrice);
      case 'price-high': return [...list].sort((a, b) => b.basePrice - a.basePrice);
      case 'rating': return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'name': return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default: return list;
    }
  }, [regulatedProducts, filter, search, sortBy]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.basePrice * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 250;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    setCheckoutStep('details');
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
  };

  const confirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      setCheckoutStep('success');
      setCart([]);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create order on backend
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      });
      const order = await res.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_dummy_id',
        amount: order.amount,
        currency: order.currency,
        name: "AgriFuture Luxe",
        description: "Agricultural Assets Purchase",
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify payment on backend
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.status === 'success') {
            setCheckoutStep('success');
            setCart([]);
          } else {
            toast("Payment verification failed!", 'error');
          }
        },
        prefill: {
          name: "Farmer Name",
          email: "farmer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#D4AF37"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment Error:", error);
      toast("Failed to initiate payment. Please try again.", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 animate-in fade-in duration-700 bg-ivory dark:bg-obsidian">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors mb-4 text-[10px] font-bold tracking-[0.3em] uppercase"
            >
              <ArrowLeft size={14} /> DASHBOARD
            </button>
            <h1 className="text-6xl font-outfit font-bold text-gray-900 dark:text-white tracking-tighter">AgriStore Luxe</h1>
            <p className="text-gray-500 mt-2 text-lg italic">Certified inputs with real-time market synchronization.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
             <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-inner">
                <Activity size={14} className="text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-jakarta font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
                  Mandi-Linkage: {avgMandiChange >= 0 ? '+' : ''}{avgMandiChange.toFixed(2)}% ACTIVE
                </span>
             </div>
             
             <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/10 overflow-x-auto whitespace-nowrap shadow-sm">
                {['All', 'Seed', 'Fertilizer', 'Equipment', 'Protection', 'Service'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat as any)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all duration-300 ${
                      filter === cat 
                      ? 'bg-gold text-black shadow-2xl scale-105' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Search Strip */}
        <div className="mb-12 relative max-w-xl">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
           <input 
             type="text" 
             placeholder="Search premium inventory..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 focus:ring-2 focus:ring-gold/30 outline-none font-medium text-base transition-all text-gray-900 dark:text-white shadow-xl"
           />
        </div>

        {/* Services Banner */}
        <div className="mb-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICE_BENEFITS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 120 }}
              className={`relative overflow-hidden rounded-3xl border ${s.border} bg-white dark:bg-white/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group cursor-default`}
            >
              <div className="flex items-stretch">
                {/* Image */}
                <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient} mix-blend-multiply`}></div>
                  <div className={`absolute inset-0 flex items-center justify-center ${s.accent} drop-shadow-lg`}>
                    {s.icon}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-grow p-5">
                  <div className={`text-[11px] font-bold tracking-[0.2em] uppercase mb-1.5 ${s.accent}`}>{s.title}</div>
                  <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sort & Count Bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-500">
            Showing <span className="text-gray-900 dark:text-white">{filtered.length}</span> {filtered.length === 1 ? 'product' : 'products'}
            {filter !== 'All' && <span className="text-gold ml-1">in {filter}s</span>}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm font-bold bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-gold/30 text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {filtered.map((product) => (
             <div 
               key={product.id}
               className="group relative bg-white dark:bg-charcoal rounded-[3rem] overflow-hidden border border-black/5 dark:border-white/10 hover:border-gold/40 transition-all duration-700 shadow-xl hover:shadow-[0_0_80px_rgba(212,175,55,0.1)] hover:-translate-y-3 flex flex-col"
             >
                {/* Image / Icon Header */}
                {product.type === 'Equipment' && product.image ? (
                   <div className="h-72 relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      <div className="absolute top-6 left-6 flex gap-3">
                        <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-bold px-4 py-1.5 rounded-full border border-white/20 tracking-widest uppercase">
                           {product.type}
                        </span>
                      </div>
                   </div>
                ) : (
                   <div className={`h-28 relative overflow-hidden flex items-center justify-center ${
                     { Seed: 'bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent',
                       Fertilizer: 'bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent',
                       Protection: 'bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent',
                       Service: 'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent'
                     }[product.type] || ''
                   }`}>
                      <div className={`opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 ${
                        { Seed: 'text-emerald-500', Fertilizer: 'text-blue-500', Protection: 'text-red-500', Service: 'text-violet-500' }[product.type] || 'text-gray-500'
                      }`}>
                        {CATEGORY_ICONS[product.type]}
                      </div>
                      <div className="absolute top-4 left-6">
                        <span className={`text-[9px] font-bold px-3 py-1 rounded-full tracking-widest uppercase border ${
                          { Seed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                            Fertilizer: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                            Protection: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                            Service: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
                          }[product.type] || ''
                        }`}>
                          {product.type}
                        </span>
                      </div>
                   </div>
                )}

                {/* Info Container */}
                <div className={`p-10 flex flex-col flex-grow ${product.type !== 'Equipment' ? 'min-h-[280px]' : ''}`}>
                   <div className="mb-4">
                      <div className="text-[10px] font-jakarta font-bold text-gold-dim tracking-[0.3em] uppercase">{product.brand}</div>
                   </div>
                   
                   <h3 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-2 group-hover:text-gold transition-colors leading-tight">
                     {product.name}
                   </h3>

                   {product.rating && (
                     <div className="flex items-center gap-2 mb-3">
                       <div className="flex gap-0.5">
                         {[1, 2, 3, 4, 5].map(s => (
                           <Star
                             key={s}
                             size={12}
                             className={s <= Math.round(product.rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
                           />
                         ))}
                       </div>
                       <span className="text-[10px] font-bold text-gray-500">{product.rating.toFixed(1)}</span>
                     </div>
                   )}

                   <p className="text-sm text-gray-500 dark:text-gray-400 font-inter leading-relaxed mb-8 flex-grow">
                     {product.description}
                   </p>

                   {product.marketLinked && (
                      <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded-full tracking-widest uppercase self-start animate-pulse">
                         <TrendingUp size={10} /> MARKET SYNC ACTIVE
                      </div>
                   )}

                   <div className="pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                           <div className="text-[9px] font-jakarta font-bold text-gray-400 uppercase tracking-widest">REGULATED PRICE</div>
                           {product.marketLinked && <Info size={12} className="text-emerald-500 cursor-help" />}
                        </div>
                        <div className="flex items-end gap-3">
                          <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">
                            ₹{product.basePrice.toLocaleString('en-IN')}
                          </div>
                          {product.marketLinked && (
                            <div className={`text-[10px] font-bold mb-1.5 px-2 py-0.5 rounded-md ${avgMandiChange >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {avgMandiChange >= 0 ? '+' : ''}{avgMandiChange.toFixed(1)}% ADJ.
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Per {product.unit}</div>
                      </div>
                      
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-14 h-14 rounded-2xl bg-charcoal dark:bg-white text-white dark:text-black flex items-center justify-center hover:bg-gold dark:hover:bg-gold hover:text-black transition-all shadow-2xl group/btn active:scale-90"
                      >
                         <Plus size={24} className="group-hover/btn:scale-125 transition-transform" />
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-40 text-center animate-in fade-in zoom-in-95">
             <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ShoppingBag size={40} className="text-gray-400" />
             </div>
             <h3 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">No items found</h3>
             <p className="text-gray-500 mt-2 max-w-sm mx-auto">Try refining your search criteria or category filter.</p>
          </div>
        )}
      </div>

      {/* Cart Launcher */}
      {cart.length > 0 && (
        <div className="fixed bottom-10 right-10 z-50">
           <button 
             onClick={() => setIsCartOpen(true)}
             className="h-20 px-10 rounded-full bg-charcoal dark:bg-gold text-white dark:text-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-5 hover:scale-110 hover:-translate-y-2 transition-all group font-jakarta font-bold tracking-[0.2em] border border-white/10 dark:border-black/10"
           >
              <div className="relative">
                <ShoppingBag size={24} />
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-charcoal dark:border-gold shadow-lg">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              BASKET
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      )}

      {/* Cart Sidepanel */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] animate-in fade-in duration-500" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-charcoal shadow-2xl z-[101] animate-in slide-in-from-right duration-700 flex flex-col border-l border-black/5 dark:border-white/10">
            <div className="p-10 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
               <h2 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white flex items-center gap-4">
                  <ShoppingBag className="text-gold" size={32} /> Your Basket
               </h2>
               <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                  <X size={24} />
               </button>
            </div>

            <div className="flex-grow overflow-y-auto p-10 space-y-8">
               {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <ShoppingCart size={64} className="mb-6" />
                    <p className="font-bold tracking-widest uppercase text-xs">Basket is empty</p>
                 </div>
               ) : cart.map((item) => (
                 <div key={item.product.id} className="flex gap-6 group animate-in slide-in-from-right-4">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border border-black/5 dark:border-white/5 shrink-0 bg-gray-50 dark:bg-white/5 flex items-center justify-center shadow-inner">
                       {item.product.type === 'Equipment' && item.product.image ? (
                         <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                       ) : (
                         <div className="p-4 bg-black/5 dark:bg-white/5 rounded-full">
                            {{ Seed: <Sprout className="text-emerald-500/40" />, Fertilizer: <FlaskConical className="text-blue-500/40" />, Protection: <Bug className="text-red-500/40" />, Service: <Headphones className="text-violet-500/40" /> }[item.product.type] || <ShoppingBag className="text-gray-500/40" />}
                         </div>
                       )}
                    </div>
                    <div className="flex-grow">
                       <div className="flex justify-between items-start mb-1.5">
                          <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{item.product.name}</h4>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                             <Trash2 size={16} />
                          </button>
                       </div>
                       <div className="text-[9px] text-gold font-bold uppercase tracking-[0.2em] mb-4">{item.product.brand}</div>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl px-3 py-1.5 gap-5 shadow-sm">
                             <button onClick={() => updateQuantity(item.product.id, -1)} className="hover:text-gold transition-colors text-gray-400"><Minus size={14} /></button>
                             <span className="text-sm font-mono font-bold w-6 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.product.id, 1)} className="hover:text-gold transition-colors text-gray-400"><Plus size={14} /></button>
                          </div>
                          <div className="text-lg font-outfit font-bold text-gray-900 dark:text-white">
                             ₹{(item.product.basePrice * item.quantity).toLocaleString()}
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {cart.length > 0 && (
              <div className="p-10 border-t border-black/5 dark:border-white/5 space-y-6 bg-gray-50 dark:bg-black/20">
                 <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                       <span className="tracking-widest uppercase">Subtotal</span>
                       <span className="text-gray-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                       <span className="tracking-widest uppercase">Shipping</span>
                       <span className="text-emerald-500">{shipping === 0 ? 'COMPLIMENTARY' : `₹${shipping}`}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-outfit font-bold border-t border-black/10 dark:border-white/10 pt-4">
                       <span className="text-gray-900 dark:text-white">Total</span>
                       <span className="text-gold">₹{total.toLocaleString()}</span>
                    </div>
                 </div>
                 <button 
                  onClick={handleCheckout}
                  className="w-full py-5 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4"
                 >
                    CHECKOUT <ArrowRight size={20} />
                 </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-obsidian/95 backdrop-blur-2xl animate-in fade-in duration-500" onClick={() => setIsCheckoutOpen(false)}></div>
           
           <div className="relative w-full max-w-5xl bg-white dark:bg-charcoal rounded-[4rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] flex flex-col md:flex-row border border-white/10 h-[85vh] md:h-auto animate-in zoom-in-95 duration-700">
              <div className="flex-grow p-12 md:p-16 overflow-y-auto">
                 {checkoutStep === 'details' ? (
                   <>
                     <div className="mb-12">
                        <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Order Finalization</h2>
                        <p className="text-gray-500 text-base">Securing market-regulated pricing for your agricultural assets.</p>
                     </div>

                     <form onSubmit={confirmOrder} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase ml-1">Kisan Full Name</label>
                              <input required type="text" placeholder="e.g. Balwinder Singh" className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-base font-bold text-gray-900 dark:text-white" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase ml-1">Contact Link</label>
                              <input required type="tel" placeholder="+91 XXXX XXX XXX" className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-base font-bold text-gray-900 dark:text-white" />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase ml-1">Regional Delivery Hub</label>
                           <textarea required rows={3} placeholder="Provide full address including Landmark and Pincode" className="w-full p-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-base font-bold resize-none text-gray-900 dark:text-white leading-relaxed"></textarea>
                        </div>

                         <div className="p-8 rounded-[2.5rem] bg-gold/5 border border-gold/20 space-y-6">
                           <div className="flex items-center gap-3 text-gold mb-2">
                              <Wallet size={20} />
                              <span className="text-[11px] font-bold tracking-[0.3em] uppercase">Escrow / Payment Preference</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div 
                                onClick={() => setPaymentMethod('cod')}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === 'cod' ? 'border-gold bg-gold/10 shadow-lg' : 'border-white/5 bg-black/5'}`}
                              >
                                 <div className={`w-5 h-5 rounded-full border-4 ${paymentMethod === 'cod' ? 'border-gold bg-black' : 'border-gray-500'}`}></div>
                                 <span className="text-sm font-bold text-gray-900 dark:text-white">Cash on Delivery</span>
                              </div>
                              <div 
                                onClick={() => setPaymentMethod('razorpay')}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === 'razorpay' ? 'border-gold bg-gold/10 shadow-lg' : 'border-white/5 bg-black/5'}`}
                              >
                                 <CreditCard size={18} className={paymentMethod === 'razorpay' ? 'text-gold' : 'text-gray-400'} />
                                 <span className="text-sm font-bold text-gray-900 dark:text-white">Razorpay (Digital)</span>
                              </div>
                           </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={isProcessing}
                          className="w-full py-6 rounded-[2rem] bg-charcoal dark:bg-white text-white dark:text-black font-bold tracking-[0.4em] hover:bg-gold dark:hover:bg-gold hover:text-black transition-all duration-500 flex items-center justify-center gap-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] active:scale-95 disabled:opacity-50"
                        >
                           {isProcessing ? 'PROCESSING...' : 'CONFIRM PROTOCOL'} <CheckCircle2 size={24} />
                        </button>
                     </form>
                   </>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in zoom-in-95 duration-1000">
                      <div className="w-32 h-32 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-10 shadow-[0_40px_80px_-15px_rgba(16,185,129,0.5)] animate-bounce">
                         <CheckCircle2 size={64} />
                      </div>
                      <h2 className="text-5xl font-outfit font-bold text-gray-900 dark:text-white mb-4 tracking-tighter">Order Synchronized</h2>
                      <p className="text-gray-500 text-lg max-w-md mb-12 italic">Your premium assets are being routed. Tracking Token: <span className="text-gold font-mono font-bold uppercase not-italic">AFX-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span></p>
                      
                      <div className="flex flex-col gap-4 w-full max-w-sm">
                         <button 
                          onClick={() => setIsCheckoutOpen(false)}
                          className="w-full py-5 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl"
                         >
                            RETURN TO STORE
                         </button>
                         <button 
                          onClick={onBack}
                          className="w-full py-5 rounded-2xl border border-black/5 dark:border-white/10 font-bold tracking-[0.2em] hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 uppercase text-xs"
                         >
                            BACK TO DASHBOARD
                         </button>
                      </div>
                   </div>
                 )}
              </div>

              {checkoutStep === 'details' && (
                <div className="w-full md:w-[380px] bg-gray-50 dark:bg-black/40 p-12 flex flex-col border-l border-black/5 dark:border-white/5">
                   <h3 className="text-[10px] font-jakarta tracking-[0.4em] font-bold text-gray-400 mb-10 uppercase">MANIFEST SUMMARY</h3>
                   
                   <div className="flex-grow space-y-8 overflow-y-auto pr-4 scrollbar-hide">
                      {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center">
                           <div className="flex-grow pr-6">
                              <div className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-1">{item.product.name}</div>
                              <div className="text-[9px] text-gray-400 tracking-widest font-bold uppercase">UNITS: {item.quantity}</div>
                           </div>
                           <div className="font-mono font-bold text-gray-900 dark:text-white text-base">₹{(item.product.basePrice * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                   </div>

                   <div className="mt-10 pt-10 border-t border-black/10 dark:border-white/10 space-y-5">
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 tracking-widest">
                         <span>BASKET SUB</span>
                         <span className="text-gray-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 tracking-widest">
                         <span>HUB ROUTING</span>
                         <span className="text-emerald-500">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                      </div>
                      <div className="flex justify-between text-3xl font-outfit font-bold pt-6 border-t border-black/5 dark:border-white/5">
                         <span className="text-gray-900 dark:text-white">Total</span>
                         <span className="text-gold">₹{total.toLocaleString()}</span>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};


export interface MandiRate {
  crop: string;
  price: number;
  change: number; 
  location: string;
  state: string; 
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainProbability?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserLocation {
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

export interface DiseaseRisk {
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  type: string;
  symptoms: string;
  treatment: string;
  prevention: string;
}

export interface FertilizerPlan {
  name: string;
  dosage: string;
  timing: string;
  costEstimate: string;
  description: string;
}

export interface PricePoint {
  date: string;
  price: number;
  isPeak?: boolean;
}

export interface MarketForecast {
  cropName: string;
  currentPrice: number;
  predictedTrend: 'Bullish' | 'Bearish' | 'Stable';
  volatility: number;
  bestSellingWindow: string;
  expectedPriceJump: string;
  forecastData: PricePoint[];
  advisoryNote: string;
}

export interface PredictionReason {
  feature: string;
  impact: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface DiseaseDetectionResult {
  isValidImage: boolean;
  errorMessage?: string;
  diseaseName: string;
  confidence: number;
  symptoms: string;
  treatment: string;
  prevention: string;
  severity: 'Low' | 'Moderate' | 'High';
  diseaseType: 'Biotic' | 'Abiotic' | 'Nutritional';
  pathogenType: 'Fungal' | 'Bacterial' | 'Viral' | 'Pest' | 'Nematode' | 'Environmental' | 'Deficiency';
  affectedCrops: string;
}

export interface PredictionResult {
  cropName: string;
  cropHindi: string;
  confidence: number;
  yieldEstimate: string;
  marketPriceEstimate: string;
  duration: string;
  agronomistNote: string;
  imageUrl: string;
  reasons: PredictionReason[];
  alternatives: Array<{
    cropName: string;
    cropHindi: string;
    confidence: number;
  }>;
  profitability: {
    expectedYieldPerAcre: string;
    costOfCultivation: string;
    marketValue: string;
    netProfit: string;
    riskLevel: 'Low' | 'Moderate' | 'High';
    riskColor: string;
  };
  diseaseRisk: DiseaseRisk;
  fertilizerNeeds: {
    chemical: FertilizerPlan[];
    organic: FertilizerPlan[];
    summary: string;
    savingWithOrganic: string;
  };
}

export interface IrrigationSource {
  name: string;
  type: string;
  distance: string;
  location: string;
  mapUrl: string;
  costEstimate: string;
}

export interface DroneAnalysisResult {
  sources: IrrigationSource[];
  summary: string;
  recommendation: string;
  soilMoisture?: {
    level: string;
    percentage: number;
    status: 'Optimal' | 'Low' | 'High';
  };
  topography?: {
    slope: string;
    elevation: string;
    drainage: string;
  };
  vegetationIndex?: {
    score: number;
    health: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum ThemeMode {
  DARK = 'dark',
  LIGHT = 'light'
}

export enum Language {
  EN = 'English',
  HI = 'Hindi',
  PB = 'Punjabi',
  MR = 'Marathi',
  GU = 'Gujarati'
}

export type ProductType = 'Seed' | 'Fertilizer' | 'Equipment' | 'Protection' | 'Service';

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  basePrice: number;
  unit: string;
  image: string;
  description: string;
  marketLinked?: boolean;
  rating: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role?: 'user' | 'admin';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CropCalendarWeek {
  week: number;
  label: string;
  activities: string[];
  inputs: string;
  watchOut: string;
}

export interface CropRotationStep {
  season: string;
  cropName: string;
  cropHindi: string;
  reason: string;
  soilBenefit: string;
  duration: string;
  icon: 'nitrogen' | 'organic' | 'cash' | 'rest' | 'cover';
}

export interface CropRotationPlan {
  currentCrop: string;
  totalCycleMonths: number;
  steps: CropRotationStep[];
  overallBenefit: string;
}

export interface GovernmentScheme {
  name: string;
  ministry: string;
  benefit: string;
  eligibility: string;
  howToApply: string;
  amount: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: 'Seeds' | 'Fertilizer' | 'Labor' | 'Irrigation' | 'Equipment' | 'Pesticide' | 'Revenue' | 'Other';
  description: string;
  amount: number;
  createdAt: string;
  userId?: string;
}

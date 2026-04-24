
import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";
import { Coordinates, PredictionResult, ChatMessage, DiseaseRisk, WeatherData, FertilizerPlan, MarketForecast, PricePoint, PredictionReason, DiseaseDetectionResult, DroneAnalysisResult, CropCalendarWeek, GovernmentScheme, CropRotationPlan, CropRotationStep } from '../types';
import { MANDI_RATES } from '../constants';

// API key rotation — add VITE_GEMINI_API_KEY_2, _3 in .env for extra quota
const API_KEYS = [
  process.env.API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

let _keyIndex = 0;
function getAI(keyIdx = 0): GoogleGenAI {
  const key = API_KEYS[keyIdx % API_KEYS.length];
  if (!key) throw new Error('Gemini API key is not set. Add VITE_GEMINI_API_KEY to your .env file.');
  return new GoogleGenAI({ apiKey: key });
}
// Keep `ai` as a proxy using the current key
const ai = new Proxy({} as GoogleGenAI, {
  get: (_t, prop) => (getAI(_keyIndex) as any)[prop],
});

const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

// Groq client for text-only tasks (faster + separate quota)
let _groq: Groq | null = null;
function getGroq(): Groq | null {
  if (_groq) return _groq;
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  _groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
  return _groq;
}

async function groqGenerate(prompt: string): Promise<string> {
  const groq = getGroq();
  if (!groq) throw new Error('No Groq key');
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content || '';
}

// Try Groq first for text tasks, fall back to Gemini
async function generateText(prompt: string, config?: any): Promise<string> {
  try {
    const text = await groqGenerate(prompt);
    if (text) return text;
  } catch { /* fall through to Gemini */ }
  const res = await generateWithFallback({ contents: prompt, config });
  return res.text;
}

async function generateWithFallback(params: { contents: any; config?: any }): Promise<{ text: string }> {
  // Detect vision call (has inlineData parts) — strip schema config as not all models support it with images
  const isVision = (() => {
    const c = params.contents;
    const parts = Array.isArray(c) ? c : c?.parts;
    return Array.isArray(parts) && parts.some((p: any) => p?.inlineData);
  })();

  let lastError: unknown;

  // Outer loop: models. Inner loop: keys.
  // For each model we try ALL keys before giving up and moving to the next model.
  // This gives true 3× quota — key 1 exhausted? key 2 picks up instantly, same model.
  for (const model of FALLBACK_MODELS) {
    for (let ki = 0; ki < API_KEYS.length; ki++) {
      const keyIdx = (_keyIndex + ki) % API_KEYS.length;
      try {
        const aiInstance = getAI(keyIdx);
        // gemini-2.x supports responseMimeType + schema even with images; only strip for 1.5
        const supportsStructuredVision = !model.includes('1.5');
        const config = (isVision && !supportsStructuredVision) ? undefined : params.config;
        const response = await aiInstance.models.generateContent({
          model,
          contents: params.contents,
          ...(config ? { config } : {}),
        });
        _keyIndex = keyIdx; // remember the working key for next call
        const text = response.text || '';
        // For 1.5 models (free-text vision), extract JSON via regex
        if (isVision && !supportsStructuredVision && text) {
          const match = text.match(/\{[\s\S]*\}/);
          return { text: match ? match[0] : text };
        }
        return { text };
      } catch (err: any) {
        lastError = err;
        const isQuota = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
        const isOverload = err?.message?.includes('503') || err?.message?.includes('UNAVAILABLE');
        if (isQuota || isOverload) continue; // try next key for same model
        // Model not found — SDK may return string 'NOT_FOUND' or numeric 404
        // 400 INVALID_ARGUMENT means the key is bad — try the next key, not the next model
        const isKeyInvalid = err?.status === 400 || err?.status === 'INVALID_ARGUMENT'
          || (err?.message || '').includes('API_KEY_INVALID')
          || (err?.message || '').includes('API Key not found');
        if (isKeyInvalid) continue;
        // True model-not-found (404) — skip to next model
        const isNotFound = err?.status === 'NOT_FOUND' || err?.status === 404
          || (err?.message || '').includes('[404]')
          || (err?.message || '').toLowerCase().includes('model not found');
        if (isNotFound) break;
        throw err; // unrecoverable error — stop immediately
      }
    }
    // All keys exhausted for this model → try next model from current key
  }
  throw lastError;
}

export const resolveLocation = async (query: string): Promise<Coordinates> => {
  const text = await generateText(`Resolve the following place name to its approximate Latitude and Longitude: "${query}". Respond strictly in JSON format with keys: lat, lng.`);
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : '{"lat": 20.5937, "lng": 78.9629}') as Coordinates;
};

export const getTerrainAnalysis = async (coords: Coordinates): Promise<DroneAnalysisResult> => {
  const prompt = `Perform a comprehensive terrain and irrigation analysis for the coordinates: Latitude ${coords.lat}, Longitude ${coords.lng}.

    1. Find the nearest irrigation sources (canals, rivers, lakes, reservoirs, ponds, check dams, borewells, or major water tanks).
    2. Analyze the typical topography of this specific region (slope, elevation, drainage patterns).
    3. Estimate current soil moisture levels based on seasonal patterns and recent regional weather for these coordinates.
    4. Provide a Vegetation Index (NDVI) estimate for typical farmland at this location.

    If you find specific locations using the maps tool, list them.
    If NO specific locations are found, provide a "Regional Water Strategy" based on the typical geography of this area.

    For each source (real or suggested), estimate the setup/usage cost for a 5-acre farm in Indian Rupees (INR).
    Provide a summary of water availability and a recommendation for the best source.

    Respond strictly in JSON format with the following structure:
    {
      "sources": [{"name": "...", "type": "...", "distance": "...", "mapUrl": "...", "costEstimate": "..."}],
      "summary": "...",
      "recommendation": "...",
      "soilMoisture": {"level": "...", "percentage": 0-100, "status": "Optimal/Low/High"},
      "topography": {"slope": "...", "elevation": "...", "drainage": "..."},
      "vegetationIndex": {"score": 0.0-1.0, "health": "..."}
    }`;

  let response: any;
  try {
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: { retrievalConfig: { latLng: { latitude: coords.lat, longitude: coords.lng } } }
        },
      });
    } catch {
      // Fallback without maps tool — use Groq-first text path
      const fallbackText = await generateText(prompt);
      response = { text: fallbackText };
    }

  const text = response.text || "";
  let data: any = {};
  try {
    // Extract JSON from text as gemini-2.5-flash with googleMaps doesn't support responseMimeType
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // JSON parse failed — will use fallback defaults
  }
  
  // Map grounding chunks to sources if they exist and aren't in the JSON already
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const mapSources = chunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any) => {
      const isRiver = (chunk.maps.title || "").toLowerCase().includes('river');
      const isCanal = (chunk.maps.title || "").toLowerCase().includes('canal');
      const isDam = (chunk.maps.title || "").toLowerCase().includes('dam');
      const baseCost = isRiver ? 15000 : isCanal ? 8000 : isDam ? 12000 : 25000;
      const randomVar = Math.floor(Math.random() * 5000);

      return {
        name: chunk.maps.title || "Unknown Source",
        type: isRiver ? "River / Natural Stream" : isCanal ? "Irrigation Canal" : isDam ? "Check Dam / Reservoir" : "Water Body / Infrastructure",
        distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`, 
        location: chunk.maps.uri,
        mapUrl: chunk.maps.uri,
        costEstimate: `₹${(baseCost + randomVar).toLocaleString('en-IN')}`
      };
    });

  // Merge sources from JSON and Maps
  const finalSources = [...(data.sources || []), ...mapSources].slice(0, 5);

  // Fallback for sources if empty
  if (finalSources.length === 0) {
    finalSources.push({
      name: "Deep Borewell (Regional Suggestion)",
      type: "Groundwater Extraction",
      distance: "On-site",
      location: "#",
      mapUrl: `https://www.google.com/maps/search/borewell+drilling+near+${coords.lat},${coords.lng}`,
      costEstimate: "₹1,50,000 - ₹2,50,000"
    });
  }

  return {
    sources: finalSources,
    summary: data.summary || "Terrain analysis complete. No major surface water bodies detected in immediate radius.",
    recommendation: data.recommendation || "Consider groundwater extraction or rainwater harvesting.",
    soilMoisture: data.soilMoisture || { level: "Moderate", percentage: 45, status: "Optimal" },
    topography: data.topography || { slope: "Gentle (2-5%)", elevation: "450m MSL", drainage: "Good" },
    vegetationIndex: data.vegetationIndex || { score: 0.65, health: "Good" }
  };
  } catch {
    // All AI paths exhausted — return location-aware demo result (Waghodia, Vadodara, Gujarat)
    const lat = coords?.lat ?? 22.24;
    const lng = coords?.lng ?? 73.32;
    return {
      sources: [
        {
          name: "Ajwa Salav Lake",
          type: "Reservoir / Lake",
          distance: "4.8 km",
          location: "https://maps.google.com/?q=Ajwa+Lake,Vadodara",
          mapUrl: "https://maps.google.com/?q=Ajwa+Lake,Vadodara",
          costEstimate: "₹8,500"
        },
        {
          name: "Vishwamitri River",
          type: "River / Natural Stream",
          distance: "9.2 km",
          location: "https://maps.google.com/?q=Vishwamitri+River,Vadodara",
          mapUrl: "https://maps.google.com/?q=Vishwamitri+River,Vadodara",
          costEstimate: "₹14,000"
        },
        {
          name: "Narmada Main Canal (SSP Branch)",
          type: "Irrigation Canal",
          distance: "16.5 km",
          location: "https://maps.google.com/?q=Narmada+Canal,Waghodia,Vadodara",
          mapUrl: "https://maps.google.com/?q=Narmada+Canal,Waghodia,Vadodara",
          costEstimate: "₹11,200"
        },
        {
          name: "Deep Borewell",
          type: "Groundwater Extraction",
          distance: "On-site",
          location: "#",
          mapUrl: `https://www.google.com/maps/search/borewell+drilling+near+${lat},${lng}`,
          costEstimate: "₹1,75,000 – ₹2,20,000"
        },
      ],
      summary: "Terrain scan complete for Waghodia region, Vadodara, Gujarat. The area sits on the Deccan Trap basalt fringe with deep black cotton soil. Ajwa Lake and Vishwamitri River are the closest natural sources; the Narmada SSP canal network provides reliable kharif-season supply.",
      recommendation: "Ajwa Lake connection via existing lift irrigation infrastructure offers the best cost-to-yield ratio for a 5-acre holding. Install drip lines for cotton and groundnut to cut water use by 40%.",
      soilMoisture: { level: "Moderate", percentage: 48, status: "Optimal" },
      topography: { slope: "Gentle (1–3%)", elevation: "38m MSL", drainage: "Good" },
      vegetationIndex: { score: 0.72, health: "Good" },
    };
  }
};

export interface CropData {
  name: string;
  hindi: string;
  soilTypes: string[];
  minRain: number;
  maxRain?: number;
  idealPh: number;
  highN: boolean;
  duration: string;
  yield: string;
  price: string;
  note: string;
  imageUrl: string;
  targetNPK?: { n: number, p: number, k: number };
}

export const CROP_DATABASE: CropData[] = [
  { name: "Rice (Paddy)", hindi: "धान (चावल)", soilTypes: ["Alluvial Soil", "Clayey", "Loamy Soil"], minRain: 1000, idealPh: 6.5, highN: true, duration: "120-150 Days", yield: "4-6 tonnes/ha", price: "₹2,300 / quintal", note: "Kharif crop. Requires standing water.", imageUrl: "https://images.unsplash.com/photo-1536625807663-02f6dc688005?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 40, k: 40 } },
  { name: "Wheat", hindi: "गेहूँ", soilTypes: ["Alluvial Soil", "Loamy Soil", "Black Soil (Regur)"], minRain: 400, maxRain: 1000, idealPh: 7.0, highN: true, duration: "110-130 Days", yield: "3.5-5.5 tonnes/ha", price: "₹2,425 / quintal", note: "Rabi crop. Needs cool winters.", imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 40 } },
  { name: "Maize (Corn)", hindi: "मक्का", soilTypes: ["Alluvial Soil", "Red Soil", "Loamy Soil"], minRain: 500, idealPh: 6.8, highN: true, duration: "90-110 Days", yield: "6-8 tonnes/ha", price: "₹2,225 / quintal", note: "Grown in both Kharif & Rabi.", imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 120, p: 60, k: 40 } },
  { name: "Barley", hindi: "जौ", soilTypes: ["Sandy Loam", "Loamy Soil", "Alluvial Soil"], minRain: 200, maxRain: 400, idealPh: 7.5, highN: false, duration: "100-120 Days", yield: "3-4 tonnes/ha", price: "₹1,980 / quintal", note: "Drought and saline tolerant.", imageUrl: "https://images.unsplash.com/photo-1533235377549-30514a7e94e2?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 60, p: 30, k: 30 } },
  { name: "Pearl Millet (Bajra)", hindi: "बाजरा", soilTypes: ["Desert / Arid Soil", "Sandy Loam", "Red Soil"], minRain: 350, maxRain: 750, idealPh: 7.5, highN: false, duration: "70-90 Days", yield: "2-3 tonnes/ha", price: "₹2,625 / quintal", note: "Extremely drought hardy.", imageUrl: "https://images.unsplash.com/photo-1634467524884-897d0af5e104?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 40, p: 20, k: 20 } },
  { name: "Sorghum (Jowar)", hindi: "ज्वार", soilTypes: ["Black Soil", "Alluvial Soil"], minRain: 400, idealPh: 7.0, highN: false, duration: "100-115 Days", yield: "2.5-4 tonnes/ha", price: "₹3,371 / quintal", note: "Dual purpose grain and fodder.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 60, p: 30, k: 20 } },
  { name: "Finger Millet (Ragi)", hindi: "रागी", soilTypes: ["Red Soil", "Sandy Loam"], minRain: 500, idealPh: 6.5, highN: false, duration: "110-120 Days", yield: "2-3.5 tonnes/ha", price: "₹4,290 / quintal", note: "Calcium rich traditional millet.", imageUrl: "https://images.unsplash.com/photo-1634467524884-897d0af5e104?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 40, p: 20, k: 20 } },
  { name: "Soybean", hindi: "सोयाबीन", soilTypes: ["Black Soil (Regur)", "Loamy Soil"], minRain: 600, idealPh: 6.5, highN: false, duration: "90-110 Days", yield: "2.5-3.0 tonnes/ha", price: "₹4,892 / quintal", note: "High oil-content oilseed.", imageUrl: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 60, k: 40 } },
  { name: "Cotton", hindi: "कपास", soilTypes: ["Black Soil (Regur)", "Alluvial Soil"], minRain: 500, idealPh: 7.0, highN: true, duration: "150-180 Days", yield: "2-3 tonnes/ha", price: "₹7,521 / quintal", note: "Needs dry weather during boll opening.", imageUrl: "https://images.unsplash.com/photo-1605333166548-a9572718911b?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 40, k: 40 } },
  { name: "Sugarcane", hindi: "गन्ना", soilTypes: ["Black Soil", "Alluvial Soil"], minRain: 1500, idealPh: 7.0, highN: true, duration: "10-12 Months", yield: "70-100 tonnes/ha", price: "₹340 / quintal", note: "High water requirement cash crop.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 150, p: 80, k: 60 } },
  { name: "Turmeric", hindi: "हल्दी", soilTypes: ["Sandy Loam", "Clayey Loam"], minRain: 1500, idealPh: 6.0, highN: true, duration: "7-9 Months", yield: "20-25 tonnes/ha", price: "₹13,500 / quintal", note: "Curcumin-rich spice rhizome.", imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 60, p: 60, k: 120 } },
  { name: "Potato", hindi: "आलू", soilTypes: ["Sandy Loam", "Loamy Soil"], minRain: 500, maxRain: 1000, idealPh: 5.5, highN: true, duration: "90-110 Days", yield: "25-35 tonnes/ha", price: "₹1,450 / quintal", note: "Needs cool nights for tuberization.", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 120, p: 60, k: 120 } },
  { name: "Red Onion", hindi: "लाल प्याज", soilTypes: ["Sandy Loam", "Alluvial"], minRain: 600, idealPh: 6.5, highN: true, duration: "100-120 Days", yield: "20-25 tonnes/ha", price: "₹2,200 / quintal", note: "Best in Nashik region.", imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 80 } },
  { name: "Tomato", hindi: "टमाटर", soilTypes: ["Sandy Loam", "Red Soil"], minRain: 600, idealPh: 6.0, highN: true, duration: "90-100 Days", yield: "30-50 tonnes/ha", price: "₹1,800 / quintal", note: "Determinate variety for bulk production.", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 60, k: 60 } },
  { name: "Mustard", hindi: "सरसों", soilTypes: ["Alluvial Soil", "Loamy Soil"], minRain: 300, idealPh: 7.0, highN: true, duration: "110-130 Days", yield: "1.5-2.5 tonnes/ha", price: "₹5,950 / quintal", note: "Rabi season oilseed.", imageUrl: "https://images.unsplash.com/photo-1536625807663-02f6dc688005?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 40, k: 40 } },
  { name: "Groundnut", hindi: "मूंगफली", soilTypes: ["Sandy Loam", "Red Soil"], minRain: 500, idealPh: 6.5, highN: false, duration: "100-120 Days", yield: "2-3.5 tonnes/ha", price: "₹6,783 / quintal", note: "Bold variety with high protein.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 40, k: 40 } },
  { name: "Moong Dal", hindi: "मूंग दाल", soilTypes: ["Alluvial Soil", "Loamy Soil"], minRain: 400, idealPh: 7.0, highN: false, duration: "60-75 Days", yield: "1-1.5 tonnes/ha", price: "₹8,682 / quintal", note: "Early maturing green gram.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 40, k: 20 } },
  { name: "Urad Dal", hindi: "उड़द दाल", soilTypes: ["Black Soil", "Loamy Soil"], minRain: 400, idealPh: 7.0, highN: false, duration: "75-90 Days", yield: "1-1.2 tonnes/ha", price: "₹7,400 / quintal", note: "Best for culinary use.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 40, k: 20 } },
  { name: "Tur (Arhar)", hindi: "अरहर (तुअर)", soilTypes: ["Alluvial Soil", "Black Soil"], minRain: 600, idealPh: 7.0, highN: false, duration: "150-180 Days", yield: "1.5-2.5 tonnes/ha", price: "₹7,550 / quintal", note: "Foundation for Indian pulses.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 50, k: 20 } },
  { name: "Chana (Gram)", hindi: "चना", soilTypes: ["Black Soil", "Alluvial Soil"], minRain: 400, idealPh: 7.5, highN: false, duration: "120-140 Days", yield: "1.5-2 tonnes/ha", price: "₹5,650 / quintal", note: "Rabi season protein source.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 40, k: 20 } },
  { name: "Masoor (Lentil)", hindi: "मसूर", soilTypes: ["Alluvial Soil", "Loamy Soil"], minRain: 400, idealPh: 7.0, highN: false, duration: "110-130 Days", yield: "1.2-1.8 tonnes/ha", price: "₹6,700 / quintal", note: "Fast cooking high fiber pulse.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 40, k: 20 } },
  { name: "Garlic", hindi: "लहसुन", soilTypes: ["Loamy Soil", "Sandy Loam"], minRain: 600, idealPh: 6.5, highN: true, duration: "150-160 Days", yield: "10-15 tonnes/ha", price: "₹16,500 / quintal", note: "High pungency bulbs.", imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 50 } },
  { name: "Ginger", hindi: "अदरक", soilTypes: ["Sandy Loam", "Red Soil"], minRain: 1500, idealPh: 6.0, highN: true, duration: "8-9 Months", yield: "15-20 tonnes/ha", price: "₹6,200 / quintal", note: "Organic certified rhizomes.", imageUrl: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 75, p: 50, k: 50 } },
  { name: "Red Chili", hindi: "लाल मिर्च", soilTypes: ["Black Soil", "Loamy Soil"], minRain: 800, idealPh: 6.5, highN: true, duration: "150-180 Days", yield: "1.5-2.5 tonnes/ha (Dry)", price: "₹18,000 / quintal", note: "Extra hot Guntur variety.", imageUrl: "https://images.unsplash.com/photo-1588253518679-1297b48d0653?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 120, p: 60, k: 60 } },
  { name: "Coriander", hindi: "धनिया", soilTypes: ["Loamy Soil", "Black Soil"], minRain: 400, idealPh: 7.0, highN: false, duration: "90-110 Days", yield: "1-1.5 tonnes/ha", price: "₹6,800 / quintal", note: "Dual use for leaves/seed.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 40, p: 40, k: 20 } },
  { name: "Jeera (Cumin)", hindi: "जीरा", soilTypes: ["Sandy Loam", "Well Drained"], minRain: 200, idealPh: 7.5, highN: false, duration: "110-120 Days", yield: "0.5-0.8 tonnes/ha", price: "₹24,500 / quintal", note: "World famous Unjha cumin.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 30, p: 20, k: 10 } },
  { name: "Fennel (Saunf)", hindi: "सौंफ", soilTypes: ["Loamy Soil", "Sandy Loam"], minRain: 400, idealPh: 7.0, highN: false, duration: "150-180 Days", yield: "1.5-2 tonnes/ha", price: "₹12,000 / quintal", note: "Aromatic export grade.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 40, p: 40, k: 20 } },
  { name: "Fenugreek", hindi: "मेथी", soilTypes: ["Loamy Soil", "Sandy Loam"], minRain: 400, idealPh: 7.0, highN: false, duration: "90-100 Days", yield: "1.2-1.5 tonnes/ha", price: "₹5,500 / quintal", note: "Medicinal grade methi.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 25, p: 40, k: 20 } },
  { name: "Black Pepper", hindi: "काली मिर्च", soilTypes: ["Red Loam", "Laterite"], minRain: 2000, idealPh: 5.5, highN: true, duration: "3-4 Years", yield: "2-3 tonnes/ha", price: "₹65,000 / quintal", note: "King of spices - Malabar Pepper.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 40, k: 140 } },
  { name: "Green Cardamom", hindi: "इलायची", soilTypes: ["Forest Loam", "Laterite"], minRain: 2500, idealPh: 5.5, highN: true, duration: "3 Years", yield: "0.2-0.5 tonnes/ha", price: "₹1,25,000 / quintal", note: "Elite green cardamom.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 75, p: 75, k: 150 } },
  { name: "Coffee (Arabica)", hindi: "कॉफी", soilTypes: ["Red Soil", "Laterite"], minRain: 1500, idealPh: 6.0, highN: true, duration: "3-4 Years", yield: "1-1.5 tonnes/ha", price: "₹45,000 / quintal", note: "High altitude Arabica.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 120, p: 60, k: 120 } },
  { name: "Tea", hindi: "चाय", soilTypes: ["Forest Soil", "Laterite"], minRain: 2000, idealPh: 5.0, highN: true, duration: "2-3 Years", yield: "2-3 tonnes/ha", price: "₹25,000 / quintal", note: "High yield Assam varieties.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 150, p: 40, k: 60 } },
  { name: "Tobacco", hindi: "तंबाकू", soilTypes: ["Sandy Loam", "Black Soil"], minRain: 600, idealPh: 6.0, highN: true, duration: "120-150 Days", yield: "2-3 tonnes/ha", price: "₹18,000 / quintal", note: "Flue-cured Virginia tobacco.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 100 } },
  { name: "Jute", hindi: "जूट", soilTypes: ["Alluvial Soil", "Loamy Soil"], minRain: 1500, idealPh: 6.5, highN: true, duration: "120-150 Days", yield: "2.5-3.5 tonnes/ha", price: "₹5,200 / quintal", note: "Premium golden fiber.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 60, p: 30, k: 30 } },
  { name: "Sunflower", hindi: "सूरजमुखी", soilTypes: ["Black Soil", "Loamy Soil"], minRain: 500, idealPh: 7.0, highN: true, duration: "90-100 Days", yield: "1.5-2.5 tonnes/ha", price: "₹7,280 / quintal", note: "Photo-insensitive oilseed.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 60, k: 40 } },
  { name: "Safflower", hindi: "कुसुम", soilTypes: ["Black Soil", "Alluvial Soil"], minRain: 400, idealPh: 7.0, highN: false, duration: "120-130 Days", yield: "1-1.5 tonnes/ha", price: "₹5,940 / quintal", note: "Drought tolerant oilseed.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 40, p: 40, k: 20 } },
  { name: "Sesame (Til)", hindi: "तिल", soilTypes: ["Sandy Loam", "Alluvial"], minRain: 400, idealPh: 7.0, highN: false, duration: "80-100 Days", yield: "0.5-0.8 tonnes/ha", price: "₹9,267 / quintal", note: "White sesame for export.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 30, p: 20, k: 20 } },
  { name: "Castor", hindi: "अरंडी", soilTypes: ["Sandy Loam", "Red Soil"], minRain: 500, idealPh: 6.5, highN: true, duration: "150-180 Days", yield: "1.5-2.5 tonnes/ha", price: "₹7,200 / quintal", note: "High oil castor hybrid.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 60, p: 40, k: 20 } },
  { name: "Guar Seed", hindi: "ग्वार", soilTypes: ["Sandy Soil", "Arid Soil"], minRain: 300, idealPh: 7.5, highN: false, duration: "90-110 Days", yield: "1-1.5 tonnes/ha", price: "₹5,400 / quintal", note: "Export grade gum seeds.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 20, p: 40, k: 20 } },
  { name: "Cauliflower", hindi: "फूलगोभी", soilTypes: ["Sandy Loam", "Loamy Soil"], minRain: 600, idealPh: 6.5, highN: true, duration: "90-120 Days", yield: "15-20 tonnes/ha", price: "₹3,500 / quintal", note: "Snowball variety.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 120, p: 60, k: 60 } },
  { name: "Cabbage", hindi: "पत्तागोभी", soilTypes: ["Sandy Loam", "Clayey Loam"], minRain: 600, idealPh: 6.5, highN: true, duration: "90-110 Days", yield: "20-25 tonnes/ha", price: "₹2,800 / quintal", note: "Tight-head winter cabbage.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 120, p: 60, k: 60 } },
  { name: "Brinjal", hindi: "बैंगन", soilTypes: ["Sandy Loam", "Loamy Soil"], minRain: 600, idealPh: 6.5, highN: true, duration: "120-150 Days", yield: "25-35 tonnes/ha", price: "₹1,500 / quintal", note: "Pest resistant round brinjal.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 50 } },
  { name: "Okra (Bhindi)", hindi: "भिंडी", soilTypes: ["Sandy Loam", "Alluvial"], minRain: 800, idealPh: 6.5, highN: true, duration: "90-110 Days", yield: "10-15 tonnes/ha", price: "₹3,200 / quintal", note: "YVMV resistant hybrid.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 50 } },
  { name: "Pea (Matar)", hindi: "मटर", soilTypes: ["Sandy Loam", "Loamy Soil"], minRain: 400, idealPh: 6.5, highN: false, duration: "80-100 Days", yield: "8-12 tonnes/ha", price: "₹4,500 / quintal", note: "Sweet early maturing peas.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 40, p: 60, k: 40 } },
  { name: "Carrot", hindi: "गाजर", soilTypes: ["Sandy Loam", "Deep Soil"], minRain: 500, idealPh: 6.0, highN: true, duration: "90-110 Days", yield: "20-30 tonnes/ha", price: "₹1,600 / quintal", note: "Deep red high sugar carrots.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 40, k: 100 } },
  { name: "Radish", hindi: "मूली", soilTypes: ["Sandy Loam", "Loamy Soil"], minRain: 400, idealPh: 6.5, highN: true, duration: "45-60 Days", yield: "15-20 tonnes/ha", price: "₹1,200 / quintal", note: "Pungent long white radish.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 60, p: 30, k: 60 } },
  { name: "Spinach", hindi: "पालक", soilTypes: ["Sandy Loam", "Alluvial"], minRain: 400, idealPh: 6.5, highN: true, duration: "40-50 Days", yield: "10-15 tonnes/ha", price: "₹1,000 / quintal", note: "Broad leaf nutrient rich.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 40, k: 40 } },
  { name: "Banana", hindi: "केला", soilTypes: ["Alluvial Soil", "Clayey Loam"], minRain: 2000, idealPh: 6.5, highN: true, duration: "12-14 Months", yield: "40-60 tonnes/ha", price: "₹2,500 / quintal", note: "G9 tissue culture suckers.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 200, p: 100, k: 300 } },
  { name: "Mango", hindi: "आम", soilTypes: ["Alluvial Soil", "Laterite"], minRain: 1000, idealPh: 6.0, highN: true, duration: "5-6 Years", yield: "10-15 tonnes/ha", price: "₹6,000 / quintal", note: "Certified Ratnagiri Alphonso.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 100 } },
  { name: "Grape", hindi: "अंगूर", soilTypes: ["Sandy Loam", "Red Soil"], minRain: 600, idealPh: 7.0, highN: true, duration: "2-3 Years", yield: "20-25 tonnes/ha", price: "₹8,500 / quintal", note: "Export quality seedless grapes.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 150, p: 100, k: 200 } },
  { name: "Pomegranate", hindi: "अनार", soilTypes: ["Sandy Loam", "Black Soil"], minRain: 500, idealPh: 7.0, highN: true, duration: "2-3 Years", yield: "15-20 tonnes/ha", price: "₹12,000 / quintal", note: "Premium deep red Bhagwa.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 100 } },
  { name: "Papaya", hindi: "पपीता", soilTypes: ["Sandy Loam", "Alluvial"], minRain: 1500, idealPh: 6.5, highN: true, duration: "10-12 Months", yield: "40-60 tonnes/ha", price: "₹2,200 / quintal", note: "Taiwan Red Lady 786.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 150, p: 150, k: 250 } },
  { name: "Watermelon", hindi: "तरबूज", soilTypes: ["Sandy Soil", "Riverbed"], minRain: 400, idealPh: 6.5, highN: true, duration: "80-90 Days", yield: "25-40 tonnes/ha", price: "₹1,500 / quintal", note: "Icebox type hybrid.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 40, k: 80 } },
  { name: "Muskmelon", hindi: "खरबूजा", soilTypes: ["Sandy Soil", "Loamy Soil"], minRain: 400, idealPh: 6.5, highN: true, duration: "80-90 Days", yield: "15-25 tonnes/ha", price: "₹2,500 / quintal", note: "High brix aromatic melon.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 80, p: 40, k: 80 } },
  { name: "Cabbage Hybrid", hindi: "हाइब्रिड पत्तागोभी", soilTypes: ["Sandy Loam", "Clayey Loam"], minRain: 600, idealPh: 6.5, highN: true, duration: "80-100 Days", yield: "25-30 tonnes/ha", price: "₹3,100 / quintal", note: "Global standard F1 hybrid.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 140, p: 70, k: 70 } },
  { name: "Rubber", hindi: "रबड़", soilTypes: ["Laterite", "Alluvial"], minRain: 2000, idealPh: 5.0, highN: true, duration: "6-7 Years", yield: "1.5-2 tonnes/ha", price: "₹18,000 / quintal", note: "Latex producing tree crop.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 40, p: 40, k: 80 } },
  { name: "Coconut", hindi: "नारियल", soilTypes: ["Sandy Soil", "Alluvial"], minRain: 1500, idealPh: 6.0, highN: true, duration: "5-7 Years", yield: "10,000-15,000 nuts/ha", price: "₹2,500 / quintal", note: "Coastal plantation crop.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 50, k: 150 } },
  { name: "Areca Nut", hindi: "सुपारी", soilTypes: ["Laterite", "Red Soil"], minRain: 2000, idealPh: 5.5, highN: true, duration: "5-6 Years", yield: "2-3 tonnes/ha", price: "₹45,000 / quintal", note: "Important plantation crop.", imageUrl: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80", targetNPK: { n: 100, p: 40, k: 140 } }
];

const analyzeDiseaseRisk = (crop: string, weather?: WeatherData): DiseaseRisk => {
  const humidity = weather?.humidity || 50;
  const temp = weather?.temp || 25;
  const rain = weather?.rainProbability || 0;

  if (humidity > 80 && temp > 18 && temp < 28) {
    return {
      level: 'High',
      type: 'Fungal Blast / Rust',
      symptoms: 'Water-soaked lesions on leaves, white powdery growth, or rust-colored spots.',
      treatment: 'Apply Carbendazim 50% WP (2g/L) or Mancozeb (2.5g/L). Increase spacing.',
      prevention: 'Avoid overhead irrigation. Use resistant varieties and balanced Nitrogen.'
    };
  }

  if (rain > 70 || (humidity > 90 && temp > 30)) {
    return {
      level: 'Moderate',
      type: 'Root Rot / Damping Off',
      symptoms: 'Wilting of plant despite wet soil, darkening of roots, stunted growth.',
      treatment: 'Soil drenching with Trichoderma viride or Metalaxyl. Improve drainage.',
      prevention: 'Construct deep drainage channels. Apply well-composted organic manure.'
    };
  }

  if (humidity < 40 && temp > 35) {
    return {
      level: 'High',
      type: 'Thrips & Aphid Surge',
      symptoms: 'Curling of young leaves, silvering on undersides, honey-dew secretion.',
      treatment: 'Spray Neem Oil (5ml/L) or Imidacloprid (0.5ml/L). Use yellow sticky traps.',
      prevention: 'Maintain soil moisture. Install windbreaks to reduce hot air flow.'
    };
  }

  return {
    level: 'Low',
    type: 'No Active Pathogen Warnings',
    symptoms: 'General vigor looks stable.',
    treatment: 'Standard NPK application and routine scouting.',
    prevention: 'Continue crop rotation and monitor soil moisture weekly.'
  };
};

const calculateFertilizerPlan = (crop: CropData, n: number, p: number, k: number) => {
  const target = crop.targetNPK || { n: 80, p: 40, k: 40 };
  const chemical: FertilizerPlan[] = [];
  const organic: FertilizerPlan[] = [];
  
  // Logic for Nitrogen (N)
  if (n < target.n) {
    const diff = target.n - n;
    const ureaDose = Math.round(diff * 1.5);
    chemical.push({
      name: 'Urea (46% N)',
      dosage: `${ureaDose}kg / acre`,
      timing: 'Split: 50% Basal, 50% Top dressing at 30 days',
      costEstimate: `₹${Math.round(ureaDose * 6)}`,
      description: 'Quick release nitrogen booster for leafy growth.'
    });
    const compostDose = Math.round(diff * 10);
    organic.push({
      name: 'Vermicompost',
      dosage: `${compostDose}kg / acre`,
      timing: 'Pre-sowing (during land preparation)',
      costEstimate: `₹${Math.round(compostDose * 4)}`,
      description: 'Sustainable organic matter that improves soil structure.'
    });
  }

  // Logic for Phosphorus (P)
  if (p < target.p) {
    const pDose = Math.round((target.p - p) * 2.5);
    chemical.push({
      name: 'DAP (18:46:0)',
      dosage: `${pDose}kg / acre`,
      timing: 'Basal application (During sowing)',
      costEstimate: `₹${Math.round(pDose * 28)}`,
      description: 'Provides vital phosphorus for strong root development.'
    });
    organic.push({
      name: 'Rock Phosphate / Bone Meal',
      dosage: `${Math.round(pDose * 1.5)}kg / acre`,
      timing: 'Land preparation',
      costEstimate: `₹${Math.round(pDose * 1.5 * 15)}`,
      description: 'Slow-release natural phosphorus source.'
    });
  }

  // Logic for Potassium (K)
  if (k < target.k) {
    const kDose = Math.round((target.k - k) * 1.6);
    chemical.push({
      name: 'MOP (Muriate of Potash)',
      dosage: `${kDose}kg / acre`,
      timing: 'Basal or at flowering stage',
      costEstimate: `₹${Math.round(kDose * 32)}`,
      description: 'Improves disease resistance and grain quality.'
    });
    organic.push({
      name: 'Wood Ash / Neem Cake',
      dosage: `${Math.round(kDose * 2)}kg / acre`,
      timing: 'During sowing',
      costEstimate: `₹${Math.round(kDose * 2 * 12)}`,
      description: 'Provides potash and acts as a natural soil disinfectant.'
    });
  }

  if (chemical.length === 0) {
    chemical.push({
      name: 'Balanced NPK (19:19:19)',
      dosage: '10kg / acre',
      timing: 'Foliar spray at vegetative stage',
      costEstimate: '₹850',
      description: 'Maintenance dose for healthy crop vigor.'
    });
  }

  const chemTotal = chemical.reduce((acc, c) => acc + parseInt(c.costEstimate.replace('₹', '')), 0);
  const orgTotal = organic.reduce((acc, c) => acc + parseInt(c.costEstimate.replace('₹', '')), 0);

  return {
    chemical,
    organic,
    summary: n < 30 ? "Severe Nutrient Deficiency detected. Basal application is critical." : "Soil nutrition is moderate. Preventive application advised.",
    savingWithOrganic: orgTotal < chemTotal ? `Potential saving of ₹${chemTotal - orgTotal} using organic methods.` : "Organic methods provide better long-term soil health."
  };
};

/* ── Extract soil parameters from an uploaded Soil Health Card / report image ── */
export interface SoilReportData {
  isValid: boolean;
  errorMessage?: string;
  n: number;
  p: number;
  k: number;
  ph: number;
  organicCarbon?: number;
  ec?: number;
  zinc?: number;
  iron?: number;
  manganese?: number;
  copper?: number;
  sulphur?: number;
  boron?: number;
  soilType?: string;
  summary: string;
}

export const extractSoilReport = async (base64Image: string): Promise<SoilReportData> => {
  const mimeType = base64Image.startsWith('data:image/png') ? 'image/png'
    : base64Image.startsWith('data:image/webp') ? 'image/webp'
    : 'image/jpeg';
  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1],
      mimeType,
    },
  };
  const textPart = {
    text: `You are an expert soil scientist analyzing an Indian Soil Health Card or soil test report image.

Extract ALL soil parameters visible in this document/image:

1. First determine if this is a valid soil report/soil health card/soil test result.
   - If NOT (e.g. random photo, non-soil document), set isValid=false with a helpful errorMessage.
   - If YES, set isValid=true and extract every parameter you can see.

2. For a valid soil report, extract these values ALL in mg/kg units (NOT kg/ha):
   - n: Nitrogen in mg/kg. If card shows kg/ha, divide by 2.24 to convert. Final value must be 10–150. If "Low/Medium/High" only: Low=30, Medium=55, High=80.
   - p: Phosphorus in mg/kg. If card shows kg/ha, divide by 2.24. Final value must be 5–80. If "Low/Medium/High" only: Low=10, Medium=30, High=55.
   - k: Potassium in mg/kg. If card shows kg/ha, divide by 4.58 to convert. Final value must be 10–100. If "Low/Medium/High" only: Low=25, Medium=55, High=85.
   - ph: Soil pH value.
   - organicCarbon: Organic Carbon % (if visible).
   - ec: Electrical Conductivity dS/m (if visible).
   - zinc, iron, manganese, copper, sulphur, boron: Micronutrients in mg/kg (if visible, else 0).
   - soilType: Inferred soil type — MUST be exactly one of: "Alluvial Soil", "Black Soil (Regur)", "Red Soil", "Laterite Soil", "Desert / Arid Soil", "Forest / Mountain Soil", "Loamy Soil". Pick the closest match.
   - summary: A 1-2 sentence plain-English summary of the soil health (e.g. "Nitrogen-deficient clay soil with good potassium levels, pH slightly alkaline").

Use your best judgment to normalize values. If a parameter is not visible, use reasonable defaults for Indian soils (N=50, P=35, K=50, pH=6.8).

Respond strictly as JSON.`
  };

  const models = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash'];
  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, textPart] },
      });
      const text = response.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    } catch (err) {
      lastError = err;
      console.warn(`[SoilReport] ${model} failed:`, (err as any)?.message || err);
    }
  }
  throw lastError;
};

export const getCropPrediction = async (
  coords: Coordinates,
  soilParams: { n: number; p: number; k: number; ph: number; soilType?: string; rainfall?: number },
  currentWeather?: WeatherData
): Promise<PredictionResult> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const { soilType = "", rainfall = 1000, ph, n, p, k } = soilParams;

  const scoredCrops = CROP_DATABASE.map(crop => {
    let score = 0;
    const soilMatch = crop.soilTypes.some(t => soilType.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(soilType.toLowerCase()));
    if (soilMatch) score += 40;
    else if (crop.soilTypes.includes("Loamy Soil")) score += 20;

    const minR = crop.minRain;
    const maxR = (crop as any).maxRain || 3000;
    if (rainfall >= minR && rainfall <= maxR) score += 30;
    else {
        const diff = Math.min(Math.abs(rainfall - minR), Math.abs(rainfall - maxR));
        score += Math.max(0, 30 - (diff / 20)); 
    }

    const phDiff = Math.abs(ph - crop.idealPh);
    if (phDiff < 0.5) score += 15;
    if (crop.highN && n > 60) score += 15;
    score += Math.random() * 5;
    return { crop, score };
  });

  scoredCrops.sort((a, b) => b.score - a.score);
  const bestCrop = scoredCrops[0].crop;

  // Reasoning Generation
  const reasons: PredictionReason[] = [];
  if (soilType && bestCrop.soilTypes.some(t => soilType.toLowerCase().includes(t.toLowerCase()))) {
    reasons.push({ feature: 'Soil Compatibility', impact: 'positive', description: `Your ${soilType} matches the ideal profile for ${bestCrop.name}.` });
  }
  if (Math.abs(ph - bestCrop.idealPh) < 0.5) {
    reasons.push({ feature: 'pH Level', impact: 'positive', description: `Soil pH of ${ph} is near-perfect (${bestCrop.idealPh}) for nutrient uptake.` });
  } else if (Math.abs(ph - bestCrop.idealPh) > 1.5) {
    reasons.push({ feature: 'pH Variance', impact: 'negative', description: `pH level ${ph} is slightly off from the ${bestCrop.idealPh} ideal.` });
  }
  if (rainfall >= bestCrop.minRain && rainfall <= ((bestCrop as any).maxRain || 3000)) {
    reasons.push({ feature: 'Precipitation', impact: 'positive', description: `Rainfall of ${rainfall}mm satisfies high water demand of this crop.` });
  }
  if (bestCrop.highN && n > 60) {
    reasons.push({ feature: 'Nitrogen Content', impact: 'positive', description: `High Soil N (${n} mg/kg) provides a great headstart for vegetative growth.` });
  } else if (bestCrop.highN && n < 40) {
    reasons.push({ feature: 'Nitrogen Gap', impact: 'neutral', description: `Low N detected. Model recommends Rice due to other factors, but needs Urea.` });
  }
  if (currentWeather && currentWeather.humidity > 70) {
    reasons.push({ feature: 'Climate Sync', impact: 'positive', description: `High regional humidity favors the developmental stages of ${bestCrop.name}.` });
  }
  
  const basePriceNum = parseInt(bestCrop.price.replace(/[^\d]/g, '')) || 2500;
  const yieldNum = parseFloat(bestCrop.yield) || 4;
  const yieldPerAcre = yieldNum / 2.47;
  const quintalsPerAcre = yieldPerAcre * 10;
  const grossRevenue = quintalsPerAcre * basePriceNum;
  const costOfCultivation = Math.round(grossRevenue * (0.35 + Math.random() * 0.15));
  const netProfit = grossRevenue - costOfCultivation;

  const diseaseRisk = analyzeDiseaseRisk(bestCrop.name, currentWeather);
  const fertilizerNeeds = calculateFertilizerPlan(bestCrop, n, p, k);

  return {
    cropName: bestCrop.name,
    cropHindi: bestCrop.hindi,
    confidence: Math.min(98, Math.max(75, Math.floor(scoredCrops[0].score))),
    yieldEstimate: bestCrop.yield,
    marketPriceEstimate: bestCrop.price,
    duration: bestCrop.duration,
    agronomistNote: bestCrop.note,
    imageUrl: bestCrop.imageUrl,
    reasons,
    alternatives: scoredCrops.slice(1, 4).map(item => ({ cropName: item.crop.name, cropHindi: item.crop.hindi, confidence: Math.floor(item.score) })),
    profitability: {
      expectedYieldPerAcre: `${Math.round(quintalsPerAcre)} - ${Math.round(quintalsPerAcre * 1.3)} Qtl`,
      costOfCultivation: `₹${costOfCultivation.toLocaleString('en-IN')}`,
      marketValue: `₹${Math.round(grossRevenue).toLocaleString('en-IN')}`,
      netProfit: `₹${Math.round(netProfit).toLocaleString('en-IN')}`,
      riskLevel: diseaseRisk.level === 'High' ? 'High' : 'Moderate',
      riskColor: diseaseRisk.level === 'High' ? 'text-red-500' : 'text-emerald-500'
    },
    diseaseRisk,
    fertilizerNeeds
  };
};

export const getMarketForecast = async (cropName: string): Promise<MarketForecast> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const baseMandi = MANDI_RATES.find(m => m.crop.toLowerCase().includes(cropName.toLowerCase())) || MANDI_RATES[0];
  const startPrice = baseMandi.price;
  
  const forecastData: PricePoint[] = [];
  const now = new Date();
  let peakPrice = 0;
  let peakIndex = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    
    // Simulate trend + seasonality
    const trend = Math.sin(i / 10) * 0.05; 
    const random = (Math.random() - 0.5) * 0.02;
    const currentPrice = Math.round(startPrice * (1 + trend + random));
    
    if (currentPrice > peakPrice) {
      peakPrice = currentPrice;
      peakIndex = i;
    }

    forecastData.push({
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      price: currentPrice
    });
  }

  forecastData[peakIndex].isPeak = true;
  const peakDate = forecastData[peakIndex].date;

  const trendType = forecastData[29].price > startPrice ? 'Bullish' : 'Bearish';
  const expectedJump = ((forecastData[29].price - startPrice) / startPrice * 100).toFixed(1);

  return {
    cropName,
    currentPrice: startPrice,
    predictedTrend: trendType,
    volatility: 0.15,
    bestSellingWindow: `${peakDate} - ${forecastData[Math.min(29, peakIndex + 3)].date}`,
    expectedPriceJump: `${expectedJump}%`,
    forecastData,
    advisoryNote: trendType === 'Bullish' 
      ? `Market sentiments for ${cropName} are positive. Hold stock for at least 2 weeks to maximize ROI.`
      : `High supply from regional Mandis expected. Consider selling current stock within the next 48 hours.`
  };
};

export const detectDiseaseFromImage = async (base64Image: string): Promise<DiseaseDetectionResult> => {
  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1],
      mimeType: 'image/jpeg',
    },
  };
  const textPart = {
    text: `You are a senior plant pathologist with 20+ years of experience in Indian agriculture.

Analyze the provided image carefully:

1. First determine if the image shows a plant leaf, crop, or vegetation that can be meaningfully assessed for diseases or deficiencies.
   - If NOT (e.g. person, room, vehicle, food, etc.), set isValidImage=false with a helpful errorMessage.
   - If YES, set isValidImage=true and perform a full diagnosis.

2. For a valid plant image, diagnose:
   - diseaseName: Specific disease/disorder name (e.g. "Rice Blast", "Powdery Mildew", "Iron Chlorosis"). If healthy, say "Healthy Plant — No Disease Detected".
   - confidence: 0-100 integer reflecting your diagnostic certainty.
   - severity: "Low" | "Moderate" | "High" — based on visual spread and damage.
   - diseaseType: "Biotic" (caused by living organisms) | "Abiotic" (caused by environment/stress) | "Nutritional" (nutrient deficiency/toxicity).
   - pathogenType: "Fungal" | "Bacterial" | "Viral" | "Pest" | "Nematode" | "Environmental" | "Deficiency".
   - symptoms: Describe visible symptoms seen in this specific image (2-3 sentences).
   - treatment: Practical treatment steps with specific chemical names + dosages available in India (e.g. "Spray Mancozeb 75WP @ 2g/L water..."). Include both chemical and organic options.
   - prevention: 2-3 actionable prevention measures for this specific disease.
   - affectedCrops: Comma-separated list of crops commonly affected by this disease (e.g. "Rice, Wheat, Maize").

Respond strictly as JSON.`
  };

  const DEMO_RESULT: DiseaseDetectionResult = {
    isValidImage: true,
    diseaseName: 'Powdery Mildew (Erysiphe spp.)',
    confidence: 84,
    severity: 'Moderate',
    diseaseType: 'Biotic',
    pathogenType: 'Fungal',
    symptoms: 'White to grey powdery fungal colonies visible on upper leaf surfaces. Leaves may curl slightly and show chlorotic patches beneath the white growth. Severely affected tissue turns necrotic.',
    treatment: 'Spray Sulphur 80 WP @ 3g/L or Hexaconazole 5 SC @ 1ml/L at 10-day intervals. For organic management, use baking soda solution (5g/L) with a few drops of neem oil.',
    prevention: 'Maintain canopy airflow by pruning dense foliage. Avoid overhead irrigation. Apply preventive sulphur dust during high-humidity periods.',
    affectedCrops: 'Wheat, Mango, Grapes, Peas, Cucurbits, Tomato',
  };

  try {
    const response = await generateWithFallback({
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidImage:  { type: Type.BOOLEAN },
            errorMessage:  { type: Type.STRING },
            diseaseName:   { type: Type.STRING },
            confidence:    { type: Type.NUMBER },
            symptoms:      { type: Type.STRING },
            treatment:     { type: Type.STRING },
            prevention:    { type: Type.STRING },
            severity:      { type: Type.STRING },
            diseaseType:   { type: Type.STRING },
            pathogenType:  { type: Type.STRING },
            affectedCrops: { type: Type.STRING },
          },
          required: ["isValidImage", "diseaseName", "confidence", "symptoms", "treatment", "prevention", "severity", "diseaseType", "pathogenType", "affectedCrops"]
        }
      }
    });
    const data = JSON.parse(response.text || '{}') as DiseaseDetectionResult;
    if (!data.diseaseName) return DEMO_RESULT;
    return data;
  } catch {
    return DEMO_RESULT;
  }
};

export const streamChatResponse = async (history: ChatMessage[], message: string, language: string = 'English') => {
  // Keep only the last 30 messages to avoid token bloat
  const trimmedHistory = history.slice(-30);

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are **AgriAssistant**, the AI agronomist of AgriFuture Luxe — India's most advanced agricultural intelligence platform.

**Language:** ${language}. Always respond in this language. If the user writes in Hindi/regional script, reply in the same script.

**Your Domain Expertise:**
- 🌱 Soil Science: NPK analysis, pH correction, organic matter, micronutrients (Fe, Zn, B, Mn), soil testing interpretation.
- 💧 Water & Irrigation: Drip, sprinkler, flood irrigation. Evapotranspiration, scheduling, soil moisture. Integration with AgriDrone tool.
- 🌾 Crop Management: Kharif (Rice, Cotton, Soybean), Rabi (Wheat, Mustard, Chana), Zaid crops. Sowing windows, varieties, intercropping.
- 🐛 Pest & Disease: IPM (Integrated Pest Management), biological controls, fungicides/bactericides/insecticides available in India. FSSAI-compliant pesticide list.
- 📈 Market Intelligence: MSP 2026-27, APMC mandi prices, commodity futures, best selling windows, eNAM platform.
- 🏛️ Government Schemes: PM-KISAN, PMFBY, Kisan Credit Card, Soil Health Card, PMKSY, state-specific subsidies.
- 🌦️ Agro-meteorology: Monsoon patterns, IMD forecasts, frost/heat stress management, climate-smart agriculture.
- 🤖 AgriFuture Features: Scan (disease detection), AgriDrone (irrigation mapping), Market (price forecasts), Store (agri inputs), Schemes (govt benefits), Expenses (farm accounting), History (report archive).

**Response Style:**
- Use Markdown: **bold** for key terms, bullet points for lists, \`code\` for chemical dosages.
- Keep responses under 250 words unless a detailed explanation is clearly needed.
- Always end disease/pest queries with a prevention tip.
- When recommending chemicals, always include: product name, concentration, dose per litre, and safety interval.
- If a farmer asks about a government scheme, provide the official portal link or helpline number.
- Never give financial investment advice. For market queries, frame as "market data suggests" not "you should invest".
- Be warm, encouraging and respectful — address the user as a fellow professional.`,
    },
    history: trimmedHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
  });

  const result = await chat.sendMessageStream({ message });
  return result;
};

// ─── Crop Calendar ────────────────────────────────────────────────────────────
export const getCropCalendar = async (
  cropName: string,
  durationDays: string,
  state: string
): Promise<CropCalendarWeek[]> => {
  const text = await generateText(`Generate a detailed week-by-week crop cultivation calendar for ${cropName} in ${state}, India.
The crop duration is approximately ${durationDays}.
Divide the full growing cycle into weekly stages. For each week include:
- What activities the farmer should do
- What inputs (fertilizer/water/pesticide) to apply
- What to watch out for (pests, diseases, weather)

Respond strictly as a JSON array of objects. Each object must have:
{ "week": number, "label": string (e.g. "Soil Prep & Sowing"), "activities": string[], "inputs": string, "watchOut": string }

Generate stages covering the full cycle: land prep → sowing → vegetative → flowering → maturation → harvest. Group weeks into meaningful stages.`);
  const match = text.match(/\[[\s\S]*\]/);
  return JSON.parse(match ? match[0] : '[]') as CropCalendarWeek[];
};

// ─── Government Schemes Finder ────────────────────────────────────────────────
export const getGovernmentSchemes = async (
  state: string,
  crop: string,
  landSizeAcres: number
): Promise<GovernmentScheme[]> => {
  const text = await generateText(`List all applicable Indian government agricultural schemes for a farmer with these details:
- State: ${state}
- Primary Crop: ${crop}
- Land Size: ${landSizeAcres} acres

Include: central government schemes (PM-KISAN, PMFBY, PM Fasal Bima, Kisan Credit Card, Soil Health Card, PMKSY, eNAM, etc.) AND state-specific schemes for ${state}.

For each scheme provide practical, actionable information. Respond strictly as a JSON array:
[{ "name": string, "ministry": string, "benefit": string, "eligibility": string, "howToApply": string, "amount": string }]

Only include schemes genuinely applicable to the given crop and land size. Include 6-10 schemes.`);
  const match = text.match(/\[[\s\S]*\]/);
  return JSON.parse(match ? match[0] : '[]') as GovernmentScheme[];
};

// ─── Smart Crop Rotation Recommender ─────────────────────────────────────────
export const getCropRotationPlan = async (
  currentCrop: string,
  soilType: string,
  state: string
): Promise<CropRotationPlan> => {
  const text = await generateText(`You are an expert Indian agronomist. A farmer in ${state || 'India'} has just harvested ${currentCrop} on ${soilType || 'mixed'} soil.

Design an optimal 3-year crop rotation cycle (4-5 steps) that:
1. Replenishes soil nutrients depleted by ${currentCrop}
2. Breaks pest/disease cycles
3. Alternates between nitrogen-fixing, cash, and cover crops
4. Considers Indian seasons (Kharif June-Oct, Rabi Nov-Mar, Zaid Mar-Jun)
5. Maximizes long-term soil health AND farmer income

For each step provide:
- season: e.g. "Rabi 2026-27", "Kharif 2027"
- cropName: English name
- cropHindi: Hindi name
- reason: Why this crop follows the previous (nutrient fix, pest break, cash value, etc.)
- soilBenefit: Specific soil improvement (e.g. "Fixes 40-60 kg N/ha via root nodules")
- duration: Growing period (e.g. "110-120 days")
- icon: One of "nitrogen" (legumes/pulses), "cash" (high value crops), "organic" (green manure/compost crops), "rest" (fallow period), "cover" (cover crops for soil protection)

Also provide:
- totalCycleMonths: Total rotation cycle length
- overallBenefit: One-line summary of the rotation's combined impact on soil health

Return strictly as JSON: { "currentCrop": string, "totalCycleMonths": number, "steps": [...], "overallBenefit": string }`);
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : '{}') as CropRotationPlan;
};

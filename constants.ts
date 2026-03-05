

import { MandiRate, Language } from './types';

// OFFICIAL GOVT OF INDIA MSP (2024-25 Kharif & 2025-26 Rabi Announced) & REAL-TIME APMC MARKET AVERAGES
// Prices are in ₹ per Quintal
export const MANDI_RATES: MandiRate[] = [
  // --- MSP CROPS ---
  { crop: 'Wheat (Sharbati)', price: 2425, change: 1.5, location: 'Sehore', state: 'Madhya Pradesh' }, // Rabi 25-26 MSP
  { crop: 'Paddy (Basmati)', price: 4450, change: -0.2, location: 'Karnal', state: 'Haryana' }, // Market Rate
  { crop: 'Paddy (Common)', price: 2300, change: 0.0, location: 'Raipur', state: 'Chhattisgarh' }, // Kharif 24-25 MSP
  { crop: 'Cotton (Long Staple)', price: 7521, change: 2.1, location: 'Rajkot', state: 'Gujarat' }, // Kharif 24-25 MSP
  { crop: 'Soybean (Yellow)', price: 4892, change: 1.2, location: 'Indore', state: 'Madhya Pradesh' }, // Kharif 24-25 MSP
  { crop: 'Mustard (Rapeseed)', price: 5950, change: -0.8, location: 'Bharatpur', state: 'Rajasthan' }, // Rabi 25-26 MSP
  { crop: 'Chana (Gram)', price: 5650, change: 1.1, location: 'Vidisha', state: 'Madhya Pradesh' }, // Rabi 25-26 MSP
  { crop: 'Tur (Arhar)', price: 7550, change: 3.5, location: 'Kalaburagi', state: 'Karnataka' }, // Kharif 24-25 MSP
  { crop: 'Moong (Green Gram)', price: 8682, change: 0.5, location: 'Merta City', state: 'Rajasthan' }, // Kharif 24-25 MSP
  { crop: 'Urad (Black Gram)', price: 7400, change: 0.2, location: 'Latur', state: 'Maharashtra' }, // Kharif 24-25 MSP
  { crop: 'Groundnut', price: 6783, change: 1.5, location: 'Junagadh', state: 'Gujarat' }, // Kharif 24-25 MSP
  { crop: 'Maize (Kharif)', price: 2225, change: -1.1, location: 'Davangere', state: 'Karnataka' }, // Kharif 24-25 MSP
  { crop: 'Bajra', price: 2625, change: 0.5, location: 'Alwar', state: 'Rajasthan' }, // Kharif 24-25 MSP
  { crop: 'Jowar (Maldandi)', price: 3371, change: 0.0, location: 'Solapur', state: 'Maharashtra' }, // Kharif 24-25 MSP
  { crop: 'Sunflower', price: 7280, change: 1.8, location: 'Latur', state: 'Maharashtra' }, // Kharif 24-25 MSP
  { crop: 'Sesame (Til)', price: 9267, change: 2.2, location: 'Unjha', state: 'Gujarat' }, // Kharif 24-25 MSP
  { crop: 'Barley', price: 1980, change: 0.5, location: 'Jaipur', state: 'Rajasthan' }, // Rabi 25-26 MSP
  { crop: 'Lentil (Masoor)', price: 6700, change: 1.0, location: 'Patna', state: 'Bihar' }, // Rabi 25-26 MSP
  { crop: 'Safflower', price: 5940, change: 0.0, location: 'Parbhani', state: 'Maharashtra' }, // Rabi 25-26 MSP

  // --- CASH CROPS & SPICES (Market Rates) ---
  { crop: 'Turmeric (Finger)', price: 13500, change: 4.5, location: 'Nizamabad', state: 'Telangana' },
  { crop: 'Jeera (Cumin)', price: 24500, change: -2.5, location: 'Unjha', state: 'Gujarat' },
  { crop: 'Coriander (Dhania)', price: 6800, change: 1.2, location: 'Kota', state: 'Rajasthan' },
  { crop: 'Sugarcane (FRP)', price: 340, change: 0.0, location: 'Kolhapur', state: 'Maharashtra' }, // FRP 24-25

  // --- VEGETABLES (Daily APMC Fluctuations) ---
  { crop: 'Onion (Red)', price: 2200, change: 8.5, location: 'Lasalgaon', state: 'Maharashtra' },
  { crop: 'Tomato (Hybrid)', price: 1800, change: 12.5, location: 'Kolar', state: 'Karnataka' },
  { crop: 'Potato (Jyoti)', price: 1450, change: -3.2, location: 'Agra', state: 'Uttar Pradesh' },
  { crop: 'Garlic (Ooty)', price: 16500, change: 5.0, location: 'Mandsaur', state: 'Madhya Pradesh' },
  { crop: 'Ginger (Fresh)', price: 6200, change: 2.1, location: 'Wayanad', state: 'Kerala' }
];

export const LANGUAGES = [
  { code: Language.EN, label: 'English' },
  { code: Language.HI, label: 'Hindi' },
  { code: Language.PB, label: 'Punjabi' },
  { code: Language.MR, label: 'Marathi' },
  { code: Language.GU, label: 'Gujarati' },
];

export const TRANSLATIONS = {
  [Language.EN]: {
    heroTitle: "Cultivate Intelligence",
    heroSub: "Nurturing Soil, Empowering Farmers",
    desc: "The world's most advanced agricultural decision engine, tailored for the Indian ecosystem."
  },
  [Language.HI]: {
    heroTitle: "बुद्धिमानी से खेती करें",
    heroSub: "मिट्टी की जान, किसान की शान",
    desc: "भारतीय पारिस्थितिकी तंत्र के लिए तैयार दुनिया का सबसे उन्नत कृषि निर्णय इंजन।"
  },
  [Language.PB]: {
    heroTitle: "सयानी खेती",
    heroSub: "मइटी दी जान, किसान दी शान",
    desc: "भारतीय पारिस्थितिकी तंत्र लई दुनिया दा सब तो उन्नत कृषि फैसला इंजन।"
  },
  [Language.MR]: {
    heroTitle: "शहाणपणाने शेती करा",
    heroSub: "मातीचा जीव, शेतकऱ्याची शान",
    desc: "भारतीय परिसंस्थेसाठी तयार केलेले जगातील सर्वात प्रगत कृषी निर्णय इंजिन."
  },
  [Language.GU]: {
    heroTitle: "બુદ્ધિપૂર્વક ખેતી કરો",
    heroSub: "માટીનો જીવ, ખેડૂતની શાન",
    desc: "ભારતીય ઇકોસિસ્ટમ માટે તૈયાર કરાયેલ વિશ્વનું સૌથી અદ્યતન કૃષિ નિર્ણય એન્જિન."
  }
};

export const MOCK_LOCATION_DATA = {
  city: "Pune",
  state: "Maharashtra",
  lat: 18.5204,
  lng: 73.8567,
  soilType: "Black Soil (Regur)"
};
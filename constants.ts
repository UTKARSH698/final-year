

import { MandiRate, Language } from './types';

// OFFICIAL GOVT OF INDIA MSP (2025-26 Kharif & 2026-27 Rabi Announced) & REAL-TIME APMC MARKET AVERAGES
// Prices are in ₹ per Quintal
export const MANDI_RATES: MandiRate[] = [
  // --- MSP CROPS ---
  { crop: 'Wheat (Sharbati)', price: 2425, change: 1.5, location: 'Sehore', state: 'Madhya Pradesh' }, // Rabi 26-27 MSP
  { crop: 'Paddy (Basmati)', price: 4450, change: -0.2, location: 'Karnal', state: 'Haryana' }, // Market Rate
  { crop: 'Paddy (Common)', price: 2300, change: 0.0, location: 'Raipur', state: 'Chhattisgarh' }, // Kharif 25-26 MSP
  { crop: 'Cotton (Long Staple)', price: 7521, change: 2.1, location: 'Rajkot', state: 'Gujarat' }, // Kharif 25-26 MSP
  { crop: 'Soybean (Yellow)', price: 4892, change: 1.2, location: 'Indore', state: 'Madhya Pradesh' }, // Kharif 25-26 MSP
  { crop: 'Mustard (Rapeseed)', price: 5950, change: -0.8, location: 'Bharatpur', state: 'Rajasthan' }, // Rabi 26-27 MSP
  { crop: 'Chana (Gram)', price: 5650, change: 1.1, location: 'Vidisha', state: 'Madhya Pradesh' }, // Rabi 26-27 MSP
  { crop: 'Tur (Arhar)', price: 7550, change: 3.5, location: 'Kalaburagi', state: 'Karnataka' }, // Kharif 25-26 MSP
  { crop: 'Moong (Green Gram)', price: 8682, change: 0.5, location: 'Merta City', state: 'Rajasthan' }, // Kharif 25-26 MSP
  { crop: 'Urad (Black Gram)', price: 7400, change: 0.2, location: 'Latur', state: 'Maharashtra' }, // Kharif 25-26 MSP
  { crop: 'Groundnut', price: 6783, change: 1.5, location: 'Junagadh', state: 'Gujarat' }, // Kharif 25-26 MSP
  { crop: 'Maize (Kharif)', price: 2225, change: -1.1, location: 'Davangere', state: 'Karnataka' }, // Kharif 25-26 MSP
  { crop: 'Bajra', price: 2625, change: 0.5, location: 'Alwar', state: 'Rajasthan' }, // Kharif 25-26 MSP
  { crop: 'Jowar (Maldandi)', price: 3371, change: 0.0, location: 'Solapur', state: 'Maharashtra' }, // Kharif 25-26 MSP
  { crop: 'Sunflower', price: 7280, change: 1.8, location: 'Latur', state: 'Maharashtra' }, // Kharif 25-26 MSP
  { crop: 'Sesame (Til)', price: 9267, change: 2.2, location: 'Unjha', state: 'Gujarat' }, // Kharif 25-26 MSP
  { crop: 'Barley', price: 1980, change: 0.5, location: 'Jaipur', state: 'Rajasthan' }, // Rabi 26-27 MSP
  { crop: 'Lentil (Masoor)', price: 6700, change: 1.0, location: 'Patna', state: 'Bihar' }, // Rabi 26-27 MSP
  { crop: 'Safflower', price: 5940, change: 0.0, location: 'Parbhani', state: 'Maharashtra' }, // Rabi 26-27 MSP

  // --- CASH CROPS & SPICES (Market Rates) ---
  { crop: 'Turmeric (Finger)', price: 13500, change: 4.5, location: 'Nizamabad', state: 'Telangana' },
  { crop: 'Jeera (Cumin)', price: 24500, change: -2.5, location: 'Unjha', state: 'Gujarat' },
  { crop: 'Coriander (Dhania)', price: 6800, change: 1.2, location: 'Kota', state: 'Rajasthan' },
  { crop: 'Sugarcane (FRP)', price: 340, change: 0.0, location: 'Kolhapur', state: 'Maharashtra' }, // FRP 25-26

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
    // Hero
    heroTitle: "Cultivate Intelligence", heroSub: "Nurturing Soil, Empowering Farmers",
    desc: "The world's most advanced agricultural decision engine, tailored for the Indian ecosystem.",
    cropsSupported: "Crops Supported", predictionAccuracy: "Prediction Accuracy",
    indianStates: "Indian States", dataPrivacy: "Data Privacy",
    heroRecommend: "Recommend", heroLocation: "Location", heroWeather: "Weather", heroAbout: "About Us",
    heroStart: "Start", heroDetect: "Detect", heroLive: "Live", heroTeam: "Team",
    // Common
    back: "Back", save: "Save Report", analyzing: "Analyzing...", loading: "Loading...",
    confidence: "Confidence", severity: "Severity", low: "Low", moderate: "Moderate", high: "High",
    retry: "Retry",
    // Navbar
    navDrone: "Drone", navScan: "Scan", navMarket: "Market", navGuide: "Guide",
    navStore: "Store", navSchemes: "Schemes", navExpenses: "Expenses",
    myHistory: "My History", myExpenses: "My Expenses", techStack: "Tech Stack",
    adminPanel: "Admin Panel", logout: "Logout", login: "Login",
    // Prediction Form
    fieldAnalysis: "Field Analysis", enterCity: "Enter City / Region",
    detectLocation: "Detect Location", soilType: "Soil Type", soilPh: "Soil pH Level", rainfallEst: "Rainfall Estimate",
    nitrogen: "Nitrogen (N)", phosphorus: "Phosphorus (P)", potassium: "Potassium (K)",
    iotSensorMode: "Live IoT Sensor Mode", analyseSoilData: "Analyse Soil Data",
    processing: "Processing", soilCard: "Have a Soil Health Card?",
    uploadSoilReport: "Upload Soil Report", takePhoto: "Take Photo",
    reportAnalyzed: "Report Analyzed Successfully",
    // Disease Detector
    diseaseDetector: "Plant Disease Detector", uploadPrompt: "Upload a clear photo of a plant leaf",
    diseaseName: "Disease Name", symptoms: "Symptoms", treatment: "Treatment",
    prevention: "Prevention", affectedCrops: "Affected Crops", diseaseType: "Disease Type",
    pathogenType: "Pathogen Type", scanAnother: "Scan Another", healthy: "Healthy Plant",
    analyzingPlant: "Analysing your plant...", dragDrop: "Drag & drop or click to upload",
    // AgriDrone
    agriDrone: "AgriDrone V2", enterLocation: "Enter city or coordinates",
    startScan: "Start Scan", scanScore: "Scan Score", excellent: "Excellent", good: "Good", fair: "Fair",
    soilMoisture: "Soil Moisture", vegetationIndex: "Vegetation Index",
    waterSources: "Water Sources", summary: "Summary", recommendation: "Recommendation",
    distance: "Distance", costEstimate: "Cost Estimate", topography: "Topography",
    scanning: "Scanning terrain...",
    // Schemes Finder
    schemeFinder: "Government Scheme Finder", selectState: "Select State",
    cropType: "Crop Type", landSize: "Land Size (Acres)", findSchemes: "Find Schemes",
    eligibility: "Eligibility", howToApply: "How to Apply", benefit: "Benefit",
    ministry: "Ministry", matchScore: "Match Score", applyNow: "Apply Now",
    schemesFound: "Schemes Found", compare: "Compare",
    // Crop Calendar
    schedule: "Schedule", generatingSchedule: "Generating your crop schedule with AI...",
    failedSchedule: "Failed to generate schedule", noSchedule: "No schedule available",
    activities: "Activities", inputs: "Inputs", watchOut: "Watch Out", week: "Week",
    // Crop Rotation
    smartRotation: "Smart Crop Rotation", currentHarvest: "Current Harvest",
    step: "Step", whyThisCrop: "Why this crop?", soilBenefit: "Soil Benefit",
    analysingCycles: "Analysing soil nutrient cycles...",
    // Results / Crop Prediction
    cropRec: "AI Crop Recommendation", yieldEstimate: "Yield Estimate",
    marketPrice: "Market Price", duration: "Duration", whyCrop: "Why this crop?",
    fertilizerPlan: "Fertilizer Plan", diseaseRisk: "Disease Risk",
    alternativeCrops: "Alternative Crops", chemical: "Chemical", organic: "Organic",
    cropCalendar: "Crop Calendar", cropRotation: "Crop Rotation Plan",
    profitability: "Profitability", costOfCultivation: "Cost of Cultivation",
    netProfit: "Net Profit", marketValue: "Market Value", riskLevel: "Risk Level",
    expectedYield: "Expected Yield / Acre", agronomistNote: "Agronomist's Note",
    saveSuccess: "Report saved!", reset: "New Analysis",
  },
  [Language.HI]: {
    heroTitle: "बुद्धिमानी से खेती करें", heroSub: "मिट्टी की जान, किसान की शान",
    desc: "भारतीय पारिस्थितिकी तंत्र के लिए तैयार दुनिया का सबसे उन्नत कृषि निर्णय इंजन।",
    cropsSupported: "समर्थित फसलें", predictionAccuracy: "भविष्यवाणी सटीकता",
    indianStates: "भारतीय राज्य", dataPrivacy: "डेटा गोपनीयता",
    heroRecommend: "सिफारिश", heroLocation: "स्थान", heroWeather: "मौसम", heroAbout: "हमारे बारे में",
    heroStart: "शुरू करें", heroDetect: "पहचानें", heroLive: "लाइव", heroTeam: "टीम",
    back: "वापस", save: "रिपोर्ट सहेजें", analyzing: "विश्लेषण हो रहा है...", loading: "लोड हो रहा है...",
    confidence: "विश्वसनीयता", severity: "गंभीरता", low: "कम", moderate: "मध्यम", high: "अधिक",
    retry: "पुनः प्रयास करें",
    navDrone: "ड्रोन", navScan: "स्कैन", navMarket: "बाजार", navGuide: "गाइड",
    navStore: "स्टोर", navSchemes: "योजनाएं", navExpenses: "खर्च",
    myHistory: "मेरा इतिहास", myExpenses: "मेरे खर्च", techStack: "तकनीकी स्टैक",
    adminPanel: "एडमिन पैनल", logout: "लॉगआउट", login: "लॉगिन",
    fieldAnalysis: "क्षेत्र विश्लेषण", enterCity: "शहर / क्षेत्र दर्ज करें",
    detectLocation: "स्थान पहचानें", soilType: "मिट्टी का प्रकार", soilPh: "मिट्टी का pH स्तर", rainfallEst: "वर्षा अनुमान",
    nitrogen: "नाइट्रोजन (N)", phosphorus: "फास्फोरस (P)", potassium: "पोटेशियम (K)",
    iotSensorMode: "लाइव IoT सेंसर मोड", analyseSoilData: "मिट्टी डेटा विश्लेषण करें",
    processing: "प्रसंस्करण हो रहा है", soilCard: "क्या आपके पास मृदा स्वास्थ्य कार्ड है?",
    uploadSoilReport: "मृदा रिपोर्ट अपलोड करें", takePhoto: "फोटो लें",
    reportAnalyzed: "रिपोर्ट का सफलतापूर्वक विश्लेषण किया",
    schedule: "अनुसूची", generatingSchedule: "AI के साथ फसल अनुसूची तैयार हो रही है...",
    failedSchedule: "अनुसूची तैयार करने में विफल", noSchedule: "कोई अनुसूची उपलब्ध नहीं",
    activities: "गतिविधियां", inputs: "इनपुट", watchOut: "सावधान रहें", week: "सप्ताह",
    smartRotation: "स्मार्ट फसल चक्र", currentHarvest: "वर्तमान फसल",
    step: "चरण", whyThisCrop: "यह फसल क्यों?", soilBenefit: "मिट्टी लाभ",
    analysingCycles: "मिट्टी पोषक चक्रों का विश्लेषण हो रहा है...",
    diseaseDetector: "पौधे का रोग पहचानकर्ता", uploadPrompt: "पौधे की पत्ती की स्पष्ट फोटो अपलोड करें",
    diseaseName: "रोग का नाम", symptoms: "लक्षण", treatment: "उपचार",
    prevention: "रोकथाम", affectedCrops: "प्रभावित फसलें", diseaseType: "रोग का प्रकार",
    pathogenType: "रोगाणु का प्रकार", scanAnother: "दूसरा स्कैन करें", healthy: "स्वस्थ पौधा",
    analyzingPlant: "आपके पौधे का विश्लेषण हो रहा है...", dragDrop: "खींचें और छोड़ें या अपलोड करने के लिए क्लिक करें",
    agriDrone: "एग्री ड्रोन V2", enterLocation: "शहर या निर्देशांक दर्ज करें",
    startScan: "स्कैन शुरू करें", scanScore: "स्कैन स्कोर", excellent: "उत्कृष्ट", good: "अच्छा", fair: "ठीक है",
    soilMoisture: "मिट्टी की नमी", vegetationIndex: "वनस्पति सूचकांक",
    waterSources: "जल स्रोत", summary: "सारांश", recommendation: "सिफारिश",
    distance: "दूरी", costEstimate: "लागत अनुमान", topography: "भूस्वरूप",
    scanning: "भूभाग स्कैन हो रहा है...",
    schemeFinder: "सरकारी योजना खोजकर्ता", selectState: "राज्य चुनें",
    cropType: "फसल प्रकार", landSize: "भूमि आकार (एकड़)", findSchemes: "योजनाएं खोजें",
    eligibility: "पात्रता", howToApply: "आवेदन कैसे करें", benefit: "लाभ",
    ministry: "मंत्रालय", matchScore: "मिलान स्कोर", applyNow: "अभी आवेदन करें",
    schemesFound: "योजनाएं मिलीं", compare: "तुलना करें",
    cropRec: "AI फसल अनुशंसा", yieldEstimate: "उपज अनुमान",
    marketPrice: "बाजार मूल्य", duration: "अवधि", whyCrop: "यह फसल क्यों?",
    fertilizerPlan: "उर्वरक योजना", diseaseRisk: "रोग जोखिम",
    alternativeCrops: "वैकल्पिक फसलें", chemical: "रासायनिक", organic: "जैविक",
    cropCalendar: "फसल कैलेंडर", cropRotation: "फसल चक्र योजना",
    profitability: "लाभप्रदता", costOfCultivation: "खेती की लागत",
    netProfit: "शुद्ध लाभ", marketValue: "बाजार मूल्य", riskLevel: "जोखिम स्तर",
    expectedYield: "अपेक्षित उपज / एकड़", agronomistNote: "कृषि विशेषज्ञ की सलाह",
    saveSuccess: "रिपोर्ट सहेजी गई!", reset: "नया विश्लेषण",
  },
  [Language.PB]: {
    heroTitle: "सयानी खेती", heroSub: "मइटी दी जान, किसान दी शान",
    desc: "भारतीय पारिस्थितिकी तंत्र लई दुनिया दा सब तो उन्नत कृषि फैसला इंजन।",
    cropsSupported: "ਸਮਰਥਿਤ ਫ਼ਸਲਾਂ", predictionAccuracy: "ਭਵਿੱਖਬਾਣੀ ਸਟੀਕਤਾ",
    indianStates: "ਭਾਰਤੀ ਰਾਜ", dataPrivacy: "ਡੇਟਾ ਗੋਪਨੀਯਤਾ",
    heroRecommend: "ਸਿਫ਼ਾਰਿਸ਼", heroLocation: "ਟਿਕਾਣਾ", heroWeather: "ਮੌਸਮ", heroAbout: "ਸਾਡੇ ਬਾਰੇ",
    heroStart: "ਸ਼ੁਰੂ ਕਰੋ", heroDetect: "ਪਛਾਣੋ", heroLive: "ਲਾਈਵ", heroTeam: "ਟੀਮ",
    back: "ਵਾਪਸ", save: "ਰਿਪੋਰਟ ਸੁਰੱਖਿਅਤ ਕਰੋ", analyzing: "ਵਿਸ਼ਲੇਸ਼ਣ ਹੋ ਰਿਹਾ ਹੈ...", loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
    confidence: "ਭਰੋਸੇਯੋਗਤਾ", severity: "ਗੰਭੀਰਤਾ", low: "ਘੱਟ", moderate: "ਦਰਮਿਆਨਾ", high: "ਵੱਧ",
    retry: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    navDrone: "ਡਰੋਨ", navScan: "ਸਕੈਨ", navMarket: "ਬਾਜ਼ਾਰ", navGuide: "ਗਾਈਡ",
    navStore: "ਸਟੋਰ", navSchemes: "ਯੋਜਨਾਵਾਂ", navExpenses: "ਖਰਚੇ",
    myHistory: "ਮੇਰਾ ਇਤਿਹਾਸ", myExpenses: "ਮੇਰੇ ਖਰਚੇ", techStack: "ਤਕਨੀਕੀ ਸਟੈਕ",
    adminPanel: "ਐਡਮਿਨ ਪੈਨਲ", logout: "ਲੌਗਆਉਟ", login: "ਲੌਗਿਨ",
    fieldAnalysis: "ਖੇਤ ਵਿਸ਼ਲੇਸ਼ਣ", enterCity: "ਸ਼ਹਿਰ / ਖੇਤਰ ਦਾਖਲ ਕਰੋ",
    detectLocation: "ਟਿਕਾਣਾ ਲੱਭੋ", soilType: "ਮਿੱਟੀ ਦੀ ਕਿਸਮ", soilPh: "ਮਿੱਟੀ ਦਾ pH ਪੱਧਰ", rainfallEst: "ਵਰਖਾ ਅਨੁਮਾਨ",
    nitrogen: "ਨਾਈਟ੍ਰੋਜਨ (N)", phosphorus: "ਫਾਸਫੋਰਸ (P)", potassium: "ਪੋਟਾਸ਼ੀਅਮ (K)",
    iotSensorMode: "ਲਾਈਵ IoT ਸੈਂਸਰ ਮੋਡ", analyseSoilData: "ਮਿੱਟੀ ਡੇਟਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ",
    processing: "ਪ੍ਰੋਸੈਸਿੰਗ ਹੋ ਰਹੀ ਹੈ", soilCard: "ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਹੈ?",
    uploadSoilReport: "ਮਿੱਟੀ ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ", takePhoto: "ਫੋਟੋ ਲਓ",
    reportAnalyzed: "ਰਿਪੋਰਟ ਸਫਲਤਾਪੂਰਵਕ ਵਿਸ਼ਲੇਸ਼ਣ ਕੀਤੀ",
    schedule: "ਸਮਾਂ-ਸਾਰਣੀ", generatingSchedule: "AI ਨਾਲ ਫਸਲ ਸਮਾਂ-ਸਾਰਣੀ ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ...",
    failedSchedule: "ਸਮਾਂ-ਸਾਰਣੀ ਤਿਆਰ ਕਰਨ ਵਿੱਚ ਅਸਫਲ", noSchedule: "ਕੋਈ ਸਮਾਂ-ਸਾਰਣੀ ਉਪਲਬਧ ਨਹੀਂ",
    activities: "ਗਤੀਵਿਧੀਆਂ", inputs: "ਇਨਪੁੱਟ", watchOut: "ਸਾਵਧਾਨ ਰਹੋ", week: "ਹਫ਼ਤਾ",
    smartRotation: "ਸਮਾਰਟ ਫ਼ਸਲ ਚੱਕਰ", currentHarvest: "ਮੌਜੂਦਾ ਫ਼ਸਲ",
    step: "ਕਦਮ", whyThisCrop: "ਇਹ ਫ਼ਸਲ ਕਿਉਂ?", soilBenefit: "ਮਿੱਟੀ ਲਾਭ",
    analysingCycles: "ਮਿੱਟੀ ਪੌਸ਼ਟਿਕ ਚੱਕਰਾਂ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਹੋ ਰਿਹਾ ਹੈ...",
    diseaseDetector: "ਪੌਦੇ ਦਾ ਰੋਗ ਪਛਾਣਕਰਤਾ", uploadPrompt: "ਪੌਦੇ ਦੇ ਪੱਤੇ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
    diseaseName: "ਰੋਗ ਦਾ ਨਾਮ", symptoms: "ਲੱਛਣ", treatment: "ਇਲਾਜ",
    prevention: "ਰੋਕਥਾਮ", affectedCrops: "ਪ੍ਰਭਾਵਿਤ ਫਸਲਾਂ", diseaseType: "ਰੋਗ ਦੀ ਕਿਸਮ",
    pathogenType: "ਰੋਗਾਣੂ ਦੀ ਕਿਸਮ", scanAnother: "ਹੋਰ ਸਕੈਨ ਕਰੋ", healthy: "ਸਿਹਤਮੰਦ ਪੌਦਾ",
    analyzingPlant: "ਤੁਹਾਡੇ ਪੌਦੇ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ...", dragDrop: "ਖਿੱਚੋ ਅਤੇ ਛੱਡੋ ਜਾਂ ਅਪਲੋਡ ਕਰਨ ਲਈ ਕਲਿੱਕ ਕਰੋ",
    agriDrone: "ਐਗਰੀ ਡਰੋਨ V2", enterLocation: "ਸ਼ਹਿਰ ਜਾਂ ਕੋਆਰਡੀਨੇਟ ਦਾਖਲ ਕਰੋ",
    startScan: "ਸਕੈਨ ਸ਼ੁਰੂ ਕਰੋ", scanScore: "ਸਕੈਨ ਸਕੋਰ", excellent: "ਉੱਤਮ", good: "ਚੰਗਾ", fair: "ਠੀਕ ਹੈ",
    soilMoisture: "ਮਿੱਟੀ ਦੀ ਨਮੀ", vegetationIndex: "ਬਨਸਪਤੀ ਸੂਚਕਾਂਕ",
    waterSources: "ਪਾਣੀ ਦੇ ਸਰੋਤ", summary: "ਸੰਖੇਪ", recommendation: "ਸਿਫ਼ਾਰਿਸ਼",
    distance: "ਦੂਰੀ", costEstimate: "ਲਾਗਤ ਅਨੁਮਾਨ", topography: "ਭੂਗੋਲ",
    scanning: "ਖੇਤਰ ਸਕੈਨ ਹੋ ਰਿਹਾ ਹੈ...",
    schemeFinder: "ਸਰਕਾਰੀ ਯੋਜਨਾ ਖੋਜਕਰਤਾ", selectState: "ਰਾਜ ਚੁਣੋ",
    cropType: "ਫਸਲ ਦੀ ਕਿਸਮ", landSize: "ਜ਼ਮੀਨ ਦਾ ਆਕਾਰ (ਏਕੜ)", findSchemes: "ਯੋਜਨਾਵਾਂ ਲੱਭੋ",
    eligibility: "ਯੋਗਤਾ", howToApply: "ਅਰਜ਼ੀ ਕਿਵੇਂ ਕਰੀਏ", benefit: "ਲਾਭ",
    ministry: "ਮੰਤਰਾਲਾ", matchScore: "ਮੇਲ ਸਕੋਰ", applyNow: "ਹੁਣੇ ਅਰਜ਼ੀ ਕਰੋ",
    schemesFound: "ਯੋਜਨਾਵਾਂ ਮਿਲੀਆਂ", compare: "ਤੁਲਨਾ ਕਰੋ",
    cropRec: "AI ਫਸਲ ਸਿਫ਼ਾਰਿਸ਼", yieldEstimate: "ਉਪਜ ਅਨੁਮਾਨ",
    marketPrice: "ਬਾਜ਼ਾਰ ਭਾਅ", duration: "ਸਮਾਂ", whyCrop: "ਇਹ ਫਸਲ ਕਿਉਂ?",
    fertilizerPlan: "ਖਾਦ ਯੋਜਨਾ", diseaseRisk: "ਰੋਗ ਜੋਖਮ",
    alternativeCrops: "ਵਿਕਲਪਿਕ ਫਸਲਾਂ", chemical: "ਰਸਾਇਣਕ", organic: "ਜੈਵਿਕ",
    cropCalendar: "ਫਸਲ ਕੈਲੰਡਰ", cropRotation: "ਫਸਲ ਚੱਕਰ ਯੋਜਨਾ",
    profitability: "ਮੁਨਾਫ਼ਾ", costOfCultivation: "ਖੇਤੀ ਲਾਗਤ",
    netProfit: "ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ", marketValue: "ਬਾਜ਼ਾਰ ਮੁੱਲ", riskLevel: "ਜੋਖਮ ਪੱਧਰ",
    expectedYield: "ਅਨੁਮਾਨਿਤ ਉਪਜ / ਏਕੜ", agronomistNote: "ਖੇਤੀ ਮਾਹਰ ਦੀ ਸਲਾਹ",
    saveSuccess: "ਰਿਪੋਰਟ ਸੁਰੱਖਿਅਤ ਕੀਤੀ!", reset: "ਨਵਾਂ ਵਿਸ਼ਲੇਸ਼ਣ",
  },
  [Language.MR]: {
    heroTitle: "शहाणपणाने शेती करा", heroSub: "मातीचा जीव, शेतकऱ्याची शान",
    desc: "भारतीय परिसंस्थेसाठी तयार केलेले जगातील सर्वात प्रगत कृषी निर्णय इंजिन.",
    cropsSupported: "समर्थित पिके", predictionAccuracy: "अंदाज अचूकता",
    indianStates: "भारतीय राज्ये", dataPrivacy: "डेटा गोपनीयता",
    heroRecommend: "शिफारस", heroLocation: "स्थान", heroWeather: "हवामान", heroAbout: "आमच्याबद्दल",
    heroStart: "सुरू करा", heroDetect: "शोधा", heroLive: "थेट", heroTeam: "संघ",
    back: "मागे", save: "अहवाल जतन करा", analyzing: "विश्लेषण होत आहे...", loading: "लोड होत आहे...",
    confidence: "विश्वासार्हता", severity: "तीव्रता", low: "कमी", moderate: "मध्यम", high: "जास्त",
    retry: "पुन्हा प्रयत्न करा",
    navDrone: "ड्रोन", navScan: "स्कॅन", navMarket: "बाजार", navGuide: "मार्गदर्शक",
    navStore: "दुकान", navSchemes: "योजना", navExpenses: "खर्च",
    myHistory: "माझा इतिहास", myExpenses: "माझे खर्च", techStack: "तंत्रज्ञान स्टॅक",
    adminPanel: "प्रशासक पॅनेल", logout: "लॉगआउट", login: "लॉगिन",
    fieldAnalysis: "क्षेत्र विश्लेषण", enterCity: "शहर / प्रदेश प्रविष्ट करा",
    detectLocation: "स्थान शोधा", soilType: "मातीचा प्रकार", soilPh: "मातीची pH पातळी", rainfallEst: "पाऊस अंदाज",
    nitrogen: "नायट्रोजन (N)", phosphorus: "फॉस्फरस (P)", potassium: "पोटॅशियम (K)",
    iotSensorMode: "थेट IoT सेन्सर मोड", analyseSoilData: "माती डेटाचे विश्लेषण करा",
    processing: "प्रक्रिया होत आहे", soilCard: "तुमच्याकडे माती आरोग्य कार्ड आहे का?",
    uploadSoilReport: "माती अहवाल अपलोड करा", takePhoto: "फोटो काढा",
    reportAnalyzed: "अहवाल यशस्वीरित्या विश्लेषित केला",
    schedule: "वेळापत्रक", generatingSchedule: "AI सह पीक वेळापत्रक तयार होत आहे...",
    failedSchedule: "वेळापत्रक तयार करणे अयशस्वी", noSchedule: "कोणतेही वेळापत्रक उपलब्ध नाही",
    activities: "उपक्रम", inputs: "इनपुट", watchOut: "सावध राहा", week: "आठवडा",
    smartRotation: "स्मार्ट पीक चक्र", currentHarvest: "सध्याचे पीक",
    step: "पाऊल", whyThisCrop: "हे पीक का?", soilBenefit: "माती फायदा",
    analysingCycles: "माती पोषक चक्रांचे विश्लेषण होत आहे...",
    diseaseDetector: "वनस्पती रोग शोधक", uploadPrompt: "वनस्पतीच्या पानाचा स्पष्ट फोटो अपलोड करा",
    diseaseName: "रोगाचे नाव", symptoms: "लक्षणे", treatment: "उपचार",
    prevention: "प्रतिबंध", affectedCrops: "प्रभावित पिके", diseaseType: "रोगाचा प्रकार",
    pathogenType: "रोगकारकाचा प्रकार", scanAnother: "दुसरे स्कॅन करा", healthy: "निरोगी वनस्पती",
    analyzingPlant: "तुमच्या वनस्पतीचे विश्लेषण होत आहे...", dragDrop: "ड्रॅग करा किंवा अपलोड करण्यासाठी क्लिक करा",
    agriDrone: "अॅग्री ड्रोन V2", enterLocation: "शहर किंवा निर्देशांक प्रविष्ट करा",
    startScan: "स्कॅन सुरू करा", scanScore: "स्कॅन स्कोर", excellent: "उत्कृष्ट", good: "चांगले", fair: "ठीक आहे",
    soilMoisture: "मातीतील ओलावा", vegetationIndex: "वनस्पती निर्देशांक",
    waterSources: "पाण्याचे स्रोत", summary: "सारांश", recommendation: "शिफारस",
    distance: "अंतर", costEstimate: "खर्च अंदाज", topography: "भूरूपशास्त्र",
    scanning: "भूभाग स्कॅन होत आहे...",
    schemeFinder: "सरकारी योजना शोधक", selectState: "राज्य निवडा",
    cropType: "पीक प्रकार", landSize: "जमीन आकार (एकर)", findSchemes: "योजना शोधा",
    eligibility: "पात्रता", howToApply: "अर्ज कसा करावा", benefit: "लाभ",
    ministry: "मंत्रालय", matchScore: "जुळणी स्कोर", applyNow: "आत्ता अर्ज करा",
    schemesFound: "योजना सापडल्या", compare: "तुलना करा",
    cropRec: "AI पीक शिफारस", yieldEstimate: "उत्पादन अंदाज",
    marketPrice: "बाजार भाव", duration: "कालावधी", whyCrop: "हे पीक का?",
    fertilizerPlan: "खत योजना", diseaseRisk: "रोग धोका",
    alternativeCrops: "पर्यायी पिके", chemical: "रासायनिक", organic: "सेंद्रिय",
    cropCalendar: "पीक दिनदर्शिका", cropRotation: "पीक चक्र योजना",
    profitability: "नफा", costOfCultivation: "शेती खर्च",
    netProfit: "निव्वळ नफा", marketValue: "बाजार मूल्य", riskLevel: "धोका पातळी",
    expectedYield: "अपेक्षित उत्पादन / एकर", agronomistNote: "कृषी तज्ज्ञांचा सल्ला",
    saveSuccess: "अहवाल जतन केला!", reset: "नवीन विश्लेषण",
  },
  [Language.GU]: {
    heroTitle: "બુદ્ધિપૂર્વક ખેતી કરો", heroSub: "માટીનો જીવ, ખેડૂતની શાન",
    desc: "ભારતીય ઇકોસિસ્ટમ માટે તૈયાર કરાયેલ વિશ્વનું સૌથી અદ્યતન કૃષિ નિર્ણય એન્જિન.",
    cropsSupported: "સમર્થિત પાક", predictionAccuracy: "આગાહી ચોકસાઈ",
    indianStates: "ભારતીય રાજ્યો", dataPrivacy: "ડેટા ગોપનીયતા",
    heroRecommend: "ભલામણ", heroLocation: "સ્થાન", heroWeather: "હવામાન", heroAbout: "અમારા વિશે",
    heroStart: "શરૂ કરો", heroDetect: "શોધો", heroLive: "લાઈવ", heroTeam: "ટીમ",
    back: "પાછળ", save: "રિપોર્ટ સાચવો", analyzing: "વિشلेষণ થઈ રહ્યું છે...", loading: "લોડ થઈ રહ્યું છે...",
    confidence: "વિشवसनीयता", severity: "તીવ્રતા", low: "ઓછી", moderate: "મધ્યમ", high: "વધુ",
    retry: "ફરી પ્રयास કरो",
    navDrone: "ડ્રોन", navScan: "સ્कॅन", navMarket: "બジар", navGuide: "маргदर्शिका",
    navStore: "સ્ટоर", navSchemes: "योजनाओ", navExpenses: "ખрच",
    myHistory: "мारо ઇтिहас", myExpenses: "мारा ખрच", techStack: "ТेкТाचо स्тाक",
    adminPanel: "एडमिन पॅनल", logout: "लॉगआउट", login: "लॉगिन",
    fieldAnalysis: "ক্षেত্র विश्लेषण", enterCity: "શहेर / प्रदेश दाखل करो",
    detectLocation: "स्थान शोधो", soilType: "माटीनो प्रकार", soilPh: "माटीनो pH स्तर", rainfallEst: "वर्षा अंदाज",
    nitrogen: "नायट्रोजन (N)", phosphorus: "फॉस्फरस (P)", potassium: "पोटेशियम (K)",
    iotSensorMode: "लाइव IoT सेंसर मोड", analyseSoilData: "माटी डेटानो विश्लेषण करो",
    processing: "प्रक्रिया थई रही छे", soilCard: "शु तमारी पासे माटी स्वास्थ्य कार्ड छे?",
    uploadSoilReport: "माटी अहेवाल अपलोड करो", takePhoto: "फोटो लो",
    reportAnalyzed: "अहेवाल सफलतापूर्वक विश्लेषित",
    schedule: "समयपत्रक", generatingSchedule: "AI साथे पाक समयपत्रक तयार थई रह्युं छे...",
    failedSchedule: "समयपत्रक तयार करवामां निष्फल", noSchedule: "कोई समयपत्रक उपलब्ध नथी",
    activities: "प्रवृत्तिओ", inputs: "इनपुट", watchOut: "सावध रहो", week: "अठवाडियुं",
    smartRotation: "स्मार्ट पाक चक्र", currentHarvest: "वर्तमान पाक",
    step: "पगलुं", whyThisCrop: "आ पाक शा माटे?", soilBenefit: "माटी फायदो",
    analysingCycles: "माटी पोषक चक्रोनुं विश्लेषण...",
    diseaseDetector: "છોડ રોગ શોધક", uploadPrompt: "છોડના પાનનો સ્પષ્ટ ફોટો અપલોડ કરો",
    diseaseName: "રોગનું નામ", symptoms: "લક્ષણો", treatment: "સારવાર",
    prevention: "નિવારણ", affectedCrops: "અસરગ્રસ્ત પાક", diseaseType: "રોગનો પ્રકાર",
    pathogenType: "રોગકારકનો પ્રકાર", scanAnother: "બીજું સ્કેન કરો", healthy: "સ્વસ્થ છોડ",
    analyzingPlant: "તમારા છોડનું વિશ્લેષણ થઈ રહ્યું છે...", dragDrop: "ખેંચો અને છોડો અથવા અપલોડ કરવા ક્લિક કરો",
    agriDrone: "એગ્રી ડ્રોન V2", enterLocation: "શહેર અથવા કોઓર્ડિનેટ દાખલ કરો",
    startScan: "સ્કેન શરૂ કરો", scanScore: "સ્કેન સ્કોર", excellent: "ઉત્કૃષ્ટ", good: "સારું", fair: "ઠીક છે",
    soilMoisture: "માટીની ભેજ", vegetationIndex: "વનસ્પતિ સૂચકાંક",
    waterSources: "પાણીના સ્ત્રોત", summary: "સારાંશ", recommendation: "ભલામણ",
    distance: "અંતર", costEstimate: "ખર્ચ અંદાજ", topography: "ભૂ-સ્વરૂપ",
    scanning: "ભૂભાગ સ્કેન થઈ રહ્યો છે...",
    schemeFinder: "સરકારી યોજના શોધક", selectState: "રાજ્ય પસંદ કરો",
    cropType: "પાકનો પ્રકાર", landSize: "જમીનનું કદ (એકર)", findSchemes: "યોજنाઓ શોધો",
    eligibility: "પાત્રતા", howToApply: "અરજી કેવી રીતે કરવી", benefit: "લાભ",
    ministry: "મંત્રાલય", matchScore: "મેળ સ્કોર", applyNow: "હમણાં અરજી કરો",
    schemesFound: "યોજनाઓ મળી", compare: "સરખામણી કરો",
    cropRec: "AI પાક ભલામણ", yieldEstimate: "ઉત્પાદન અંદાજ",
    marketPrice: "બજાર ભાવ", duration: "સમયગાળો", whyCrop: "આ પાક કેમ?",
    fertilizerPlan: "ખાતર યોजना", diseaseRisk: "રોગ જોખમ",
    alternativeCrops: "વૈકલ્પિક પાક", chemical: "રાસાયણિક", organic: "જૈવિક",
    cropCalendar: "પાક કેલેન્ડર", cropRotation: "પાક ચક્ર યોजना",
    profitability: "નફો", costOfCultivation: "ખેતી ખર્ચ",
    netProfit: "ચોખ્ખો નફો", marketValue: "બજાર મૂલ્ય", riskLevel: "જોખમ સ્તર",
    expectedYield: "અપેક્ષિત ઉત્પાદન / એકર", agronomistNote: "કૃષિ નિષ્ણાત સલાહ",
    saveSuccess: "રિپોર્ટ સાચવ્યો!", reset: "નવું વિшлेષণ",
  }
};

// Simple translation helper — use in any component:
// const t = getT(language);  then  t('diseaseName')
export type TFunc = (key: keyof typeof TRANSLATIONS[Language]) => string;
export const getT = (lang: Language): TFunc => {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS[Language.EN];
  const en   = TRANSLATIONS[Language.EN];
  return (key) => (dict as any)[key] ?? (en as any)[key] ?? String(key);
};

export const MOCK_LOCATION_DATA = {
  city: "Pune",
  state: "Maharashtra",
  lat: 18.5204,
  lng: 73.8567,
  soilType: "Black Soil (Regur)"
};
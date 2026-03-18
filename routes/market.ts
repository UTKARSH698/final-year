import { Router } from "express";

const router = Router();

const MANDI_RATES = [
  { crop: "Wheat (Sharbati)",     price: 2425,  change:  1.5,  location: "Sehore",      state: "Madhya Pradesh" },
  { crop: "Paddy (Basmati)",      price: 4450,  change: -0.2,  location: "Karnal",      state: "Haryana" },
  { crop: "Paddy (Common)",       price: 2300,  change:  0.0,  location: "Raipur",      state: "Chhattisgarh" },
  { crop: "Cotton (Long Staple)", price: 7521,  change:  2.1,  location: "Rajkot",      state: "Gujarat" },
  { crop: "Soybean (Yellow)",     price: 4892,  change:  1.2,  location: "Indore",      state: "Madhya Pradesh" },
  { crop: "Mustard (Rapeseed)",   price: 5950,  change: -0.8,  location: "Bharatpur",   state: "Rajasthan" },
  { crop: "Chana (Gram)",         price: 5650,  change:  1.1,  location: "Vidisha",     state: "Madhya Pradesh" },
  { crop: "Tur (Arhar)",          price: 7550,  change:  3.5,  location: "Kalaburagi",  state: "Karnataka" },
  { crop: "Moong (Green Gram)",   price: 8682,  change:  0.5,  location: "Merta City",  state: "Rajasthan" },
  { crop: "Urad (Black Gram)",    price: 7400,  change:  0.2,  location: "Latur",       state: "Maharashtra" },
  { crop: "Groundnut",            price: 6783,  change:  1.5,  location: "Junagadh",    state: "Gujarat" },
  { crop: "Maize (Kharif)",       price: 2225,  change: -1.1,  location: "Davangere",   state: "Karnataka" },
  { crop: "Bajra",                price: 2625,  change:  0.5,  location: "Alwar",       state: "Rajasthan" },
  { crop: "Jowar (Maldandi)",     price: 3371,  change:  0.0,  location: "Solapur",     state: "Maharashtra" },
  { crop: "Sunflower",            price: 7280,  change:  1.8,  location: "Latur",       state: "Maharashtra" },
  { crop: "Sesame (Til)",         price: 9267,  change:  2.2,  location: "Unjha",       state: "Gujarat" },
  { crop: "Barley",               price: 1980,  change:  0.5,  location: "Jaipur",      state: "Rajasthan" },
  { crop: "Lentil (Masoor)",      price: 6700,  change:  1.0,  location: "Patna",       state: "Bihar" },
  { crop: "Safflower",            price: 5940,  change:  0.0,  location: "Parbhani",    state: "Maharashtra" },
  { crop: "Turmeric (Finger)",    price: 13500, change:  4.5,  location: "Nizamabad",   state: "Telangana" },
  { crop: "Jeera (Cumin)",        price: 24500, change: -2.5,  location: "Unjha",       state: "Gujarat" },
  { crop: "Coriander (Dhania)",   price: 6800,  change:  1.2,  location: "Kota",        state: "Rajasthan" },
  { crop: "Sugarcane (FRP)",      price: 340,   change:  0.0,  location: "Kolhapur",    state: "Maharashtra" },
  { crop: "Onion (Red)",          price: 2200,  change:  8.5,  location: "Lasalgaon",   state: "Maharashtra" },
  { crop: "Tomato (Hybrid)",      price: 1800,  change: 12.5,  location: "Kolar",       state: "Karnataka" },
  { crop: "Potato (Jyoti)",       price: 1450,  change: -3.2,  location: "Agra",        state: "Uttar Pradesh" },
  { crop: "Garlic (Ooty)",        price: 16500, change:  5.0,  location: "Mandsaur",    state: "Madhya Pradesh" },
  { crop: "Ginger (Fresh)",       price: 6200,  change:  2.1,  location: "Wayanad",     state: "Kerala" },
];

router.get("/mandi-rates", (_req, res) => {
  res.json(MANDI_RATES);
});

router.get("/market-prices", (_req, res) => {
  res.json(
    MANDI_RATES.slice(0, 6).map((m) => ({
      crop:   m.crop,
      price:  `₹${m.price}/qtl`,
      trend:  m.change >= 0 ? "up" : "down",
      change: `${m.change >= 0 ? "+" : ""}${m.change}%`,
    }))
  );
});

export default router;

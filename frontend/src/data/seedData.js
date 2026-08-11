export const SEED_LISTINGS = [
  { id: "L-1041", seller: "David Ssemakula", sellerId: "S-01", sellerType: "smallholder", district: "Wakiso", cat: "Fruits", name: "Fresh tomatoes", qty: 340, unit: "kg", price: 3000, rating: 4.7, ratings: 38, verified: true, top: true, voice: 22, photos: 3, ref: 3200, note: "Picked this morning, firm and clean. Grade one, sorted by size." },
  { id: "L-1042", seller: "Sarah Nabirye", sellerId: "S-02", sellerType: "smallholder", district: "Mukono", cat: "Vegetables", name: "Sukuma wiki (kale)", qty: 120, unit: "kg", price: 1800, rating: 4.4, ratings: 19, verified: true, top: false, voice: 14, photos: 2, ref: 2000, note: "Cut to order. Tell me the day you want it and I cut that morning." },
  { id: "L-1043", seller: "Kato Farms Ltd", sellerId: "S-03", sellerType: "commercial", district: "Luweero", cat: "Cereals", name: "Maize grain, dried", qty: 1200, unit: "kg", price: 1650, rating: 4.9, ratings: 57, verified: true, top: true, voice: 0, photos: 4, ref: 1750, note: "Dried to 13.5% moisture, machine cleaned, packed in 100 kg bags." },
  { id: "L-1044", seller: "Grace Nakimuli", sellerId: "S-04", sellerType: "smallholder", district: "Mpigi", cat: "Legumes", name: "Nambale beans", qty: 0, unit: "kg", price: 3900, rating: 4.1, ratings: 11, verified: true, top: false, voice: 31, photos: 1, ref: 4100, note: "Sorted by hand. Next lot ready in three weeks." },
  { id: "L-1045", seller: "David Ssemakula", sellerId: "S-01", sellerType: "smallholder", district: "Wakiso", cat: "Tubers", name: "Sweet potatoes", qty: 450, unit: "kg", price: 1900, rating: 4.7, ratings: 38, verified: true, top: true, voice: 0, photos: 2, ref: 2100, note: "Orange flesh, medium size. Good for both home and restaurant use." },
  { id: "L-1046", seller: "Moses Wanyama", sellerId: "S-05", sellerType: "aggregator", district: "Buikwe", cat: "Fruits", name: "Ssukaali ndiizi bananas", qty: 85, unit: "bunch", price: 12000, rating: 3.8, ratings: 6, verified: false, top: false, voice: 18, photos: 2, ref: 13000, note: "Collected from four farms in Buikwe. Ripeness varies by bunch." },
  { id: "L-1047", seller: "Nakaseke Growers Co-op", sellerId: "S-06", sellerType: "group", district: "Nakaseke", cat: "Vegetables", name: "Onions, red", qty: 700, unit: "kg", price: 2600, rating: 4.6, ratings: 24, verified: true, top: true, voice: 0, photos: 3, ref: 2800, note: "Pooled from 31 member farmers. Cured and ready for storage." },
  { id: "L-1048", seller: "Kato Farms Ltd", sellerId: "S-03", sellerType: "commercial", district: "Luweero", cat: "Legumes", name: "Groundnuts, shelled", qty: 380, unit: "kg", price: 7400, rating: 4.9, ratings: 57, verified: true, top: true, voice: 0, photos: 2, ref: 7800, note: "Red beauty variety, shelled and graded. Aflatoxin tested." },
];

export const SEED_PLANS = [
  { id: "H-201", seller: "David Ssemakula", sellerId: "S-01", district: "Wakiso", cat: "Vegetables", name: "Green peppers", planted: "2026-05-04", harvest: "2026-08-12", qty: 600, reserved: 180, unit: "kg", price: 4200, deposit: 30 },
  { id: "H-202", seller: "Kato Farms Ltd", sellerId: "S-03", district: "Luweero", cat: "Cereals", name: "Maize, season B", planted: "2026-04-18", harvest: "2026-09-02", qty: 5000, reserved: 1200, unit: "kg", price: 1600, deposit: 25 },
  { id: "H-203", seller: "Grace Nakimuli", sellerId: "S-04", district: "Mpigi", cat: "Tubers", name: "Cassava, fresh", planted: "2025-11-20", harvest: "2026-08-01", qty: 2000, reserved: 0, unit: "kg", price: 1200, deposit: 30 },
];

export const SEED_ORDERS = [
  { id: "ORD-5512", type: "order", buyer: "Nakato Catering", buyerId: "B-01", sellerId: "S-01", seller: "David Ssemakula", item: "Fresh tomatoes", qty: 60, unit: "kg", price: 3000, status: "delivered", mode: "Motorcycle", paid: true, provider: "MTN", rated: true, stars: 5, placed: "11 Jul" },
  { id: "ORD-5513", type: "order", buyer: "Nakato Catering", buyerId: "B-01", sellerId: "S-03", seller: "Kato Farms Ltd", item: "Maize grain, dried", qty: 400, unit: "kg", price: 1650, status: "out_for_delivery", mode: "Motor truck", paid: true, provider: "Airtel", rated: false, placed: "16 Jul" },
  { id: "ORD-5514", type: "order", buyer: "Kampala Fresh Mart", buyerId: "B-02", sellerId: "S-01", seller: "David Ssemakula", item: "Sweet potatoes", qty: 200, unit: "kg", price: 1900, status: "accepted", mode: "Motor truck", paid: true, provider: "MTN", rated: false, placed: "18 Jul" },
  { id: "PRE-3301", type: "preorder", buyer: "Nakato Catering", buyerId: "B-01", sellerId: "S-01", seller: "David Ssemakula", item: "Green peppers (harvest 12 Aug)", qty: 180, unit: "kg", price: 4200, status: "reserved", paid: true, provider: "MTN", depositPct: 30, rated: false, placed: "09 Jul" },
];

export const SEED_PENDING = [
  { id: "S-11", name: "Aisha Namutebi", type: "smallholder", nin: "CF9204119XKJ2E", phone: "+256 77 •• •• 412", district: "Nakaseke", ninMatch: true, otp: true, gps: true, submitted: "18 Jul, 09:12" },
  { id: "S-12", name: "Peter Ochieng", type: "aggregator", nin: "CM8811223PLQ7A", phone: "+256 70 •• •• 883", district: "Mityana", ninMatch: false, otp: true, gps: true, submitted: "18 Jul, 11:40" },
  { id: "S-13", name: "Bugiri Women's Group", type: "group", nin: "CF9506087TRW1B", phone: "+256 75 •• •• 209", district: "Wakiso", ninMatch: true, otp: true, gps: false, submitted: "19 Jul, 07:55" },
];

export const SEED_DISPUTES = [
  { id: "D-88", order: "ORD-5498", raisedBy: "Buyer · Kampala Fresh Mart", reason: "Delivered quantity short by 12 kg", value: 96000, opened: "16 Jul", status: "open" },
  { id: "D-89", order: "ORD-5501", raisedBy: "Seller · Moses Wanyama", reason: "Buyer refused delivery after harvest", value: 420000, opened: "17 Jul", status: "open" },
];

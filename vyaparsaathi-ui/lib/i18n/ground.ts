import type { Language } from "./languages";

export type GroundPilotCopy = {
  groundTitle: string;
  groundNote: string;
  peopleCount: string;
  minutesCounted: string;
  sellingHours: string;
  buyingRate: string;
  estimateFootfall: string;
  peoplePerHour: string;
  estimatedUnits: string;
  priceTitle: string;
  observedPrice: string;
  addPrice: string;
  checkedPrices: string;
  priceMedian: string;
  proposedPrice: string;
  rent: string;
  compareRent: string;
  rentShare: string;
  rentNote: string;
  pilotTitle: string;
  pilotNote: string;
  targetUnits: string;
  dayUnits: string;
  evaluatePilot: string;
  daysRecorded: string;
  averageSales: string;
  forecastRatio: string;
  dailyExpense: string;
  grossRevenue: string;
  itemCost: string;
  grossProfit: string;
  netProfit: string;
  goodSign: string;
  belowForecast: string;
  tryAnotherSpot: string;
};

export const groundCopy: Record<Language, GroundPilotCopy> = {
  English: {
    groundTitle: "Ground Truth Kit",
    groundNote: "Record what you observe locally. Footfall conversion is only a planning assumption; results are not a guarantee.",
    peopleCount: "People who passed",
    minutesCounted: "Minutes counted",
    sellingHours: "Planned selling hours per day",
    buyingRate: "Estimated buyers (%)",
    estimateFootfall: "Estimate daily footfall sales",
    peoplePerHour: "People per hour",
    estimatedUnits: "Estimated units per day",
    priceTitle: "Nearby price checks",
    observedPrice: "Observed competitor price (₹)",
    addPrice: "Add observed price",
    checkedPrices: "Prices recorded",
    priceMedian: "Observed median price",
    proposedPrice: "Your planned price",
    rent: "Monthly rent (₹)",
    compareRent: "Compare rent with estimated sales",
    rentShare: "Rent share of estimated monthly sales",
    rentNote: "Comparison only, based on a 30-day estimate. There is no universal safe rent threshold.",
    pilotTitle: "7-day Pilot Khata",
    pilotNote: "Enter actual units sold and, when known, other daily expenses. Entries are saved on this device.",
    targetUnits: "Forecast units per day",
    dayUnits: "Units sold",
    evaluatePilot: "Review pilot results",
    daysRecorded: "Days recorded",
    averageSales: "Average units sold per day",
    forecastRatio: "Average versus forecast",
    dailyExpense: "Other daily expenses (₹)",
    grossRevenue: "Recorded-item revenue",
    itemCost: "Recorded-item cost",
    grossProfit: "Gross profit",
    netProfit: "Profit after entered expenses",
    goodSign: "Good sign against your forecast",
    belowForecast: "Slightly below your forecast",
    tryAnotherSpot: "Consider testing another spot",
  },
  Hindi: {
    groundTitle: "जमीनी जानकारी किट",
    groundNote: "स्थानीय निरीक्षण दर्ज करें। ग्राहक बनने का अनुपात केवल योजना का अनुमान है, नतीजे की गारंटी नहीं।",
    peopleCount: "गुज़रने वाले लोग",
    minutesCounted: "गिनने के मिनट",
    sellingHours: "रोज़ बिक्री के घंटे",
    buyingRate: "अनुमानित खरीदार (%)",
    estimateFootfall: "दैनिक बिक्री का अनुमान",
    peoplePerHour: "प्रति घंटे लोग",
    estimatedUnits: "प्रतिदिन अनुमानित वस्तुएं",
    priceTitle: "आसपास की कीमतें",
    observedPrice: "दूसरी दुकान का देखा मूल्य (₹)",
    addPrice: "देखा गया मूल्य जोड़ें",
    checkedPrices: "दर्ज कीमतें",
    priceMedian: "दर्ज कीमतों का मध्य मान",
    proposedPrice: "आपका प्रस्तावित मूल्य",
    rent: "मासिक किराया (₹)",
    compareRent: "अनुमानित बिक्री से किराये की तुलना",
    rentShare: "अनुमानित मासिक बिक्री में किराये का हिस्सा",
    rentNote: "30 दिन के अनुमान पर तुलना। किराये की कोई एक सार्वभौमिक सुरक्षित सीमा नहीं है।",
    pilotTitle: "7-दिन की पायलट खाता-बही",
    pilotNote: "पूरे हुए दिनों की वास्तविक बिक्री और, ज्ञात हो तो, अन्य खर्च दर्ज करें। प्रविष्टियां इस डिवाइस पर सेव होंगी।",
    targetUnits: "प्रतिदिन अनुमानित बिक्री",
    dayUnits: "बिकी हुई वस्तुएं",
    evaluatePilot: "पायलट नतीजे देखें",
    daysRecorded: "दर्ज दिन",
    averageSales: "प्रतिदिन औसत बिक्री",
    forecastRatio: "औसत बनाम अनुमान",
    dailyExpense: "अन्य दैनिक खर्च (₹)",
    grossRevenue: "दर्ज वस्तुओं की बिक्री",
    itemCost: "दर्ज वस्तुओं की लागत",
    grossProfit: "सकल लाभ",
    netProfit: "दर्ज खर्चों के बाद लाभ",
    goodSign: "आपके अनुमान के मुकाबले अच्छा संकेत",
    belowForecast: "आपके अनुमान से थोड़ा कम",
    tryAnotherSpot: "दूसरी जगह पर परीक्षण करने पर विचार करें",
  },
  Marathi: {
    groundTitle: "प्रत्यक्ष माहिती किट",
    groundNote: "स्थानिक निरीक्षण नोंदवा. ग्राहक होण्याचे प्रमाण हा केवळ नियोजनाचा अंदाज आहे; हमी नाही.",
    peopleCount: "जाणारे लोक",
    minutesCounted: "मोजलेली मिनिटे",
    sellingHours: "दररोजचे नियोजित विक्री तास",
    buyingRate: "अंदाजे ग्राहक (%)",
    estimateFootfall: "दैनिक विक्रीचा अंदाज",
    peoplePerHour: "प्रति तास लोक",
    estimatedUnits: "दररोज अंदाजे वस्तू",
    priceTitle: "जवळपासच्या किंमती",
    observedPrice: "दुसऱ्या दुकानात दिसलेली किंमत (₹)",
    addPrice: "दिसलेली किंमत जोडा",
    checkedPrices: "नोंदवलेल्या किंमती",
    priceMedian: "नोंदवलेल्या किंमतींचा मध्यक",
    proposedPrice: "तुमची नियोजित किंमत",
    rent: "मासिक भाडे (₹)",
    compareRent: "अंदाजे विक्रीशी भाड्याची तुलना",
    rentShare: "अंदाजे मासिक विक्रीतील भाड्याचा हिस्सा",
    rentNote: "30 दिवसांच्या अंदाजावर आधारित तुलना; भाड्याची एकच सार्वत्रिक सुरक्षित मर्यादा नाही.",
    pilotTitle: "7-दिवसांची पायलट खातेवही",
    pilotNote: "पूर्ण दिवसांची प्रत्यक्ष विक्री आणि माहीत असल्यास इतर खर्च नोंदवा. नोंदी या डिव्हाइसवर जतन होतील.",
    targetUnits: "दररोजचा अंदाज",
    dayUnits: "विकलेल्या वस्तू",
    evaluatePilot: "पायलटचा आढावा घ्या",
    daysRecorded: "नोंदवलेले दिवस",
    averageSales: "दररोजची सरासरी विक्री",
    forecastRatio: "सरासरी विरुद्ध अंदाज",
    dailyExpense: "इतर दैनिक खर्च (₹)",
    grossRevenue: "नोंदवलेल्या वस्तूंची विक्री",
    itemCost: "नोंदवलेल्या वस्तूंचा खर्च",
    grossProfit: "एकूण नफा",
    netProfit: "नोंदवलेल्या खर्चानंतरचा नफा",
    goodSign: "अंदाजाच्या तुलनेत चांगले चिन्ह",
    belowForecast: "अंदाजापेक्षा थोडी कमी विक्री",
    tryAnotherSpot: "दुसऱ्या जागेवर चाचणी करण्याचा विचार करा",
  },
  Gujarati: {
    groundTitle: "જમીની માહિતી કિટ",
    groundNote: "સ્થાનિક નિરીક્ષણ નોંધો. ખરીદી રૂપાંતર માત્ર આયોજનનો અંદાજ છે, પરિણામની ખાતરી નથી.",
    peopleCount: "પસાર થતા લોકો",
    minutesCounted: "ગણતરીના મિનિટ",
    sellingHours: "દરરોજના આયોજન કરેલા વેચાણ કલાક",
    buyingRate: "અંદાજિત ખરીદદારો (%)",
    estimateFootfall: "દૈનિક વેચાણનો અંદાજ",
    peoplePerHour: "દર કલાકે લોકો",
    estimatedUnits: "દરરોજ અંદાજિત વસ્તુઓ",
    priceTitle: "નજીકના ભાવની નોંધ",
    observedPrice: "બીજા વેપારીનો જોયેલો ભાવ (₹)",
    addPrice: "જોયેલો ભાવ ઉમેરો",
    checkedPrices: "નોંધેલા ભાવ",
    priceMedian: "નોંધેલા ભાવનો મધ્યક",
    proposedPrice: "તમારો આયોજન કરેલો ભાવ",
    rent: "માસિક ભાડું (₹)",
    compareRent: "અંદાજિત વેચાણ સાથે ભાડાની તુલના",
    rentShare: "અંદાજિત માસિક વેચાણમાં ભાડાનો હિસ્સો",
    rentNote: "30 દિવસના અંદાજ પર તુલના; ભાડાની કોઈ એક સર્વમાન્ય સલામત મર્યાદા નથી.",
    pilotTitle: "7-દિવસની પાયલોટ ખાતાવહી",
    pilotNote: "પૂર્ણ થયેલા દિવસોનું વાસ્તવિક વેચાણ અને ખબર હોય તો અન્ય ખર્ચ નોંધો. નોંધો આ ઉપકરણ પર સાચવાશે.",
    targetUnits: "દરરોજનો અંદાજ",
    dayUnits: "વેચાયેલી વસ્તુઓ",
    evaluatePilot: "પાયલોટનું મૂલ્યાંકન કરો",
    daysRecorded: "નોંધેલા દિવસો",
    averageSales: "દરરોજનું સરેરાશ વેચાણ",
    forecastRatio: "સરેરાશ સામે અંદાજ",
    dailyExpense: "અન્ય દૈનિક ખર્ચ (₹)",
    grossRevenue: "નોંધેલી વસ્તુઓનું વેચાણ",
    itemCost: "નોંધેલી વસ્તુઓનો ખર્ચ",
    grossProfit: "કુલ નફો",
    netProfit: "નોંધેલા ખર્ચ પછીનો નફો",
    goodSign: "તમારા અંદાજની સામે સારો સંકેત",
    belowForecast: "તમારા અંદાજ કરતાં થોડું ઓછું",
    tryAnotherSpot: "બીજી જગ્યાએ અજમાવવાનું વિચારો",
  },
  Bengali: {
    groundTitle: "মাঠপর্যায়ের তথ্য কিট",
    groundNote: "স্থানীয় পর্যবেক্ষণ লিখুন। ক্রেতা হওয়ার হার পরিকল্পনার অনুমান, ফলাফলের নিশ্চয়তা নয়।",
    peopleCount: "যাতায়াত করা মানুষ",
    minutesCounted: "গণনার মিনিট",
    sellingHours: "প্রতিদিন বিক্রির পরিকল্পিত ঘণ্টা",
    buyingRate: "আনুমানিক ক্রেতা (%)",
    estimateFootfall: "দৈনিক বিক্রির অনুমান",
    peoplePerHour: "প্রতি ঘণ্টায় মানুষ",
    estimatedUnits: "প্রতিদিনের আনুমানিক পণ্য",
    priceTitle: "কাছাকাছি দামের তথ্য",
    observedPrice: "অন্য দোকানে দেখা দাম (₹)",
    addPrice: "দেখা দাম যোগ করুন",
    checkedPrices: "নথিভুক্ত দাম",
    priceMedian: "নথিভুক্ত দামের মধ্যমা",
    proposedPrice: "আপনার পরিকল্পিত দাম",
    rent: "মাসিক ভাড়া (₹)",
    compareRent: "আনুমানিক বিক্রির সঙ্গে ভাড়ার তুলনা",
    rentShare: "আনুমানিক মাসিক বিক্রিতে ভাড়ার অংশ",
    rentNote: "৩০ দিনের অনুমানের ভিত্তিতে তুলনা; ভাড়ার কোনো সার্বজনীন নিরাপদ সীমা নেই।",
    pilotTitle: "৭ দিনের পাইলট খাতা",
    pilotNote: "সম্পন্ন দিনের প্রকৃত বিক্রি এবং জানা থাকলে অন্যান্য খরচ লিখুন। তথ্য এই ডিভাইসে সংরক্ষিত থাকবে।",
    targetUnits: "প্রতিদিনের পূর্বাভাস",
    dayUnits: "বিক্রি হওয়া পণ্য",
    evaluatePilot: "পাইলটের ফল দেখুন",
    daysRecorded: "নথিভুক্ত দিন",
    averageSales: "প্রতিদিনের গড় বিক্রি",
    forecastRatio: "গড় বনাম পূর্বাভাস",
    dailyExpense: "অন্যান্য দৈনিক খরচ (₹)",
    grossRevenue: "নথিভুক্ত পণ্যের বিক্রি",
    itemCost: "নথিভুক্ত পণ্যের খরচ",
    grossProfit: "মোট লাভ",
    netProfit: "লিখিত খরচের পর লাভ",
    goodSign: "আপনার পূর্বাভাসের তুলনায় ভালো লক্ষণ",
    belowForecast: "পূর্বাভাসের চেয়ে সামান্য কম",
    tryAnotherSpot: "অন্য জায়গায় পরীক্ষা করার কথা ভাবুন",
  },
};

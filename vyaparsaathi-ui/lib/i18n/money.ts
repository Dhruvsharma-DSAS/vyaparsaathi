import type { Language } from "./languages";

export type MoneyCopy = {
  navLabel: string;
  title: string;
  loading: string;
  selectBusiness: string;
  sellingPrice: string;
  unitCost: string;
  startupCost: string;
  fixedCosts: string;
  availableCapital: string;
  dailyUnits: string;
  annualRate: string;
  termMonths: string;
  calculate: string;
  margin: string;
  breakEven: string;
  monthlyProfit: string;
  fundingGap: string;
  emi: string;
  useRecipe: string;
  loanOptions: string;
  wantsLoan: string;
  noLoan: string;
  specialCategory: string;
  women: string;
  scst: string;
  findSchemes: string;
  noSchemes: string;
  preliminary: string;
  verify: string;
  licences: string;
  landedTitle: string;
  supplier: string;
  quantity: string;
  unitPrice: string;
  transport: string;
  charges: string;
  addSupplier: string;
  perUnit: string;
  error: string;
};

export const moneyCopy: Record<Language, MoneyCopy> = {
  English: {
    navLabel: "Money", title: "Money, schemes & licences", loading: "Calculating...", selectBusiness: "Business idea", sellingPrice: "Selling price per item",
    unitCost: "Cost to make one item", startupCost: "One-time setup cost", fixedCosts: "Monthly fixed costs",
    availableCapital: "Your available money", dailyUnits: "Expected sales per day", annualRate: "Annual interest rate (%)",
    termMonths: "Loan term (months)", calculate: "Calculate plan", margin: "Margin per item",
    breakEven: "Break-even items per day", monthlyProfit: "Estimated monthly profit", fundingGap: "Funding gap",
    emi: "Estimated monthly EMI", useRecipe: "Calculate sample momo recipe", loanOptions: "Loan options",
    wantsLoan: "Show possible loan schemes", noLoan: "I do not want a loan", specialCategory: "Optional eligibility category",
    women: "Woman-led", scst: "SC/ST-led", findSchemes: "Find preliminary matches", noSchemes: "No preliminary matches for these choices.",
    preliminary: "Preliminary matches only, not eligibility or approval. Scheme details are not independently date-verified; terms may change.",
    verify: "Verify current rules and eligibility with the official portal, lender, or city office.",
    licences: "Permits and registrations to check", landedTitle: "Compare supplier landed cost",
    supplier: "Supplier name", quantity: "Quantity", unitPrice: "Price per unit (₹)", transport: "Transport cost (₹)",
    charges: "Other charges (₹)", addSupplier: "Add supplier quote", perUnit: "Landed cost per unit",
    error: "Could not load or calculate this information. Please try again.",
  },
  Hindi: {
    navLabel: "पैसा", title: "पैसा, योजनाएं और लाइसेंस", loading: "गणना हो रही है...", selectBusiness: "व्यवसाय का विचार", sellingPrice: "एक वस्तु का बिक्री मूल्य",
    unitCost: "एक वस्तु बनाने की लागत", startupCost: "एक बार की शुरुआती लागत", fixedCosts: "मासिक स्थिर खर्च",
    availableCapital: "आपकी उपलब्ध राशि", dailyUnits: "प्रतिदिन अनुमानित बिक्री", annualRate: "वार्षिक ब्याज दर (%)",
    termMonths: "ऋण अवधि (महीने)", calculate: "योजना की गणना करें", margin: "प्रति वस्तु मार्जिन",
    breakEven: "प्रतिदिन ब्रेक-ईवन वस्तुएं", monthlyProfit: "अनुमानित मासिक लाभ", fundingGap: "पूंजी की कमी",
    emi: "अनुमानित मासिक ईएमआई", useRecipe: "नमूना मोमो रेसिपी की लागत निकालें", loanOptions: "ऋण विकल्प",
    wantsLoan: "संभावित ऋण योजनाएं दिखाएं", noLoan: "मुझे ऋण नहीं चाहिए", specialCategory: "वैकल्पिक पात्रता श्रेणी",
    women: "महिला-नेतृत्व", scst: "SC/ST-नेतृत्व", findSchemes: "प्रारंभिक मिलान देखें", noSchemes: "इन विकल्पों के लिए कोई प्रारंभिक मिलान नहीं।",
    preliminary: "ये प्रारंभिक मिलान हैं, पात्रता या मंजूरी नहीं। योजनाओं की तारीख की स्वतंत्र पुष्टि नहीं हुई है; शर्तें बदल सकती हैं।",
    verify: "आधिकारिक पोर्टल, ऋणदाता या शहर कार्यालय से मौजूदा नियम और पात्रता जांचें।",
    licences: "जांचने योग्य परमिट और पंजीकरण", landedTitle: "आपूर्तिकर्ता की कुल लागत की तुलना",
    supplier: "आपूर्तिकर्ता का नाम", quantity: "मात्रा", unitPrice: "प्रति इकाई मूल्य (₹)", transport: "परिवहन लागत (₹)",
    charges: "अन्य शुल्क (₹)", addSupplier: "आपूर्तिकर्ता का भाव जोड़ें", perUnit: "प्रति इकाई पहुंची लागत",
    error: "जानकारी लोड या गणना नहीं हो सकी। फिर कोशिश करें।",
  },
  Marathi: {
    navLabel: "पैसे", title: "पैसे, योजना आणि परवाने", loading: "गणना सुरू आहे...", selectBusiness: "व्यवसायाची कल्पना", sellingPrice: "एका वस्तूची विक्री किंमत",
    unitCost: "एक वस्तू बनवण्याचा खर्च", startupCost: "एकदाचा सुरुवातीचा खर्च", fixedCosts: "मासिक स्थिर खर्च",
    availableCapital: "तुमच्याकडील उपलब्ध रक्कम", dailyUnits: "दररोज अपेक्षित विक्री", annualRate: "वार्षिक व्याजदर (%)",
    termMonths: "कर्जाचा कालावधी (महिने)", calculate: "योजनेची गणना करा", margin: "प्रति वस्तू मार्जिन",
    breakEven: "दररोज ब्रेक-इव्हन वस्तू", monthlyProfit: "अंदाजे मासिक नफा", fundingGap: "भांडवलाची कमतरता",
    emi: "अंदाजे मासिक EMI", useRecipe: "नमुना मोमो रेसिपीचा खर्च काढा", loanOptions: "कर्जाचे पर्याय",
    wantsLoan: "संभाव्य कर्ज योजना दाखवा", noLoan: "मला कर्ज नको", specialCategory: "ऐच्छिक पात्रता गट",
    women: "महिला-नेतृत्व", scst: "SC/ST-नेतृत्व", findSchemes: "प्राथमिक जुळणी शोधा", noSchemes: "या पर्यायांसाठी प्राथमिक जुळणी नाही.",
    preliminary: "ही प्राथमिक जुळणी आहे; पात्रता किंवा मंजुरी नाही. योजनांच्या तारखांची स्वतंत्र पडताळणी नाही; अटी बदलू शकतात.",
    verify: "अधिकृत पोर्टल, कर्जदाता किंवा शहर कार्यालयाकडून सध्याचे नियम आणि पात्रता तपासा.",
    licences: "तपासायचे परवाने आणि नोंदणी", landedTitle: "पुरवठादाराच्या एकूण खर्चाची तुलना",
    supplier: "पुरवठादाराचे नाव", quantity: "प्रमाण", unitPrice: "प्रति युनिट किंमत (₹)", transport: "वाहतूक खर्च (₹)",
    charges: "इतर शुल्क (₹)", addSupplier: "पुरवठादाराचा दर जोडा", perUnit: "प्रति युनिट पोहोच खर्च",
    error: "माहिती लोड किंवा मोजता आली नाही. पुन्हा प्रयत्न करा.",
  },
  Gujarati: {
    navLabel: "પૈસા", title: "પૈસા, યોજનાઓ અને લાઇસન્સ", loading: "ગણતરી થઈ રહી છે...", selectBusiness: "વ્યવસાયનો વિચાર", sellingPrice: "એક વસ્તુની વેચાણ કિંમત",
    unitCost: "એક વસ્તુ બનાવવાનો ખર્ચ", startupCost: "એક વખતનો શરૂઆતનો ખર્ચ", fixedCosts: "માસિક નિશ્ચિત ખર્ચ",
    availableCapital: "તમારી ઉપલબ્ધ રકમ", dailyUnits: "દરરોજનું અનુમાનિત વેચાણ", annualRate: "વાર્ષિક વ્યાજ દર (%)",
    termMonths: "લોનનો સમયગાળો (મહિના)", calculate: "યોજનાની ગણતરી કરો", margin: "દરેક વસ્તુનું માર્જિન",
    breakEven: "દરરોજની બ્રેક-ઈવન વસ્તુઓ", monthlyProfit: "અંદાજિત માસિક નફો", fundingGap: "ભંડોળની ખોટ",
    emi: "અંદાજિત માસિક EMI", useRecipe: "નમૂનાની મોમો રેસિપીનો ખર્ચ ગણો", loanOptions: "લોનના વિકલ્પો",
    wantsLoan: "સંભવિત લોન યોજનાઓ બતાવો", noLoan: "મારે લોન નથી જોઈતી", specialCategory: "વૈકલ્પિક પાત્રતા શ્રેણી",
    women: "મહિલા-આગેવાની", scst: "SC/ST-આગેવાની", findSchemes: "પ્રાથમિક મેળ શોધો", noSchemes: "આ પસંદગીઓ માટે પ્રાથમિક મેળ નથી.",
    preliminary: "આ પ્રાથમિક મેળ છે, પાત્રતા કે મંજૂરી નથી. યોજનાઓની તારીખની સ્વતંત્ર ચકાસણી નથી; શરતો બદલાઈ શકે છે.",
    verify: "સત્તાવાર પોર્ટલ, ધિરાણકર્તા અથવા શહેર કચેરી પાસેથી હાલના નિયમો અને પાત્રતા તપાસો.",
    licences: "તપાસવાના પરવાના અને નોંધણીઓ", landedTitle: "પુરવઠાકર્તાના કુલ ખર્ચની તુલના",
    supplier: "પુરવઠાકર્તાનું નામ", quantity: "જથ્થો", unitPrice: "એકમ દીઠ કિંમત (₹)", transport: "પરિવહન ખર્ચ (₹)",
    charges: "અન્ય ચાર્જ (₹)", addSupplier: "પુરવઠાકર્તાનો ભાવ ઉમેરો", perUnit: "એકમ દીઠ પહોંચેલો ખર્ચ",
    error: "માહિતી લોડ અથવા ગણતરી થઈ શકી નથી. ફરી પ્રયાસ કરો.",
  },
  Bengali: {
    navLabel: "টাকা", title: "টাকা, প্রকল্প ও লাইসেন্স", loading: "হিসাব হচ্ছে...", selectBusiness: "ব্যবসার ধারণা", sellingPrice: "প্রতি পণ্যের বিক্রয়মূল্য",
    unitCost: "একটি পণ্য তৈরির খরচ", startupCost: "এককালীন শুরুর খরচ", fixedCosts: "মাসিক স্থায়ী খরচ",
    availableCapital: "আপনার হাতে থাকা টাকা", dailyUnits: "প্রতিদিনের সম্ভাব্য বিক্রি", annualRate: "বার্ষিক সুদের হার (%)",
    termMonths: "ঋণের মেয়াদ (মাস)", calculate: "পরিকল্পনার হিসাব করুন", margin: "প্রতি পণ্যের মার্জিন",
    breakEven: "প্রতিদিনের ব্রেক-ইভেন পণ্য", monthlyProfit: "আনুমানিক মাসিক লাভ", fundingGap: "অর্থের ঘাটতি",
    emi: "আনুমানিক মাসিক EMI", useRecipe: "নমুনা মোমো রেসিপির খরচ হিসাব করুন", loanOptions: "ঋণের বিকল্প",
    wantsLoan: "সম্ভাব্য ঋণ প্রকল্প দেখান", noLoan: "আমার ঋণ চাই না", specialCategory: "ঐচ্ছিক যোগ্যতার বিভাগ",
    women: "নারী-নেতৃত্বাধীন", scst: "SC/ST-নেতৃত্বাধীন", findSchemes: "প্রাথমিক মিল খুঁজুন", noSchemes: "এই পছন্দে কোনো প্রাথমিক মিল নেই।",
    preliminary: "এগুলি প্রাথমিক মিল, যোগ্যতা বা অনুমোদন নয়। প্রকল্পের তারিখ স্বাধীনভাবে যাচাই করা হয়নি; শর্ত বদলাতে পারে।",
    verify: "সরকারি পোর্টাল, ঋণদাতা বা শহর দপ্তরে বর্তমান নিয়ম ও যোগ্যতা যাচাই করুন।",
    licences: "যে অনুমতি ও নিবন্ধন যাচাই করবেন", landedTitle: "সরবরাহকারীর মোট খরচ তুলনা",
    supplier: "সরবরাহকারীর নাম", quantity: "পরিমাণ", unitPrice: "প্রতি এককের দাম (₹)", transport: "পরিবহন খরচ (₹)",
    charges: "অন্যান্য খরচ (₹)", addSupplier: "সরবরাহকারীর দর যোগ করুন", perUnit: "প্রতি এককের পৌঁছানোর খরচ",
    error: "তথ্য লোড বা হিসাব করা যায়নি। আবার চেষ্টা করুন।",
  },
};

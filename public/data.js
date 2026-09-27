/**
 * Korean Mastery Platform - Comprehensive Curriculum Database
 * Accurate Korean linguistic data, Hangul rules, Audio phonetic guides,
 * Sino/Native numbers, EPS-TOPIK terms, and Dialogue scenarios.
 */

window.KOREAN_DATA = {
  // ---------------------------------------------------------------------------
  // TIER 1: FREE FOUNDATION
  // ---------------------------------------------------------------------------
  hangul: {
    vowels: [
      { char: "ㅏ", rom: "a", name: "ah", desc: "Open mouth wide, like 'father' in English or 'ah' in Pidgin", sound_url: "a" },
      { char: "ㅑ", rom: "ya", name: "yah", desc: "'y' + 'a', like 'yard'", sound_url: "ya" },
      { char: "ㅓ", rom: "eo", name: "uh/aw", desc: "Relaxed jaw, open 'uh' sound, like 'cup' or 'cut'", sound_url: "eo" },
      { char: "ㅕ", rom: "yeo", name: "yuh", desc: "'y' + 'eo', like 'young'", sound_url: "yeo" },
      { char: "ㅗ", rom: "o", name: "oh", desc: "Rounded lips forward, like 'boat' or 'go'", sound_url: "o" },
      { char: "ㅛ", rom: "yo", name: "yoh", desc: "'y' + 'o', like 'yoga'", sound_url: "yo" },
      { char: "ㅜ", rom: "u", name: "oo", desc: "Tight rounded lips, like 'moon' or 'food'", sound_url: "u" },
      { char: "ㅠ", rom: "yu", name: "yoo", desc: "'y' + 'u', like 'you' or 'youth'", sound_url: "yu" },
      { char: "ㅡ", rom: "eu", name: "eu", desc: "Horizontal mouth, teeth close together, like 'good' (without rounding lips)", sound_url: "eu" },
      { char: "ㅣ", rom: "i", name: "ee", desc: "Smile mouth, like 'see' or 'meet'", sound_url: "i" },
      { char: "ㅐ", rom: "ae", name: "eh", desc: "Like 'bed' or 'apple'", sound_url: "ae" },
      { char: "ㅔ", rom: "e", name: "eh", desc: "Like 'egg' or 'set' (modern Korean merges ㅐ and ㅔ)", sound_url: "e" },
      { char: "ㅘ", rom: "wa", name: "wah", desc: "'w' + 'a', like 'water'", sound_url: "wa" },
      { char: "ㅝ", rom: "wo", name: "wuh", desc: "'w' + 'eo', like 'world'", sound_url: "wo" },
      { char: "ㅢ", rom: "ui", name: "eui", desc: "Rapid glide from ㅡ to ㅣ", sound_url: "ui" }
    ],
    consonants: [
      { char: "ㄱ", rom: "g/k", name: "Giyeok (기역)", desc: "Soft 'g' between vowels, soft 'k' at start of word", mouth: "Back of tongue touches soft palate" },
      { char: "ㄴ", rom: "n", name: "Nieun (니은)", desc: "Clear 'n' sound like 'name' or 'Nigeria'", mouth: "Tip of tongue touches upper gum" },
      { char: "ㄷ", rom: "d/t", name: "Digeut (디귿)", desc: "Soft 'd' between vowels, soft 't' at start", mouth: "Tip of tongue taps roof of mouth" },
      { char: "ㄹ", rom: "r/l", name: "Rieul (리을)", desc: "'r' (light flap) at start/middle, 'l' at the end (batchim)", mouth: "Light tongue flap" },
      { char: "ㅁ", rom: "m", name: "Mieum (미음)", desc: "Clear 'm' sound like 'mother' or 'money'", mouth: "Closed lips forming a box shape" },
      { char: "ㅂ", rom: "b/p", name: "Bieup (비읍)", desc: "Soft 'b' between vowels, soft 'p' at start", mouth: "Lips pressed and released" },
      { char: "ㅅ", rom: "s", name: "Siot (시옷)", desc: "Clear 's' sound, becomes 'sh' before 'i' (ㅣ)", mouth: "Teeth close, air passes through" },
      { char: "ㅇ", rom: "ng / silent", name: "Ieung (이응)", desc: "Silent when at the top/initial; sounds like 'ng' (sing) at bottom (batchim)", mouth: "Open throat circle" },
      { char: "ㅈ", rom: "j/ch", name: "Jieut (지읒)", desc: "Soft 'j' like 'jump', crisper 'ch' at start", mouth: "Tongue touches front palate" },
      { char: "ㅊ", rom: "ch", name: "Chieut (치읓)", desc: "Strong aspirated 'ch' with breath of air", mouth: "Aspirated air release" },
      { char: "ㅋ", rom: "k", name: "Kieuk (키읔)", desc: "Strong aspirated 'k' with sharp puff of air", mouth: "Sharp breath from back of throat" },
      { char: "ㅌ", rom: "t", name: "Tieut (티읕)", desc: "Strong aspirated 't' with sharp puff of air", mouth: "Sharp burst of air at teeth" },
      { char: "ㅍ", rom: "p", name: "Pieup (피읖)", desc: "Strong aspirated 'p' with burst of air", mouth: "Sharp pop of lips" },
      { char: "ㅎ", rom: "h", name: "Hieut (히읗)", desc: "Breathy 'h' like 'hope' or 'house'", mouth: "Open air passage" }
    ],
    doubleConsonants: [
      { char: "ㄲ", rom: "kk", name: "Ssang-giyeok", desc: "Tense, crisp 'kk' without puff of air (like 'skate')" },
      { char: "ㄸ", rom: "tt", name: "Ssang-digeut", desc: "Tense, crisp 'tt' without puff of air (like 'stop')" },
      { char: "ㅃ", rom: "pp", name: "Ssang-bieup", desc: "Tense, crisp 'pp' without puff of air (like 'spy')" },
      { char: "ㅆ", rom: "ss", name: "Ssang-siot", desc: "Sharp, tense 'ss' hiss" },
      { char: "ㅉ", rom: "jj", name: "Ssang-jieut", desc: "Tense, crisp 'jj' sound" }
    ],
    blocksGuide: [
      { type: "Horizontal Vowels", rule: "Vowels like ㅗ, ㅛ, ㅜ, ㅠ, ㅡ sit UNDER the consonant (e.g., ㄱ + ㅗ = 고 [go], ㅁ + ㅜ = 무 [mu])" },
      { type: "Vertical Vowels", rule: "Vowels like ㅏ, ㅑ, ㅓ, ㅕ, ㅣ sit to the RIGHT of the consonant (e.g., ㄴ + ㅏ = 나 [na], ㄱ + ㅣ = 기 [gi])" },
      { type: "3-Letter Blocks (Batchim)", rule: "Final consonant sits at the BOTTOM (e.g., ㅎ + ㅏ + ㄴ = 한 [han], ㄱ + ㅜ + ㄱ = 국 [guk] -> 한국 [Hanguk = Korea])" }
    ],
    starterWords: [
      { hangul: "안녕하세요", rom: "An-nyeong-ha-se-yo", meaning: "Hello / Good day (Polite)", breakdown: "안(peace) + 녕(peace) + 하세요(are you doing)" },
      { hangul: "감사합니다", rom: "Gam-sa-ham-ni-da", meaning: "Thank you (Formal)", breakdown: "감사(gratitude) + 합니다(do)" },
      { hangul: "네", rom: "Ne", meaning: "Yes / I agree", breakdown: "Single polite affirmative" },
      { hangul: "아니요", rom: "A-ni-yo", meaning: "No (Polite)", breakdown: "Standard polite negative" },
      { hangul: "한국", rom: "Han-guk", meaning: "South Korea", breakdown: "한(Korea) + 국(Country)" },
      { hangul: "나이지리아", rom: "Na-i-ji-ri-a", meaning: "Nigeria", breakdown: "Country name in Hangul" },
      { hangul: "사람", rom: "Sa-ram", meaning: "Person / People", breakdown: "나이지리아 사람 = Nigerian person" },
      { hangul: "물", rom: "Mul", meaning: "Water", breakdown: "Everyday survival necessity" },
      { hangul: "밥", rom: "Bap", meaning: "Cooked rice / Meal", breakdown: "Central to Korean culture: 밥 먹었어요? (Have you eaten?)" },
      { hangul: "친구", rom: "Chin-gu", meaning: "Friend", breakdown: "친(close) + 구(companion)" },
      { hangul: "선생님", rom: "Seon-saeng-nim", meaning: "Teacher / Respected Master", breakdown: "선생(teacher) + 님(honorific)" },
      { hangul: "학생", rom: "Hak-saeng", meaning: "Student", breakdown: "학(study) + 생(person)" },
      { hangul: "학교", rom: "Hak-gyo", meaning: "School", breakdown: "학(study) + 교(building)" },
      { hangul: "집", rom: "Jip", meaning: "House / Home", breakdown: "Common noun" },
      { hangul: "돈", rom: "Don", meaning: "Money", breakdown: "돈 있어요? = Do you have money?" },
      { hangul: "일", rom: "Il", meaning: "Work / Job / Day", breakdown: "Central for EPS workers" },
      { hangul: "시간", rom: "Si-gan", meaning: "Time / Hour", breakdown: "시(hour) + 간(interval)" },
      { hangul: "오늘", rom: "O-neul", meaning: "Today", breakdown: "오늘 공부해요 = I study today" },
      { hangul: "내일", rom: "Nae-il", meaning: "Tomorrow", breakdown: "내(coming) + 일(day)" },
      { hangul: "좋아요", rom: "Jo-a-yo", meaning: "Good / I like it", breakdown: "좋다(to be good) + 아요" },
      { hangul: "괜찮아요", rom: "Gwaen-chan-a-yo", meaning: "It's okay / No problem", breakdown: "Crucial survival phrase" },
      { hangul: "죄송합니다", rom: "Jwe-song-ham-ni-da", meaning: "I am sorry (Formal)", breakdown: "Use when apologizing" },
      { hangul: "주세요", rom: "Ju-se-yo", meaning: "Please give me...", breakdown: "물 주세요 = Water please" },
      { hangul: "어디", rom: "Eo-di", meaning: "Where", breakdown: "화장실 어디예요? = Where is the restroom?" },
      { hangul: "얼마", rom: "Eol-ma", meaning: "How much (price)", breakdown: "이거 얼마예요? = How much is this?" }
    ]
  },

  // ---------------------------------------------------------------------------
  // TIER 2: SURVIVAL KOREAN (₦500)
  // ---------------------------------------------------------------------------
  survival: {
    politeness: [
      { level: "하십시오체 (Formal High)", ending: "~습니다 / ~습니까?", use: "Used in business, news broadcasts, military, interviews, and speaking to bosses/elders for the first time.", example: "감사합니다 (Thank you), 반갑습니다 (Nice to meet you)" },
      { level: "해요체 (Polite Informal)", ending: "~아요 / ~어요 / ~해요", use: "The most useful everyday form. Safe and polite with colleagues, store staff, taxi drivers, and acquaintances.", example: "밥 먹어요 (I eat), 어디 가요? (Where are you going?)" },
      { level: "반말 (Casual / Intimate)", ending: "~아 / ~어 / ~야", use: "Only with same-age close friends, children, or younger siblings. Never use with superiors or strangers in Korea!", example: "안녕 (Hi), 고마워 (Thanks), 밥 먹어 (Eat)" }
    ],
    numbers: {
      sino: [
        { digit: 1, hangul: "일", rom: "Il", usage: "1st floor, Jan, 1 min" },
        { digit: 2, hangul: "이", rom: "I", usage: "2nd floor, Feb, 2 mins" },
        { digit: 3, hangul: "삼", rom: "Sam", usage: "3000 Won, March" },
        { digit: 4, hangul: "사", rom: "Sa", usage: "4th floor, April" },
        { digit: 5, hangul: "오", rom: "O", usage: "500 Naira, May" },
        { digit: 6, hangul: "육", rom: "Yuk", usage: "June, 6 minutes" },
        { digit: 7, hangul: "칠", rom: "Chil", usage: "July, Room 7" },
        { digit: 8, hangul: "팔", rom: "Pal", usage: "August, 8000 Won" },
        { digit: 9, hangul: "구", rom: "Gu", usage: "September, 9th" },
        { digit: 10, hangul: "십", rom: "Sip", usage: "October, 10 minutes" },
        { digit: 100, hangul: "백", rom: "Baek", usage: "100 Won (백원)" },
        { digit: 1000, hangul: "천", rom: "Cheon", usage: "1,000 Won (천원)" },
        { digit: 10000, hangul: "만", rom: "Man", usage: "10,000 Won (만원 ~ ₦11,000)" }
      ],
      native: [
        { digit: 1, hangul: "하나 (한)", rom: "Ha-na (Han)", usage: "1 person (한 명), 1 bottle (한 병)" },
        { digit: 2, hangul: "둘 (두)", rom: "Dul (Du)", usage: "2 o'clock (두 시), 2 items (두 개)" },
        { digit: 3, hangul: "셋 (세)", rom: "Set (Se)", usage: "3 hours (세 시간), 3 cups (세 잔)" },
        { digit: 4, hangul: "넷 (네)", rom: "Net (Ne)", usage: "4 people (네 명)" },
        { digit: 5, hangul: "다섯", rom: "Da-seot", usage: "5 items (다섯 개)" },
        { digit: 6, hangul: "여섯", rom: "Yeo-seot", usage: "6 o'clock (여섯 시)" },
        { digit: 7, hangul: "일곱", rom: "Il-gop", usage: "7 items (일곱 개)" },
        { digit: 8, hangul: "여덟", rom: "Yeo-deol", usage: "8 hours (여덟 시간)" },
        { digit: 9, hangul: "아홉", rom: "A-hop", usage: "9 o'clock (아홉 시)" },
        { digit: 10, hangul: "열", rom: "Yeol", usage: "10 people (열 명)" },
        { digit: 20, hangul: "스물 (스무)", rom: "Seu-mul", usage: "20 years old (스무 살)" }
      ],
      ruleGuide: "GOLDEN RULE: Use Sino-Korean for MONEY (Won/Naira), DATES (Year, Month, Day), MINUTES, and PHONE NUMBERS. Use Native Korean for COUNTING OBJECTS (개), PEOPLE (명), and HOURS (시) on the clock."
    },
    restaurant: [
      { phrase: "이거 주세요", rom: "I-geo ju-se-yo", meaning: "Please give me this (Point at menu item)", note: "The #1 survival phrase in Korea" },
      { phrase: "물 좀 주세요", rom: "Mul jom ju-se-yo", meaning: "Please give me some water", note: "Water is free in all Korean restaurants" },
      { phrase: "얼마예요?", rom: "Eol-ma-ye-yo?", meaning: "How much is it?", note: "Essential for shopping & market stalls" },
      { phrase: "맵지 않게 해주세요", rom: "Maep-ji an-ke hae-ju-se-yo", meaning: "Please make it not spicy", note: "Vital if you cannot tolerate Gochujang chili" },
      { phrase: "계산해 주세요", rom: "Gye-san-hae ju-se-yo", meaning: "Check/Bill please", note: "Used when paying at the register counter" },
      { phrase: "맛있어요!", rom: "Ma-si-sseo-yo!", meaning: "It's delicious!", note: "Chefs and restaurant owners love hearing this" }
    ],
    transport: [
      { phrase: "화장실 어디예요?", rom: "Hwa-jang-sil eo-di-ye-yo?", meaning: "Where is the restroom?", note: "Subway stations and cafes always have clean restrooms" },
      { phrase: "서울역으로 가주세요", rom: "Seo-ul-yeok-eu-ro ga-ju-se-yo", meaning: "Please take me to Seoul Station (Taxi)", note: "[Location] + 으로 가주세요" },
      { phrase: "여기서 내려주세요", rom: "Yeo-gi-seo nae-ryeo-ju-se-yo", meaning: "Please drop me off here", note: "Used in taxis or small village buses" },
      { phrase: "티머니 카드 충전해 주세요", rom: "Ti-meo-ni ka-deu chung-jeon-hae ju-se-yo", meaning: "Please top up my T-Money transit card", note: "At convenience stores (CU, GS25, 7-Eleven)" }
    ],
    familyAndSocial: [
      { term: "오빠 (Oppa)", meaning: "Older brother (Used by females to older male friends/idols)", context: "Popularized by K-Dramas; conveys respectful warmth" },
      { term: "언니 (Unnie)", meaning: "Older sister (Used by females to older female friends)", context: "Standard respectful term among women" },
      { term: "형 (Hyung)", meaning: "Older brother (Used by males to older male friends/colleagues)", context: "Creates fast brotherhood among guys" },
      { term: "누나 (Noona)", meaning: "Older sister (Used by males to older female friends)", context: "Respectful and affectionate" },
      { term: "선배 (Sunbae)", meaning: "Senior colleague / Senior at school", context: "Crucial in workplace and university hierarchy" },
      { term: "후배 (Hubae)", meaning: "Junior colleague / Junior at school", context: "People who joined after you" },
      { term: "사장님 (Sajang-nim)", meaning: "Boss / CEO / Shop Owner", context: "Safe respectful title for any store owner or business manager" }
    ]
  },

  // ---------------------------------------------------------------------------
  // TIER 3: FLUENCY & CAREER TOOLS (₦2,000)
  // ---------------------------------------------------------------------------
  fluency: {
    epstopik: [
      { term: "안전모 (An-jeon-mo)", meaning: "Safety Helmet / Hard Hat", category: "Factory Safety", example: "안전모를 반드시 착용하십시오 (Must wear safety helmet)" },
      { term: "안전화 (An-jeon-hwa)", meaning: "Safety Steel-toe Boots", category: "Factory Safety", example: "안전화를 신으세요 (Put on safety boots)" },
      { term: "조심하세요 (Jo-sim-ha-se-yo)", meaning: "Be careful / Watch out", category: "Commands", example: "기계 조심하세요 (Watch out for the machine)" },
      { term: "작업 (Jak-eop)", meaning: "Work / Operation / Task", category: "Workplace", example: "작업 시작합니다 (Starting work)" },
      { term: "기계 (Gi-gye)", meaning: "Machine", category: "Equipment", example: "기계를 멈추세요 (Stop the machine)" },
      { term: "스위치 (Seu-wi-chi)", meaning: "Switch", category: "Equipment", example: "스위치를 켜세요 / 끄세요 (Turn switch on/off)" },
      { term: "불량품 (Bul-lyang-pum)", meaning: "Defective product", category: "Quality Control", example: "불량품을 골라내세요 (Sort out defective items)" },
      { term: "포장 (Po-jang)", meaning: "Packaging / Wrapping", category: "Factory Task", example: "박스에 포장하세요 (Pack into boxes)" },
      { term: "월급 (Wol-geup)", meaning: "Monthly Salary", category: "HR & Finance", example: "월급날은 10일입니다 (Payday is on the 10th)" },
      { term: "야근 (Ya-geun)", meaning: "Night Overtime Work", category: "HR & Finance", example: "오늘 야근 있어요? (Is there overtime tonight?)" },
      { term: "휴가 (Hyu-ga)", meaning: "Vacation / Leave of Absence", category: "HR & Finance", example: "휴가 신청서 (Leave application form)" },
      { term: "반장님 (Ban-jang-nim)", meaning: "Factory Shift Foreman", category: "Workplace Titles", example: "반장님께 보고하세요 (Report to the foreman)" }
    ],
    businessEtiquette: [
      {
        title: "The 3 Bowing Angles (절과 인사)",
        desc: "Koreans bow to show respect. 15° for casual greeting to peers; 30° for standard business meetings, clients, and managers; 45° for deep apologies or meeting the CEO/Chairman."
      },
      {
        title: "Two-Hand Rule (양손 원칙)",
        desc: "Always hand over or receive items (business cards, documents, money, drinks) with BOTH hands or with your right hand supported at the wrist/elbow by your left hand. Using one hand is considered disrespectful."
      },
      {
        title: "Nunchi (눈치) - Situational Awareness",
        desc: "The subtle art of reading the atmosphere, anticipating what your manager or client needs before they ask, and maintaining harmony in group settings."
      },
      {
        title: "Workplace Drinking Culture (Hoesik 회식)",
        desc: "Company dinners are key for bonding. If your Korean boss pours you a drink, hold your glass with two hands, turn your head slightly away when sipping, and pour them a refill when their glass is empty."
      }
    ],
    gksGuide: [
      { step: "Step 1: Check Embassy Track Announcement", detail: "Korean Cultural Centre Nigeria (KCCN Abuja) releases the GKS Graduate call every February and Undergraduate call every September on ngr.korean-culture.org." },
      { step: "Step 2: Prepare Certified Documents", detail: "WAEC/Degree certificate, transcript, police report, medical clearance, recommendation letters, and apostille/authentication from MOFA & Ministry of Education in Abuja." },
      { step: "Step 3: Craft Personal Statement & Study Plan", detail: "Highlight your motivation, leadership in Nigeria, research goals, and express commitment to learning Korean and bridging Nigeria-Korea trade and technology." },
      { step: "Step 4: Attach Korean Proficiency Certificate", detail: "Adding your verified Korean Mastery certificate and TOPIK scores gives you an instant 5-10 point advantage in 1st round Embassy screening." }
    ]
  },

  // ---------------------------------------------------------------------------
  // SRS FLASHCARDS DATABASE (30 HIGH-IMPACT VOCABULARY CARDS)
  // ---------------------------------------------------------------------------
  flashcardsDeck: [
    { id: "card_01", front: "안녕하세요", rom: "An-nyeong-ha-se-yo", back: "Hello / Good day (Polite)", tag: "Basics" },
    { id: "card_02", front: "감사합니다", rom: "Gam-sa-ham-ni-da", back: "Thank you (Formal)", tag: "Basics" },
    { id: "card_03", front: "얼마예요?", rom: "Eol-ma-ye-yo?", back: "How much is this?", tag: "Survival" },
    { id: "card_04", front: "물 주세요", rom: "Mul ju-se-yo", back: "Please give me water", tag: "Survival" },
    { id: "card_05", front: "화장실 어디예요?", rom: "Hwa-jang-sil eo-di-ye-yo?", back: "Where is the restroom?", tag: "Directions" },
    { id: "card_06", front: "안전모", rom: "An-jeon-mo", back: "Safety helmet / Hard hat", tag: "EPS-TOPIK" },
    { id: "card_07", front: "조심하세요", rom: "Jo-sim-ha-se-yo", back: "Be careful / Watch out", tag: "Workplace" },
    { id: "card_08", front: "반갑습니다", rom: "Ban-gap-seum-ni-da", back: "Nice to meet you (Formal)", tag: "Basics" },
    { id: "card_09", front: "죄송합니다", rom: "Jwe-song-ham-ni-da", back: "I am sorry (Formal)", tag: "Basics" },
    { id: "card_10", front: "월급", rom: "Wol-geup", back: "Monthly salary", tag: "Workplace" },
    { id: "card_11", front: "야근", rom: "Ya-geun", back: "Night overtime", tag: "Workplace" },
    { id: "card_12", front: "기계", rom: "Gi-gye", back: "Machine / Equipment", tag: "Factory" },
    { id: "card_13", front: "일 (Il)", rom: "Il", back: "Work / Job / Day (Sino)", tag: "Numbers" },
    { id: "card_14", front: "하나 (Han-a)", rom: "Ha-na", back: "1 (Native Korean count)", tag: "Numbers" },
    { id: "card_15", front: "만원", rom: "Man-won", back: "10,000 Korean Won (~₦11,000)", tag: "Money" },
    { id: "card_16", front: "오빠 / 형", rom: "Oppa / Hyung", back: "Older brother (F/M speaker)", tag: "Social" },
    { id: "card_17", front: "언니 / 누나", rom: "Unnie / Noona", back: "Older sister (F/M speaker)", tag: "Social" },
    { id: "card_18", front: "괜찮아요", rom: "Gwaen-chan-a-yo", back: "It is okay / No problem", tag: "Survival" },
    { id: "card_19", front: "맛있어요", rom: "Ma-si-sseo-yo", back: "It is delicious!", tag: "Food" },
    { id: "card_20", front: "불량품", rom: "Bul-lyang-pum", back: "Defective item", tag: "Factory" },
    { id: "card_21", front: "사장님", rom: "Sa-jang-nim", back: "Boss / Company President", tag: "Business" },
    { id: "card_22", front: "눈치 (Nunchi)", rom: "Nun-chi", back: "Situational awareness / tact", tag: "Culture" },
    { id: "card_23", front: "오늘", rom: "O-neul", back: "Today", tag: "Time" },
    { id: "card_24", front: "내일", rom: "Nae-il", back: "Tomorrow", tag: "Time" },
    { id: "card_25", front: "시간", rom: "Si-gan", back: "Time / Hour interval", tag: "Time" }
  ],

  // ---------------------------------------------------------------------------
  // INTERACTIVE DIALOGUE SCENARIOS (TIER 3)
  // ---------------------------------------------------------------------------
  dialogues: [
    {
      id: "epstopik_interview",
      title: "EPS Factory Job Interview in Korea",
      desc: "Practice answering basic questions from a Korean factory supervisor.",
      steps: [
        {
          speaker: "Supervisor (반장님)",
          korean: "안녕하세요! 이름이 무엇입니까?",
          english: "Hello! What is your name?",
          options: [
            { text: "안녕하세요! 저는 나이지리아에서 온 엠마누엘입니다. (Hello! I am Emmanuel from Nigeria.)", correct: true, feedback: "Excellent polite response with proper country introduction!" },
            { text: "안녕, 내 이름은 엠마누엘이야. (Casual)", correct: false, feedback: "Too informal! Never use banmal with a supervisor." }
          ]
        },
        {
          speaker: "Supervisor (반장님)",
          korean: "한국에서 일할 준비가 되었습니까?",
          english: "Are you ready to work hard in Korea?",
          options: [
            { text: "네! 열심히 일하겠습니다! 안전하게 작업하겠습니다. (Yes! I will work hard and work safely.)", correct: true, feedback: "Perfect formal commitment (~하겠습니다) emphasizing safety!" },
            { text: "몰라요. (I don't know.)", correct: false, feedback: "Incorrect attitude for an EPS interview." }
          ]
        },
        {
          speaker: "Supervisor (반장님)",
          korean: "기계 작업할 때 무엇을 조심해야 합니까?",
          english: "What should you be careful of when operating machines?",
          options: [
            { text: "항상 안전모와 안전화를 착용하고, 손 끼임 사고를 조심해야 합니다. (Always wear hard hat and boots, and watch out for hand pinch hazards.)", correct: true, feedback: "Flawless industrial safety answer!" },
            { text: "돈 많이 주세요. (Give me lots of money.)", correct: false, feedback: "Safety comes first in Korean industrial settings." }
          ]
        }
      ]
    },
    {
      id: "restaurant_pocha",
      title: "Ordering Dinner at a Seoul Pocha (Street Food)",
      desc: "Order food, customize spicy level, and ask for the bill.",
      steps: [
        {
          speaker: "Shop Owner (이모님)",
          korean: "어서 오세요! 몇 분이세요?",
          english: "Welcome! How many people in your party?",
          options: [
            { text: "두 명이에요. (Two people.)", correct: true, feedback: "Correct use of Native Korean number 두 + counter 명!" },
            { text: "이 명이에요. (Sino Korean)", correct: false, feedback: "Use Native Korean (두 명), not Sino-Korean (이 명) for counting people." }
          ]
        },
        {
          speaker: "Shop Owner (이모님)",
          korean: "뭐 드릴까요? 떡볶이랑 김밥 맛있어요.",
          english: "What can I get you? The Tteokbokki and Gimbap are delicious.",
          options: [
            { text: "떡볶이 1인분하고 김밥 한 줄 주세요. 덜 맵게 해주세요! (1 portion Tteokbokki and 1 Gimbap roll please. Less spicy!)", correct: true, feedback: "Masterful natural ordering with spicy preference!" },
            { text: "밥! (Rice!)", correct: false, feedback: "Rude single word. Always add 주세요." }
          ]
        },
        {
          speaker: "Shop Owner (이모님)",
          korean: "맛있게 드세요! 다 드셨어요?",
          english: "Enjoy your meal! Are you finished?",
          options: [
            { text: "네, 정말 맛있었어요! 계산해 주세요. (Yes, it was really delicious! Check please.)", correct: true, feedback: "Polite compliment + standard bill request." },
            { text: "돈 가세요. (Go money.)", correct: false, feedback: "Grammatically incorrect. Use 계산해 주세요." }
          ]
        }
      ]
    }
  ],

  // ---------------------------------------------------------------------------
  // INTERACTIVE QUIZZES
  // ---------------------------------------------------------------------------
  quizzes: {
    hangul_quiz: {
      title: "Tier 1: Hangul Master Assessment",
      passScore: 70,
      questions: [
        {
          q: "What is the sound of the Korean vowel 'ㅏ'?",
          options: ["'a' like father", "'o' like boat", "'u' like moon", "'i' like see"],
          answer: 0,
          explain: "ㅏ is the open 'ah' vowel, shaped with a vertical spine and rightward stroke."
        },
        {
          q: "Which consonant makes the 'n' sound (Nieun)?",
          options: ["ㄱ", "ㄴ", "ㅁ", "ㅅ"],
          answer: 1,
          explain: "ㄴ is Nieun, shaped like the tongue touching the upper teeth ridge."
        },
        {
          q: "How do you say 'Thank you' formally in Korean?",
          options: ["안녕하세요 (Annyeonghaseyo)", "감사합니다 (Gamsahamnida)", "죄송합니다 (Joesonghamnida)", "괜찮아요 (Gwaenchanayo)"],
          answer: 1,
          explain: "감사합니다 (Gamsahamnida) is the universally recognized formal 'Thank you'."
        },
        {
          q: "What does the syllable block '한' (Han) consist of?",
          options: ["ㅎ (h) + ㅏ (a) + ㄴ (n)", "ㄱ (g) + ㅗ (o) + ㄱ (k)", "ㅂ (b) + ㅏ (a) + ㅂ (p)", "ㅅ (s) + ㅏ (a) + ㄹ (l)"],
          answer: 0,
          explain: "한 = Initial ㅎ (h) + Medial ㅏ (a) + Batchim ㄴ (n)."
        },
        {
          q: "When is the circle consonant 'ㅇ' (Ieung) silent?",
          options: ["Always silent", "When placed at the top/initial position before a vowel", "When placed at the bottom (batchim)", "Never silent"],
          answer: 1,
          explain: "At the initial position (e.g., 아), 'ㅇ' is a silent placeholder. At the bottom (e.g., 강), it sounds like 'ng'."
        }
      ]
    },
    survival_quiz: {
      title: "Tier 2: Survival Korean Certification Exam",
      passScore: 75,
      questions: [
        {
          q: "Which number system is used for paying MONEY (Won/Naira) in Korea?",
          options: ["Native Korean (하나, 둘, 셋)", "Sino-Korean (일, 이, 삼)", "Roman Numerals", "French counts"],
          answer: 1,
          explain: "Sino-Korean (일, 이, 삼, 사... 만, 백, 천) is always used for currency, dates, and minutes."
        },
        {
          q: "How do you ask 'How much is it?' politely?",
          options: ["어디예요? (Eo-di-ye-yo?)", "얼마예요? (Eol-ma-ye-yo?)", "누구예요? (Nu-gu-ye-yo?)", "뭐예요? (Mwo-ye-yo?)"],
          answer: 1,
          explain: "얼마예요? is the essential phrase for price inquiries."
        },
        {
          q: "What is the polite way to ask for water in a restaurant?",
          options: ["물 주세요 (Mul ju-se-yo)", "물 없다 (Mul eop-da)", "물 가라 (Mul ga-ra)", "물 봐 (Mul bwa)"],
          answer: 0,
          explain: "물 (Water) + 주세요 (Please give me)."
        },
        {
          q: "How does a female speaker respectfully address an older male friend or idol?",
          options: ["형 (Hyung)", "오빠 (Oppa)", "누나 (Noona)", "언니 (Unnie)"],
          answer: 1,
          explain: "Females say '오빠' (Oppa) to older males; males say '형' (Hyung)."
        }
      ]
    }
  }
};

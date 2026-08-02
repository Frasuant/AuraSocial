export interface ModerationResult {
  approved: boolean;
  risk: number;
  category: string;
  note: string;
  summary: string;
  isFlex: boolean;
  flexScore: number;
}

const SAFE: ModerationResult = {
  approved: true,
  risk: 0,
  category: "safe",
  note: "",
  summary: "No issues detected.",
  isFlex: true,
  flexScore: 50,
};

// ═════════════════════════════════════════════════════════════════════════
// 1. TEXT NORMALIZATION — defeat obfuscation tricks
// ═════════════════════════════════════════════════════════════════════════

const LEET_MAP: Record<string, string> = {
  "@": "a", "4": "a", "à": "a", "á": "a", "â": "a", "ã": "a", "ä": "a", "å": "a", "ā": "a", "ă": "a", "ą": "a", "α": "a", "а": "a",
  "8": "b", "ß": "b", "в": "b", "ь": "b",
  "(": "c", "©": "c", "ç": "c", "ć": "c", "č": "c", "с": "c",
  "|)": "d", "ð": "d", "ď": "d", "đ": "d", "д": "d",
  "3": "e", "€": "e", "è": "e", "é": "e", "ê": "e", "ë": "e", "ē": "e", "ĕ": "e", "ę": "e", "ě": "e", "е": "e", "ε": "e",
  "ƒ": "f", "ф": "f",
  "6": "g", "9": "g", "ğ": "g", "ģ": "g", "г": "g",
  "#": "h", "ĥ": "h", "ħ": "h", "н": "h",
  "1": "i", "!": "i", "|": "i", "ì": "i", "í": "i", "î": "i", "ï": "i", "ī": "i", "ĭ": "i", "į": "i", "ı": "i", "и": "i", "ι": "i",
  "ʝ": "j", "й": "j",
  "|<": "k", "ķ": "k", "к": "k",
  "1|": "l", "£": "l", "ļ": "l", "ľ": "l", "ŀ": "l", "ł": "l", "л": "l",
  "/\\/\\": "m", "м": "m",
  "^/": "n", "ñ": "n", "ń": "n", "ņ": "n", "ň": "n", "н": "n",
  "0": "o", "¤": "o", "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ö": "o", "ø": "o", "ō": "o", "ŏ": "o", "ő": "o", "о": "o", "ο": "o",
  "|*": "p", "þ": "p", "п": "p",
  "0,": "q", "ĸ": "q",
  "®": "r", "ŕ": "r", "ŗ": "r", "ř": "r", "р": "r",
  "$": "s", "5": "s", "§": "s", "ś": "s", "ŝ": "s", "ş": "s", "š": "s", "ѕ": "s",
  "7": "t", "+": "t", "ţ": "t", "ť": "t", "ŧ": "t", "т": "t", "τ": "t",
  "|_|": "u", "ù": "u", "ú": "u", "û": "u", "ü": "u", "ũ": "u", "ū": "u", "ŭ": "u", "ů": "u", "ű": "u", "ų": "u", "у": "u", "υ": "u",
  "\\/": "v", "в": "v",
  "\\/\\/": "w", "ŵ": "w", "ω": "w",
  "><": "x", "χ": "x", "х": "x",
  "¥": "y", "ÿ": "y", "ý": "y", "ŷ": "y", "ȳ": "y", "ы": "y",
  "2": "z", "ż": "z", "ž": "z", "з": "z",
};

/** Normalize text: leetspeak → letters, strip accents, remove spaces between letters */
function normalize(text: string): string {
  let result = text.toLowerCase();

  // Normalize Unicode (NFD → strip diacritics → NFC)
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace leetspeak characters — but NOT standalone number sequences
  // "s3x" → "sex" (leet), but "84250" stays as-is (it's a number, not leet)
  let leeted = "";
  let i = 0;
  while (i < result.length) {
    const ch = result[i];
    // Check if we're in a standalone number sequence
    if (/[0-9]/.test(ch)) {
      // Look ahead to find the full number sequence
      let numEnd = i;
      while (numEnd < result.length && /[0-9]/.test(result[numEnd])) numEnd++;
      // Check if this number is standalone (surrounded by non-letters or string boundaries)
      const beforeIsLetter = i > 0 && /[a-z]/.test(result[i - 1]);
      const afterIsLetter = numEnd < result.length && /[a-z]/.test(result[numEnd]);
      if (!beforeIsLetter && !afterIsLetter) {
        // Standalone number — keep as-is (will be removed as non-alpha later)
        leeted += result.slice(i, numEnd);
        i = numEnd;
        continue;
      }
      // Number mixed with letters — apply leetspeak
      const two = result.slice(i, i + 2);
      const three = result.slice(i, i + 3);
      if (LEET_MAP[three]) { leeted += LEET_MAP[three]; i += 3; continue; }
      if (LEET_MAP[two]) { leeted += LEET_MAP[two]; i += 2; continue; }
      if (LEET_MAP[ch]) { leeted += LEET_MAP[ch]; i++; continue; }
      leeted += ch; i++;
    } else {
      const two = result.slice(i, i + 2);
      const three = result.slice(i, i + 3);
      if (LEET_MAP[three]) { leeted += LEET_MAP[three]; i += 3; continue; }
      if (LEET_MAP[two]) { leeted += LEET_MAP[two]; i += 2; continue; }
      if (LEET_MAP[ch]) { leeted += LEET_MAP[ch]; i++; continue; }
      leeted += ch; i++;
    }
  }
  result = leeted;

  // Remove dots, hyphens, underscores, asterisks BETWEEN letters only (iteratively)
  // "d.r.u.g.s" → "drugs" — loop until stable
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/([a-z])[.\-_*~]+([a-z])/g, "$1$2");
  }
  // Convert any remaining non-alpha to spaces (preserves word boundaries)
  result = result.replace(/[^a-z]+/g, " ").trim();
  return result;
}

// ═════════════════════════════════════════════════════════════════════════
// 2. FUZZY MATCHING — catch "drgs", "s3x", "d0p3", etc.
// ═════════════════════════════════════════════════════════════════════════

/** Check if text contains any banned word (with fuzzy matching per word) */
function fuzzyMatch(text: string, bannedWords: string[]): string | null {
  // Split into individual words (text is already normalized with spaces)
  const words = text.split(" ").filter(w => w.length >= 2);
  for (const word of words) {
    for (const banned of bannedWords) {
      // Direct match
      if (word === banned) return banned;
      // Word contains banned word (e.g. "drugsale" contains "drug")
      if (word.length > banned.length && word.includes(banned)) return banned;
      // Levenshtein distance <= 2 ONLY for words >= 5 chars (prevents "work"→"porn" false positives)
      if (word.length >= 5 && banned.length >= 5 && Math.abs(word.length - banned.length) <= 2 && levenshtein(word, banned) <= 2) return banned;
    }
  }
  // Also check 2-word compounds (e.g. "drug sale" → check "drugsale")
  for (let i = 0; i < words.length - 1; i++) {
    const compound = words[i] + words[i + 1];
    for (const banned of bannedWords) {
      if (compound.includes(banned) && banned.length >= 4) return banned;
    }
  }
  return null;
}

/** Levenshtein edit distance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function isSubsequence(text: string, pattern: string): boolean {
  let pi = 0;
  for (let ti = 0; ti < text.length && pi < pattern.length; ti++) {
    if (text[ti] === pattern[pi]) pi++;
  }
  return pi === pattern.length;
}

// ═════════════════════════════════════════════════════════════════════════
// 3. BANNED WORDS — multi-language (EN, IT, ES, FR, DE, PT)
// ═════════════════════════════════════════════════════════════════════════

const NSFW_WORDS = [
  // English
  "nude", "nudes", "naked", "nsfw", "porn", "porno", "xxx", "sex", "sexual", "horny",
  "onlyfans", "tits", "boobs", "asshole", "dick", "cock", "pussy", "cum", "ejaculate",
  "orgasm", "hookup", "fuckbuddy", "slut", "whore", "escort", "sugardaddy", "sugarbaby",
  "pornhub", "redtube", "xvideos", "camgirl", "stripper", "milf", "dildo", "vibrator",
  "masturbat", "fingering", "blowjob", "handjob", "rimjob", "creampie", "gangbang",
  "threesome", "foursome", "orgy", "swinger", "bondage", "bdsm", "fetish", "kink",
  "butt", "boob", "nipple", "areola", "vagina", "penis", "testicle", "anus", "rectum",
  "cleavage", "upskirt", "downblouse", "panties", "lingerie", "bikini",
  "s3x", "sxx", "sx", "nud3s", "n0des", "p0rn", "pr0n", "xxxvideos",
  // Italian
  "sesso", "nudo", "nuda", "nudi", "porno", "cazzo", "fica", "figa", "troia", "puttana",
  "scopare", "scopata", "masturbarsi", " masturbazione", "orgasmo", "puttana", "zoccola",
  "finocchio", "ricchione", "culattone", "arrapato", "arrapata", "trombare", "chiavare",
  "pompino", "segare", "segaiolo", "sborra", "sborrone", " transessuale",
  // Spanish
  "sexo", "desnudo", "desnuda", "porno", "verga", "cono", "puta", "polla", "chocho",
  "coño", "follar", "joder", "chupar", "masturbarse", "masturbacion", "orgasmo",
  "pene", "vagina", "teta", "culo", "prostituta", "guarra", "zorra",
  // French
  "sexe", "nue", "nudit", "porno", "bite", "chatte", "putain", "niquer", "baiser",
  "sucer", "branler", "masturber", "orgasme", "pénis", "vagin", "sein", "cul",
  "prostitue", "salope", "connasse",
  // German
  "sex", "nackt", "porno", "schwanz", "fotze", "hure", "ficken", "blasen", "wichsen",
  "masturbieren", "orgasmus", "penis", "vagina", "titten", "arsch", "prostituierte",
  // Portuguese
  "sexo", "nu", "nua", "porno", "pau", "buceta", "puta", "foder", "chupar", "punheta",
  "masturbar", "orgasmo", "pênis", "vagina", "peito", "cu", "prostituta",
  // Arabic (transliterated)
  "nik", "sharmuta", "kos", "ayr", "zeb",
];

const HATE_WORDS = [
  "killall", "exterminate", "genocide", "ethniccleansing", "subhuman", "masterrace",
  "whitepower", "nazi", "neonazi", "terrorist", "jihad", "killyourself", "godie",
  "killsomeone", "bombmaking", "doxx", "leakaddress", "rape", "molest",
  "worthless", "uselesstrash", "pathetic", "disgusting", "inferiorrace",
  "killyou", "gokill", "selfharm", "suicide", "endsomeone",
  "s3x", "sxx", "sx", "nud3s", "n0des", "p0rn", "pr0n", "xxxvideos",
  // Italian
  "ammazzatu", "ucciditu", "moria", "genocidio", "terrorista",
  // Spanish
  "mata", "asesinar", "genocidio", "terrorista",
  // French
  "tuez", "massacrer", "genocide", "terroriste",
];

const ILLEGAL_WORDS = [
  "drug", "drugs", "dope", "weed", "cocaine", "heroin", "meth", "crack", "mdma", "lsd", "ecstasy", "ketamine",
  "xanax", "adderall", "oxycodone", "percocet", "vicodin", "fentanyl", "opium",
  "stolen", "carding", "fullz", "dumps", "cvvdump", "counterfeit", "fakeid",
  "fakepassport", "fakelicense", "counterfeitmoney", "moneylaunder", "wirefraud",
  "taxfraud", "insurancefraud", "hitman", "contractkill", "murderforhire",
  "howtomakeabomb", "howtobuildabomb", "explosiveinstructions", "weaponmaking",
  "buydrugs", "selldrugs", "drugssale", "drugsselling", "drugcheap", "drugforsale",
  "weaponsale", "firearmssale", "gunsale", "gunssale", "weapon", "firearm",
  "prescriptiondrugs", "medsforsale", "pharmacycheap", "norx",
  "cocaina", "eroina", "droga", "spaccio", "vendodroga", "armiforsale",
  "drgs", "drg", "crck", "methh", "hrbn", "herbn", "cokaine", "cokane",
  "narco", "cartel", "drogue", "ventedrogue", "stupéfiant",
  "s3x", "sxx", "sx", "nud3s", "n0des", "p0rn", "pr0n", "xxxvideos",
  // Italian
  "cocaina", "eroina", "droga", "spaccio", "vendodroga", "armiforsale",
  "drgs", "drg", "crck", "methh", "hrbn", "herbn", "cokaine", "cokane",
  // Spanish
  "droga", "vendodroga", "narco", "cartel",
  // French
  "drogue", "ventedrogue", "stupéfiant",
];

const SCAM_WORDS = [
  "makemoney", "getrich", "passiveincome", "financialfreedom",
  "cryptosignal", "tradingsignal", "investmentopportunity", "forexsignal",
  "binaryoption", "pyramidscheme", "mlm", "networkmarketing",
  "sendwallet", "sendbtc", "sendbitcoin", "sendeth", "sendusdt",
  "rugpull", "airdropclaim", "freemint", "presale", "ico",
  "doubleyourmoney", "multiplyyourmoney", "10x", "100x",
  "cashapp", "venmo", "paypal", "zelle",
  "guaranteedreturn", "instantprofit", "overnightprofit",
  "workfromhomejob", "dataentryjob", "paidsurvey",
  "loan", "creditrepair", "debtfrelief",
  "referrallink", "affiliateprogram", "promoteandearn",
  "dmme", "messageme", "pmme", "whatsappme", "telegramme",
];

// ═════════════════════════════════════════════════════════════════════════
// 4. UNICODE FONT DETECTION — block fancy fonts
// ═════════════════════════════════════════════════════════════════════════

/** Check if text contains fancy Unicode font characters */
function hasFancyFont(text: string): boolean {
  // Mathematical Alphanumeric Symbols (italic, bold, script, gothic, etc.)
  // U+1D400–U+1D7FF
  if (/[\u{1D400}-\u{1D7FF}]/u.test(text)) return true;

  // Letterlike Symbols
  if (/[\u{2100}-\u{214F}]/u.test(text)) return true;

  // Enclosed Alphanumerics (ⒶⒷⒸ)
  if (/[\u{2460}-\u{24FF}]/u.test(text)) return true;

  // Circled/parenthesized letters
  if (/[\u{24B6}-\u{24E9}]/u.test(text)) return true;

  // Mathematical operators that look like letters
  if (/[\u{2200}-\u{22FF}]/u.test(text)) return true;

  // Fullwidth Latin letters (ＡＢＣ)
  if (/[\u{FF00}-\u{FFEF}]/u.test(text)) return true;

  // Halfwidth and Fullwidth Forms
  if (/[\u{FF21}-\u{FF5A}]/u.test(text)) return true;

  // Modifier letters / spacing modifier letters
  if (/[\u{02B0}-\u{02FF}]/u.test(text)) return true;

  // Combining Diacritical Marks for Symbols (used in zalgo text)
  if (/[\u{20D0}-\u{20FF}]/u.test(text)) return true;

  // Variation selectors (invisible characters used in font tricks)
  if (/[\u{FE00}-\u{FE0F}]/u.test(text)) return true;

  // Zero-width characters
  if (/[\u{200B}-\u{200F}]/u.test(text)) return true;
  if (/[\u{2060}-\u{206F}]/u.test(text)) return true;

  // CJK compatibility / squared Latin
  if (/[\u{3300}-\u{33FF}]/u.test(text)) return true;

  return false;
}

// ═════════════════════════════════════════════════════════════════════════
// 5. SPAM PATTERNS
// ═════════════════════════════════════════════════════════════════════════

const SPAM_PATTERNS = [
  /(.)\1{10,}/, // Repeated characters
  /https?:\/\/\S+\s+https?:\/\/\S+/i, // Multiple URLs
  /\b(follow4follow|followforfollow|like4like|likeforlike|sub4sub|subforsub)\b/i,
  /\b(clickthe?link|biolink|linkinbio)\b/i,
  /\b(freerotator|botrotator|autofollower|autoliker)\b/i,
];

// ═════════════════════════════════════════════════════════════════════════
// 6. FLEX DETECTION
// ═════════════════════════════════════════════════════════════════════════

const FLEX_INDICATORS = [
  /\b(bought|buying|purchased|justgot|newcar|newwatch|newhouse|newhome)\b/i,
  /\b(lamborghini|ferrari|porsche|mercedes|bmw|audi|tesla|rollsroyce|bentley|mclaren|bugatti)\b/i,
  /\b(rolex|omega|patek|audemars|cartier|hublot|richardmille)\b/i,
  /\b(earned|revenue|profit|mrr|arr|income|salary|bonus|commission)\b/i,
  /\b(youtube|tiktok|instagram|streamer|contentcreator)\b/i,
  /\b(marathon|personalrecord|benchpress|squat|deadlift|gym|fitness|workout)\b/i,
  /\b(goal|milestone|achievement|accomplished|reached|cracked|broke)\b/i,
  /\b(business|startup|saas|funded|raised|exit|acquired|launched|shipped)\b/i,
  /\b(travel|trip|vacation|destination|flight|hotel|resort)\b/i,
  /\b(graduated|degree|certification|passed|licensed|certified)\b/i,
  /\b(lockedin|grind|hustle|dedication|discipline|consistency)\b/i,
  /\b(quitjob|retired|financiallyfree|freedom)\b/i,
  /\b(promotion|promoted|raise|newrole|newposition)\b/i,
  /🏆|🔥|🚀|💪|💰|🏎️|⌚|📈|✈️|🏖️|🎓/,
];

const OFF_TOPIC_INDICATORS = [
  /\b(what.*everyone.*doing|howis.*day)\b/i,
  /\b(goodmorning|goodnight|happymonday|happyweekend)\b/i,
  /\b(anyoneelse|anyoneknow|anyonehave)\b/i,
  /^\b(hi|hello|hey|sup|yo|whatsup)\b/i,
  /\b(bored|tired|sleepy|sad|depressed|lonely)\b/i,
];

// ═════════════════════════════════════════════════════════════════════════
// 7. MAIN MODERATION FUNCTION
// ═════════════════════════════════════════════════════════════════════════

export async function moderateContent(
  caption: string,
  category: string
): Promise<ModerationResult> {
  if (!caption || caption.trim().length === 0) return SAFE;

  // ── Check for fancy Unicode fonts ──
  if (hasFancyFont(caption)) {
    return {
      approved: false,
      risk: 60,
      category: "spam",
      note: "Fancy/styled Unicode fonts are not allowed. Use regular text only.",
      summary: "Post blocked: contains special font characters.",
      isFlex: false,
      flexScore: 0,
    };
  }

  // ── Normalize the text for detection ──
  const normalized = normalize(caption);

  // ── Check NSFW (multi-language + fuzzy) ──
  const nsfwMatch = fuzzyMatch(normalized, NSFW_WORDS);
  if (nsfwMatch) {
    return {
      approved: false,
      risk: 95,
      category: "explicit",
      note: `NSFW content detected: "${nsfwMatch}"`,
      summary: "This post contains explicit or adult content.",
      isFlex: false,
      flexScore: 0,
    };
  }

  // ── Check hate speech (multi-language + fuzzy) ──
  const hateMatch = fuzzyMatch(normalized, HATE_WORDS);
  if (hateMatch) {
    return {
      approved: false,
      risk: 100,
      category: "hate",
      note: `Hate speech or threats detected: "${hateMatch}"`,
      summary: "This post contains hate speech, threats, or harassment.",
      isFlex: false,
      flexScore: 0,
    };
  }

  // ── Check illegal content (multi-language + fuzzy) ──
  const illegalMatch = fuzzyMatch(normalized, ILLEGAL_WORDS);
  if (illegalMatch) {
    return {
      approved: false,
      risk: 100,
      category: "illegal",
      note: `Illegal goods or services detected: "${illegalMatch}"`,
      summary: "This post promotes illegal goods or services.",
      isFlex: false,
      flexScore: 0,
    };
  }

  // ── Check scams ──
  const scamMatch = fuzzyMatch(normalized, SCAM_WORDS);
  if (scamMatch) {
    // Also check original text for $ amounts and "guaranteed"
    if (/\$\d{2,}.*\b(to|into|turn|make)\b.*\$?\d{3,}/i.test(caption) ||
        /\b(guaranteed|instant|overnight)\b/i.test(caption) ||
        /\b(dm|message|pm)\s*(me|us)\b.*\b(make|earn|get|money|cash|profit)\b/i.test(caption)) {
      return {
        approved: false,
        risk: 90,
        category: "scam",
        note: `Get-rich-quick or scam pattern detected: "${scamMatch}"`,
        summary: "This post appears to be a scam or fraudulent offer.",
        isFlex: false,
        flexScore: 0,
      };
    }
  }

  // Also check scam patterns directly on original text
  if (/\b(dm|message|pm|whatsapp|telegram)\s*(me|us)\b.*\b(make|earn|get|win|claim|receive|money|cash|profit|rich)\b/i.test(caption) ||
      /\$\d{2,}.*\b(to|into|turn|make)\b.*\$?\d{3,}/i.test(caption) ||
      /\b(guaranteed|instant|overnight|while you sleep|passive income)\b/i.test(caption) ||
      /\b(crypto signal|trading signal|investment opportunity|forex|binary options|pyramid|mlm)\b/i.test(caption) ||
      /\b(send (me )?(your|my) (wallet|bank|payment|btc|bitcoin|eth|usdt|crypto))\b/i.test(caption) ||
      /\b(rugpull|airdrop claim|free mint|pre-sale|presale|ico)\b/i.test(caption) ||
      /\b(double your|multiply your|100x|10x your)\b/i.test(caption)) {
    return {
      approved: false,
      risk: 90,
      category: "scam",
      note: "Detected get-rich-quick or scam pattern",
      summary: "This post appears to be a scam or fraudulent offer.",
      isFlex: false,
      flexScore: 0,
    };
  }

  // ── Check spam ──
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(caption)) {
      return {
        approved: false,
        risk: 70,
        category: "spam",
        note: "Spam pattern detected",
        summary: "This post appears to be spam.",
        isFlex: false,
        flexScore: 0,
      };
    }
  }

  // ── Flex detection ──
  let flexMatches = 0;
  for (const pattern of FLEX_INDICATORS) {
    if (pattern.test(normalized) || pattern.test(caption)) flexMatches++;
  }

  let offTopicMatches = 0;
  for (const pattern of OFF_TOPIC_INDICATORS) {
    if (pattern.test(normalized) || pattern.test(caption)) offTopicMatches++;
  }

  let flexScore = 30;
  flexScore += flexMatches * 15;
  flexScore -= offTopicMatches * 20;

  const catFlex: Record<string, number> = {
    car: 15, earnings: 15, watch: 15, goal: 20, fitness: 15,
    business: 15, travel: 10, flex: 5,
  };
  flexScore += catFlex[category] || 0;

  if (caption.length > 50) flexScore += 5;
  if (caption.length > 150) flexScore += 5;

  flexScore = Math.max(0, Math.min(100, flexScore));
  const isFlex = flexScore >= 40 && offTopicMatches === 0;

  if (caption.length < 10) {
    return {
      ...SAFE,
      risk: 5,
      note: "Minimal content",
      summary: "Very short post, no policy violations.",
      isFlex: false,
      flexScore: 15,
    };
  }

  if (!isFlex && offTopicMatches > 0) {
    return {
      approved: true,
      risk: 5,
      category: "off-topic",
      note: "This doesn't appear to be a flex or goal post",
      summary: "Post is safe but doesn't look like a flex or goal.",
      isFlex: false,
      flexScore,
    };
  }

  return {
    approved: true,
    risk: 0,
    category: "safe",
    note: flexMatches > 0 ? "Legitimate flex content" : "No issues detected",
    summary: isFlex
      ? flexScore >= 70 ? "Great flex! Keep grinding. 🔥" : "Post is safe and appears to be a flex."
      : "Post is safe.",
    isFlex,
    flexScore,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 8. IMAGE MODERATION — basic checks
// ═════════════════════════════════════════════════════════════════════════

export interface ImageModerationResult {
  approved: boolean;
  reason: string;
}

/**
 * Basic image moderation — checks file type, size, and dimensions.
 * Full NSFW image detection requires an AI API which isn't available on Vercel.
 * The upload endpoint validates files before this is called.
 */
export function moderateImage(
  fileName: string,
  fileSize: number,
  mimeType: string
): ImageModerationResult {
  // Check file type
  if (!mimeType.startsWith("image/")) {
    return { approved: false, reason: "Only image files are allowed." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(mimeType)) {
    return { approved: false, reason: `File type ${mimeType} is not allowed.` };
  }

  // Check file size (max 6MB)
  if (fileSize > 4 * 1024 * 1024) {
    return { approved: false, reason: "Image must be under 4MB." };
  }

  // Check for suspicious file names
  const suspiciousNames = ["nsfw", "nude", "xxx", "porn", "sex", "adult", "explicit"];
  const lowerName = fileName.toLowerCase();
  for (const susp of suspiciousNames) {
    if (lowerName.includes(susp)) {
      return { approved: false, reason: `File name contains flagged word: "${susp}".` };
    }
  }

  return { approved: true, reason: "Image passed basic checks." };
}

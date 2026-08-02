export interface ModerationResult {
  approved: boolean;
  risk: number; // 0-100
  category: string;
  note: string;
  summary: string;
  isFlex: boolean;
  flexScore: number; // 0-100
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

// ── Scam/spam patterns ───────────────────────────────────────────────────
const SCAM_PATTERNS = [
  /\b(dm me|message me|pm me|whatsapp|telegram)\b.*\b(make|earn|get|win|claim|receive)\b/i,
  /\b\$?\d{2,}.*\b(to|into|turn|make|earn)\b.*\$?\d{3,}/i,
  /\b(guaranteed|instant|overnight|while you sleep|passive income)\b/i,
  /\b(crypto signal|trading signal|investment opportunity|forex|binary options|pyramid|mlm|network marketing)\b/i,
  /\b(send (me )?(your|my) (wallet|bank|payment|btc|bitcoin|eth|usdt|crypto))\b/i,
  /\b(rugpull|rug pull|airdrop claim|free mint|pre-sale|presale|ico)\b/i,
  /\b(double your|multiply your|x10|x100|100x|10x your)\b/i,
  /\b(cash app|venmo|paypal|zelle)\s*\$?\d/i,
  /\b(loan|credit repair|debt relief)\b.*\b(guaranteed|instant|no check)\b/i,
  /\b(work from home|data entry|paid survey)\b.*\b(\$\d{2,}|per day|per week|per hour)\b/i,
  /\b(click (the )?link|bio link|link in bio|visit|go to)\b.*\b(sign up|register|join|claim)\b/i,
  /\b(free|bonus|reward|prize|giveaway)\b.*\b(click|link|claim|enter|join)\b/i,
  /\b(referral|affiliate|promote|earn \$)\b/i,
];

// ── NSFW/explicit patterns ───────────────────────────────────────────────
const NSFW_PATTERNS = [
  /\b(nude|nudes|naked|nsfw|porn|porno|xxx|sex|sexual|horny|aroused)\b/i,
  /\b(onlyfans|only fans|of account|premium content|adult content)\b/i,
  /\b(tits|boobs|ass|dick|cock|pussy|cum|ejaculat|orgasm)\b/i,
  /\b(hookup|hook up|fuck buddy|nudes for|send nudes|trade pics)\b/i,
  /\b(slut|whore|bitch|escort|sugar daddy|sugar baby)\b/i,
  /\b(pornhub|redtube|xvideos|cam girl|camgirl|stripper)\b/i,
];

// ── Hate/harassment patterns ─────────────────────────────────────────────
const HATE_PATTERNS = [
  /\b(kill (all|the)|exterminate|genocide|ethnic cleansing)\b/i,
  /\b(racist slur|subhuman|inferior race|master race|white power|nazi|neo-nazi)\b/i,
  /\b(terrorist|bomb (making|instructions)|jihad (against|on))\b/i,
  /\b(go (back to your|die|kill yourself|end yourself))\b/i,
  /\b(you (are|re) (worthless|useless|trash|garbage|pathetic|disgusting))\b/i,
  /\b(doxx|dox|leak (your|their) (address|phone|info|ip))\b/i,
  /\b(rape|molest|assault)\b/i,
];

// ── Illegal patterns ─────────────────────────────────────────────────────
const ILLEGAL_PATTERNS = [
  /\b(buy|sell|selling|get|score)\s*(drugs|cocaine|weed|heroin|meth|pills|xanax|adderall|oxycodone|crack|mdma|lsd)\b/i,
  /\b(drugs|cocaine|weed|heroin|meth|pills|xanax|adderall|oxycodone|crack)\b.*\b(dm|message|hit me up|hit me|for sale|selling|cheap)\b/i,
  /\b(stolen (accounts|credit card|carding|fullz|dumps|cvv))\b/i,
  /\b(hack (for hire|service|account|instagram|facebook|snapchat))\b/i,
  /\b(carding|fullz|dumps|cvv dump|credit card (dump|numbers|info))\b/i,
  /\b(counterfeit|fake (id|passport|license|money|bills|currency))\b/i,
  /\b(money launder|wire fraud|tax fraud|insurance fraud)\b/i,
  /\b(hitman|contract kill|murder for hire)\b/i,
  /\b(how to (make|build|create) (a bomb|explosive|weapon|gun))\b/i,
  /\b(weapons?|firearms?|guns?)\s*(for sale|for cheap|dm me|cheap|wholesale)\b/i,
  /\b(prescription|meds|pharmacy)\b.*\b(for sale|cheap|no rx|without prescription|dm)\b/i,
];

// ── Spam patterns ────────────────────────────────────────────────────────
const SPAM_PATTERNS = [
  /(.)\1{10,}/, // Repeated characters (aaaaaaaaaaa)
  /(http|https|www\.|\.com|\.net|\.org|\.io)\b.*\b(http|https|www\.|\.com|\.net|\.org|\.io)\b/i, // Multiple links
  /\b(follow (me|for|back|4 follow)|like (for|4) (follow|like)|sub (for|4) sub)\b/i,
  /\b(check (out|my) (profile|page|channel|account|link))\b.*\b(follow|subscribe|like)\b/i,
];

// ── Flex/goal indicators (positive signals) ──────────────────────────────
const FLEX_INDICATORS = [
  /\b(bought|buying|purchased|just got|new (car|watch|house|home|apartment|bike|motorcycle|boat))\b/i,
  /\b(lamborghini|ferrari|porsche|mercedes|bmw|audi|tesla|rolls royce|bentley|mclaren|bugatti)\b/i,
  /\b(rolex|omega|patek|audemars|ap|cartier|hublot|richard mille)\b/i,
  /\b(\$\d{2,}|€\d{2,}|£\d{2,}|earned|revenue|profit|mrr|arr|income|salary|bonus|commission)\b/i,
  /\b(youtube (earnings|subscribers|views)|tiktok|instagram followers|stream)\b/i,
  /\b(marathon|pr|personal record|bench (press)?|squat|deadlift|weight (loss|lifting)|gym|fitness)\b/i,
  /\b(goal|milestone|achievement|accomplished|hit|reached|cracked|broke)\b/i,
  /\b(business|startup|saas|funded|raised|exit|acquired|launched|shipped)\b/i,
  /\b(travel|trip|vacation|holiday|destination|country|city|flight|hotel|resort)\b/i,
  /\b(graduated|degree|certification|passed|licensed|certified)\b/i,
  /\b(first|new|dream)\b.*\b(car|house|home|job|business|client|sale|customer)\b/i,
  /\b(locked in|grind|hustle|putting in (the )?work|dedication|discipline|consistency)\b/i,
  /\b(quit (my )?job|retired|financial(ly)? free|freedom)\b/i,
  /\b(promotion|promoted|raise|new (role|position|title))\b/i,
  /🏆|🔥|🚀|💪|💰|🏎️|⌚|📈|✈️|🏖️|🎓/,
];

// ── Off-topic indicators (negative signals for flex) ─────────────────────
const OFF_TOPIC_INDICATORS = [
  /\b(what.* (everyone|you guys|y all|doing)|how is (everyone|your day))\b/i,
  /\b(what.* (your favorite|you think|opinion))\b/i,
  /\b(good morning|good night|happy (monday|tuesday|wednesday|friday|weekend))\b/i,
  /\b(anyone (else|know|have|want))\b/i,
  /^\b(hi|hello|hey|sup|yo|what.?s up)\b/i,
  /\b(bored|tired|sleepy|sad|depressed|lonely)\b/i,
];

/**
 * Built-in AI moderation engine — no external API needed.
 * Works everywhere: local dev, Vercel, any serverless platform.
 */
export async function moderateContent(
  caption: string,
  category: string
): Promise<ModerationResult> {
  if (!caption || caption.trim().length === 0) return SAFE;

  const text = caption.toLowerCase().trim();

  // 1. Check for scams
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
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
  }

  // 2. Check for NSFW
  for (const pattern of NSFW_PATTERNS) {
    if (pattern.test(text)) {
      return {
        approved: false,
        risk: 95,
        category: "explicit",
        note: "NSFW/explicit content detected",
        summary: "This post contains explicit or adult content.",
        isFlex: false,
        flexScore: 0,
      };
    }
  }

  // 3. Check for hate/harassment
  for (const pattern of HATE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        approved: false,
        risk: 100,
        category: "hate",
        note: "Hate speech or harassment detected",
        summary: "This post contains hate speech, threats, or harassment.",
        isFlex: false,
        flexScore: 0,
      };
    }
  }

  // 4. Check for illegal content
  for (const pattern of ILLEGAL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        approved: false,
        risk: 100,
        category: "illegal",
        note: "Illegal goods or services detected",
        summary: "This post promotes illegal goods or services.",
        isFlex: false,
        flexScore: 0,
      };
    }
  }

  // 5. Check for spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
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

  // 6. Flex detection — calculate a flex score
  let flexMatches = 0;
  for (const pattern of FLEX_INDICATORS) {
    if (pattern.test(text)) flexMatches++;
  }

  let offTopicMatches = 0;
  for (const pattern of OFF_TOPIC_INDICATORS) {
    if (pattern.test(text)) offTopicMatches++;
  }

  // Calculate flex score (0-100)
  let flexScore = 30; // baseline
  flexScore += flexMatches * 15; // each flex indicator adds 15
  flexScore -= offTopicMatches * 20; // each off-topic indicator subtracts 20

  // Category bonus
  const catFlex: Record<string, number> = {
    car: 15, earnings: 15, watch: 15, goal: 20, fitness: 15,
    business: 15, travel: 10, flex: 5,
  };
  flexScore += catFlex[category] || 0;

  // Length bonus (longer posts tend to be more detailed flexes)
  if (caption.length > 50) flexScore += 5;
  if (caption.length > 150) flexScore += 5;

  flexScore = Math.max(0, Math.min(100, flexScore));

  const isFlex = flexScore >= 40 && offTopicMatches === 0;

  // 7. Low risk for very short/empty content
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

  // 8. Return result
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
      ? flexScore >= 70
        ? "Great flex! Keep grinding. 🔥"
        : "Post is safe and appears to be a flex."
      : "Post is safe.",
    isFlex,
    flexScore,
  };
}

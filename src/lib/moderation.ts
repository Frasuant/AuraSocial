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

// Hardcoded z-ai API config
const ZAI_BASE_URL = "https://internal-api.z.ai/v1";
const ZAI_API_KEY = "Z.ai";
const ZAI_CHAT_ID = "chat-7e5ab694-8576-4a50-b658-5b4bc1c7802a";
const ZAI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNmRmYTU3OGMtMmJlMi00ZDNmLTlkNzMtMzA1MTA0MTdhMWE0IiwiY2hhdF9pZCI6ImNoYXQtN2U1YWI2OTQtODU3Ni00YTUwLWI2NTgtNWI0YmMxYzc4MDJhIiwicGxhdGZvcm0iOiJ6YWkifQ.r_ysyrQhuI3CrUc7aLM1gc4xPItX-Co_ib5Zged7MZM";
const ZAI_USER_ID = "6dfa578c-2be2-4d3f-9d73-30510417a1a4";

/**
 * Call the z-ai chat completions API directly via fetch.
 * This bypasses the z-ai-web-dev-sdk package entirely, avoiding
 * ESM/bundling issues on Vercel.
 */
async function callZaiAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `${ZAI_BASE_URL}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ZAI_API_KEY}`,
    "X-Z-AI-From": "Z",
    "X-Chat-Id": ZAI_CHAT_ID,
    "X-User-Id": ZAI_USER_ID,
    "X-Token": ZAI_TOKEN,
  };

  const body = JSON.stringify({
    messages: [
      { role: "assistant", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    thinking: { type: "disabled" },
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z-AI API failed (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * AI moderation: analyzes a post's caption for:
 * 1. Safety — scams, illegal, hate, harassment, explicit, spam, impersonation
 * 2. Relevance — is this actually a flex/goal post?
 */
export async function moderateContent(
  caption: string,
  category: string
): Promise<ModerationResult> {
  if (!caption || caption.trim().length === 0) return SAFE;

  const system = `You are "AuraGuard", the AI moderation engine for AuraMedia — a social network where members ONLY post GOALS and FLEXES (cars, watches, YouTube earnings, travel, fitness, business wins, milestones).

You have TWO jobs:

1. SAFETY CHECK: Is this post safe? Flag scams, illegal goods/services, hate speech, harassment, explicit/NSFW content, impersonation, spam, and "get rich quick" schemes.

2. FLEX DETECTION: Is this post actually a flex or goal? AuraMedia is NOT a general social network. Random thoughts, questions, or off-topic content should get a low flexScore. A real flex shows off an achievement, a milestone, a possession, earnings, or a goal.

Respond with STRICT JSON only:
{"approved": boolean, "risk": 0-100, "category": "safe"|"spam"|"scam"|"hate"|"harassment"|"illegal"|"explicit"|"impersonation"|"off-topic", "note": "short reason under 120 chars", "summary": "one sentence", "isFlex": boolean, "flexScore": 0-100}

Rules:
- A legit flex about a car, earnings, fitness PR, business milestone -> approved=true, isFlex=true, flexScore>=60
- "DM me to make $5000/day" -> approved=false, risk=90, category="scam"
- NSFW/sexual content -> approved=false, risk=95, category="explicit"
- "What's everyone doing today?" -> approved=true, isFlex=false, flexScore=10, category="off-topic"
- "Just bought my dream car" -> approved=true, isFlex=true, flexScore=85
- Hate/threats -> approved=false, risk=100`;

  const user = `Post category: ${category}\nPost caption:\n"""\n${caption.slice(0, 2000)}\n"""`;

  try {
    const raw = await callZaiAI(system, user);
    const json = extractJson(raw);
    if (!json) return SAFE;

    const approved = Boolean(json.approved);
    const risk = Math.max(0, Math.min(100, Number(json.risk) || 0));
    const result: ModerationResult = {
      approved,
      risk,
      category: String(json.category || "safe"),
      note: String(json.note || "").slice(0, 200),
      summary: String(json.summary || "").slice(0, 200),
      isFlex: json.isFlex !== undefined ? Boolean(json.isFlex) : true,
      flexScore: Math.max(0, Math.min(100, Number(json.flexScore) || 50)),
    };
    return result;
  } catch (err) {
    console.error("[moderation] error:", err);
    return { ...SAFE, summary: "Moderation error — allowed by default." };
  }
}

function extractJson(text: string): any | null {
  if (!text) return null;
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  try {
    return JSON.parse(t);
  } catch {
    const match = t.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

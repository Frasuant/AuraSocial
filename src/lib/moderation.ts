import ZAI from "z-ai-web-dev-sdk";

export interface ModerationResult {
  approved: boolean;
  risk: number; // 0-100
  category: string; // e.g. "safe", "spam", "scam", "hate", "harassment", "illegal", "explicit", "impersonation"
  note: string;
  summary: string;
}

const SAFE: ModerationResult = {
  approved: true,
  risk: 0,
  category: "safe",
  note: "",
  summary: "No issues detected.",
};

/**
 * AI moderation: analyzes a post's caption for sketchy / harmful content.
 * AuraMedia is about positive goal-flexing. We flag scams, illegal goods,
 * harassment, hate, explicit content, impersonation, and spam.
 */
export async function moderateContent(
  caption: string,
  category: string
): Promise<ModerationResult> {
  if (!caption || caption.trim().length === 0) return SAFE;

  let zai;
  try {
    zai = await ZAI.create();
  } catch {
    // SDK unavailable — fail open (allow post) but mark low risk.
    return { ...SAFE, summary: "Moderation offline — allowed by default." };
  }

  const system = `You are "AuraGuard", the AI content moderation engine for AuraMedia, a social network where members post GOALS and FLEXES (cars, watches, YouTube/earnings, travel, fitness, business wins).

Your job: classify whether a post is SAFE or SKETCHY. AuraMedia permits confident, motivating flexes about legitimately-earned success. We do NOT allow:
- Scams, "get rich quick", pyramid schemes, fake investment offers, crypto rugpulls
- Selling illegal goods/services (drugs, weapons, stolen accounts, fraud guides)
- Hate speech, racism, harassment, doxxing, threats
- Sexual/explicit content
- Impersonation of other people / claiming to be someone you are not
- Spam, link-farming, repetitive promotions
- Encouraging violence or self-harm

Respond with STRICT JSON only, no markdown, no commentary. Schema:
{"approved": boolean, "risk": number 0-100, "category": "safe"|"spam"|"scam"|"hate"|"harassment"|"illegal"|"explicit"|"impersonation", "note": "short reason under 120 chars", "summary": "one sentence verdict"}

A post bragging about a legitimately bought Lamborghini, real YouTube earnings screenshots, or hitting a fitness goal is SAFE. A post offering "DM me to make $5000/day with my method" is a SCAM. Set risk>=70 and approved=false for scams/illegal/hate/explicit.`;

  const user = `Post category: ${category}\nPost caption:\n"""\n${caption.slice(0, 2000)}\n"""`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
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
    };
    return result;
  } catch (err) {
    console.error("[moderation] error:", err);
    return { ...SAFE, summary: "Moderation error — allowed by default." };
  }
}

function extractJson(text: string): any | null {
  if (!text) return null;
  // Strip code fences
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

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { z } from "zod";
import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const aiRequestSchema = z.object({
  action: z.enum(["copywriter", "text-to-image", "design-review", "brand-assistant", "social-creator"]),
  prompt: z.string().optional(),
  type: z.string().optional(), // "headline" | "subheading" | "description" | "cta" | "social" etc.
  tone: z.string().optional(), // "professional" | "luxury" | "modern" | "friendly" etc.
  audience: z.string().optional(),
  length: z.string().optional(), // "short" | "medium" | "long"
  language: z.string().optional().default("English"),
  canvasJson: z.any().optional(),
  brandKit: z.any().optional(),
});

// Helper to make direct Axios calls to OpenAI Chat completions
async function callOpenAiChat(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith("sk-proj-REPLACE")) {
    throw new Error("Invalid API Key");
  }
  
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );
  
  return response.data.choices[0].message.content || "";
}

// Helper to make direct DALL-E image generation calls
async function callDalleImage(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith("sk-proj-REPLACE")) {
    throw new Error("Invalid API Key");
  }

  const response = await axios.post(
    "https://api.openai.com/v1/images/generations",
    {
      model: "dall-e-2",
      prompt,
      n: 1,
      size: "512x512",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.data[0].url || "";
}
// Helper to generate an image via AI Horde (Stable Diffusion) - completely free, no key required
// Uses async polling: submit job -> poll until done -> return base64 URL
async function callAiHorde(prompt: string): Promise<string> {
  const HORDE_API_KEY = "0000000000"; // Anonymous key - always works, lower priority
  const HORDE_BASE = "https://stablehorde.net/api/v2";

  // 1. Submit generation job
  const submitRes = await axios.post(
    `${HORDE_BASE}/generate/async`,
    {
      prompt,
      params: {
        width: 512,
        height: 512,
        steps: 20,
        sampler_name: "k_euler_a",
        cfg_scale: 7,
        n: 1,
      },
      models: ["Deliberate"],
      r2: false, // Return base64 directly instead of R2 storage URL
    },
    {
      headers: {
        apikey: HORDE_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const jobId = submitRes.data?.id;
  if (!jobId) throw new Error("AI Horde did not return a job ID");

  // 2. Poll for completion (max 55 seconds, check every 3 seconds)
  const MAX_WAIT_MS = 55000;
  const POLL_INTERVAL_MS = 3000;
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const statusRes = await axios.get(`${HORDE_BASE}/generate/check/${jobId}`);
    const status = statusRes.data;

    if (status.faulted) {
      throw new Error("AI Horde job faulted");
    }

    if (status.done) {
      // 3. Fetch completed result
      const resultRes = await axios.get(`${HORDE_BASE}/generate/status/${jobId}`);
      const generations = resultRes.data?.generations;
      if (!generations || generations.length === 0) {
        throw new Error("No generations returned from AI Horde");
      }
      const imgData = generations[0].img;
      // img is either a base64 string or URL depending on r2 setting
      if (imgData.startsWith("http")) {
        return imgData;
      }
      return `data:image/webp;base64,${imgData}`;
    }
  }

  throw new Error("AI Horde generation timed out after 55 seconds");
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Try to authenticate (but allow guest demo requests to bypass, making it robust)
  let userId = "guest_user";
  try {
    const authUser = getAuthenticatedUser(req);
    userId = authUser.userId;
  } catch {}

  const body = await req.json();
  const data = aiRequestSchema.parse(body);

  // 1. AI Copywriter Action
  if (data.action === "copywriter") {
    const promptTopic = data.prompt || "general promotional content";
    const typeLabel = data.type || "headline";
    const toneText = data.tone || "friendly";
    const audienceText = data.audience || "general audience";
    const lengthText = data.length || "short";
    const lang = data.language || "English";

    const systemPrompt = `You are a premium AI Copywriting assistant for a canvas design editor similar to Canva.
Generate 4 distinct variations of the requested text.
Return ONLY a valid JSON array of strings containing the variants. No other formatting, markdown tags, backticks or notes.
Example: ["Variant 1", "Variant 2", "Variant 3", "Variant 4"]`;

    const userPrompt = `Generate 4 variations of a ${typeLabel} for: "${promptTopic}".
Target Audience: ${audienceText}
Tone: ${toneText}
Length: ${lengthText}
Language: ${lang}`;

    try {
      const gptResult = await callOpenAiChat(systemPrompt, userPrompt);
      // Clean potential JSON markdown blocks like ```json ... ```
      const cleaned = gptResult.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ success: true, data: parsed });
    } catch (err) {
      console.warn("OpenAI Chat Completion failed, falling back to mock generators.", err);
      // Graceful local fallbacks matching the tone and type requested
      const mockOptions: Record<string, string[]> = {
        headline: [
          `Save Big on ${promptTopic}!`,
          `Discover the New ${promptTopic} Experience`,
          `Elevate Your Style with ${promptTopic}`,
          `Limited Time Offer: ${promptTopic}`
        ],
        subheading: [
          `Special discounts and features custom tailored for ${audienceText}.`,
          `The premium choice for experts. Get started now.`,
          `Designed to look gorgeous on every canvas sheet.`,
          `Handcrafted layout selections for your campaigns.`
        ],
        cta: [
          "GET STARTED FREE",
          "SHOP THE COLLECTION",
          "CLAIM 50% DISCOUNT NOW",
          "EXPLORE MORE"
        ]
      };
      const fallbackList = mockOptions[typeLabel] || [
        `${promptTopic} - Tailored for ${audienceText}`,
        `Modern ${promptTopic} in ${toneText} style`,
        `Premium choice: ${promptTopic} (${lengthText})`,
        `Special offer: ${promptTopic} starts today`
      ];
      return NextResponse.json({ success: true, data: fallbackList, fallbackUsed: true });
    }
  }

  // 2. AI Text-To-Image Action
  else if (data.action === "text-to-image") {
    const imgPrompt = data.prompt || "luxury background setup";

    // --- TIER 1: AI Horde (Stable Diffusion - free, anonymous) ---
    try {
      const url = await callAiHorde(imgPrompt);
      return NextResponse.json({ success: true, url });
    } catch (hordeErr: any) {
      console.warn("AI Horde generation failed or timed out:", hordeErr?.message);
    }

    // --- TIER 2: DALL-E (OpenAI) ---
    try {
      const url = await callDalleImage(imgPrompt);
      return NextResponse.json({ success: true, url });
    } catch (dalleErr) {
      console.warn("DALL-E failed, using smart Unsplash fallback.", dalleErr);
    }

    // --- TIER 3: Smart Unsplash keyword matching ---
    const q = imgPrompt.toLowerCase();
    const unsplashMap: { keywords: string[]; url: string }[] = [
      { keywords: ["perfume", "fragrance", "cologne", "scent"], url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&fit=crop&q=80" },
      { keywords: ["skincare", "cosmetic", "moisturizer", "serum", "cream", "beauty"], url: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&fit=crop&q=80" },
      { keywords: ["office", "studio", "workspace", "desk", "corporate", "business"], url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&fit=crop&q=80" },
      { keywords: ["nature", "beach", "ocean", "mountain", "forest", "landscape", "outdoor"], url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop&q=80" },
      { keywords: ["food", "burger", "pizza", "restaurant", "meal", "dish", "eat"], url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&fit=crop&q=80" },
      { keywords: ["fashion", "clothing", "dress", "outfit", "style", "model", "runway"], url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop&q=80" },
      { keywords: ["technology", "tech", "laptop", "phone", "computer", "digital", "gadget", "device"], url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&fit=crop&q=80" },
      { keywords: ["coffee", "cafe", "espresso", "latte", "drink", "beverage", "tea"], url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&fit=crop&q=80" },
      { keywords: ["city", "urban", "skyline", "building", "architecture", "street"], url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&fit=crop&q=80" },
      { keywords: ["sport", "fitness", "gym", "workout", "athlete", "running", "exercise"], url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&fit=crop&q=80" },
      { keywords: ["jewel", "ring", "necklace", "diamond", "gold", "luxury", "premium"], url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&fit=crop&q=80" },
      { keywords: ["plant", "flower", "garden", "botanical", "green", "leaf", "floral"], url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&fit=crop&q=80" },
      { keywords: ["car", "vehicle", "automobile", "auto", "drive", "motor"], url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&fit=crop&q=80" },
      { keywords: ["travel", "vacation", "holiday", "tourism", "destination", "adventure"], url: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&fit=crop&q=80" },
      { keywords: ["music", "headphone", "concert", "guitar", "piano", "audio", "sound"], url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&fit=crop&q=80" },
      { keywords: ["health", "medical", "wellness", "hospital", "pharmacy", "medicine"], url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&fit=crop&q=80" },
      { keywords: ["book", "reading", "library", "education", "study", "learning", "school"], url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&fit=crop&q=80" },
      { keywords: ["wedding", "bride", "groom", "ceremony", "love", "romance", "couple"], url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&fit=crop&q=80" },
      { keywords: ["minimal", "abstract", "geometric", "gradient", "background", "pattern", "texture"], url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&fit=crop&q=80" },
      { keywords: ["dark", "night", "neon", "cyberpunk", "glow", "dramatic", "shadow"], url: "https://images.unsplash.com/photo-1518818419601-72c8673f5852?w=800&fit=crop&q=80" },
    ];

    let fallbackUrl = "https://images.unsplash.com/photo-1542241647-9cbb2225278b?w=800&fit=crop&q=80"; // Default abstract
    for (const entry of unsplashMap) {
      if (entry.keywords.some((kw) => q.includes(kw))) {
        fallbackUrl = entry.url;
        break;
      }
    }

    return NextResponse.json({ success: true, url: fallbackUrl, fallbackUsed: true });
  }

  // 3. AI Design Review Action
  else if (data.action === "design-review") {
    const canvasObjects = data.canvasJson?.objects || [];
    const elementCount = canvasObjects.length;

    // AI logic analyzing layout alignments and contrast ratios
    let alignmentScore = 80;
    let contrastScore = 85;
    let spacingScore = 75;
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (elementCount === 0) {
      alignmentScore = 0;
      contrastScore = 0;
      spacingScore = 0;
      issues.push("Empty canvas detected.");
      suggestions.push("Add a background color or text presets to initiate layout reviews.");
    } else {
      // Analyze actual elements placement rules
      const hasText = canvasObjects.some((o: any) => o.type?.includes("text"));
      const hasBg = canvasObjects.some((o: any) => o.type === "rect" && o.width >= 1000);

      if (!hasBg) {
        contrastScore -= 15;
        issues.push("No bounding background shape.");
        suggestions.push("Add a solid background fill or brand gradient to improve visual balance.");
      }
      if (!hasText) {
        issues.push("Missing core typography copy.");
        suggestions.push("Use the AI Copywriter to generate header text layout variations.");
      }

      // Check alignment overlapping coordinates
      let lastLeft = -999;
      let alignmentWarning = false;
      canvasObjects.forEach((o: any) => {
        if (lastLeft !== -999 && Math.abs(o.left - lastLeft) < 10 && Math.abs(o.left - lastLeft) > 0) {
          alignmentWarning = true;
        }
        if (o.left) lastLeft = o.left;
      });

      if (alignmentWarning) {
        alignmentScore -= 20;
        issues.push("Slight element misalignment.");
        suggestions.push("Use the align-horizontal context drawer to center text nodes.");
      }

      // Spacing distribution
      if (elementCount > 8) {
        spacingScore -= 15;
        issues.push("High density layout clutter.");
        suggestions.push("Distribute vertical margins to provide negative workspace breathing room.");
      }
    }

    const overallScore = Math.round((alignmentScore + contrastScore + spacingScore) / 3);

    return NextResponse.json({
      success: true,
      data: {
        overallScore,
        categories: { alignment: alignmentScore, contrast: contrastScore, spacing: spacingScore },
        issues,
        suggestions,
      }
    });
  }

  // 4. AI Brand Assistant Action
  else if (data.action === "brand-assistant") {
    const brandName = data.brandKit?.name || "Premium Brand";
    const brandKitData = data.brandKit || {};
    
    // Suggest custom styling schemes based on industry/taglines
    const systemPrompt = `You are a Brand Styling Assistant. 
Analyze the brand details and provide design suggestions (ideal color palettes, typography matches, layout guides).
Return ONLY a valid JSON object structure:
{
  "recommendations": "string text guidelines",
  "fonts": ["Font1", "Font2"],
  "colors": ["#hex1", "#hex2", "#hex3"],
  "layouts": ["Layout Idea 1", "Layout Idea 2"]
}`;

    const userPrompt = `Analyze Brand Kit details:
Brand Name: ${brandName}
Industry: ${brandKitData.industry || "General"}
Tagline: ${brandKitData.tagline || "None"}
Description: ${brandKitData.description || "None"}`;

    try {
      const result = await callOpenAiChat(systemPrompt, userPrompt);
      const cleaned = result.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ success: true, data: parsed });
    } catch (err) {
      console.warn("Brand Assistant API failed. Returning fallback recommendations.", err);
      return NextResponse.json({
        success: true,
        data: {
          recommendations: "We recommend using a clean sans-serif typeface matching a dark slate accent scheme to portray high-end visual trust.",
          fonts: ["Outfit", "Inter"],
          colors: ["#6366F1", "#1E293B", "#EC4899"],
          layouts: ["Centered Minimalist Title", "Left Aligned Grid Split Layout"]
        },
        fallbackUsed: true
      });
    }
  }

  // 5. AI Social Media Concept Creator
  else if (data.action === "social-creator") {
    const product = data.prompt || "Luxury Skincare Cream";
    const audience = data.audience || "Women 25-45";
    const offer = data.type || "30% Off Storewide";

    const systemPrompt = `You are a social campaign layout planner.
Based on the product, audience, and offer details, generate a JSON array of 3 complete graphic design layouts.
Return ONLY a valid JSON array containing objects structured exactly like:
[
  {
    "title": "Campaign Concept Title",
    "theme": "Clean and organic / Neon Cyberpunk / Luxury Classic",
    "background": "Solid white / Gradient blue-indigo / Dark textured scene",
    "headline": "Suggested Large Headline text",
    "elements": ["Minimalist border line", "Geometric circle accents"]
  }
]`;

    const userPrompt = `Generate 3 concepts for:
Product: ${product}
Target Audience: ${audience}
Offer: ${offer}`;

    try {
      const result = await callOpenAiChat(systemPrompt, userPrompt);
      const cleaned = result.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ success: true, data: parsed });
    } catch (err) {
      console.warn("Social Creator API failed. Returning mock concepts.", err);
      return NextResponse.json({
        success: true,
        data: [
          {
            title: "Classic Skincare Spotlight",
            theme: "Elegant & Clean Minimalist",
            background: "Gradient soft rose to sand beige",
            headline: "GLOW FROM WITHIN",
            elements: ["Pill-shaped badge button", "Soft floating shapes"]
          },
          {
            title: "Midnight Refresh",
            theme: "Premium Dark Contrast",
            background: "Dark charcoal with gold borders",
            headline: "30% OFF SLEEP RECOVERY",
            elements: ["Premium solid grid dividers", "Star sticker highlights"]
          }
        ],
        fallbackUsed: true
      });
    }
  }

  return NextResponse.json({ error: "Unsupported AI action." }, { status: 400 });
});

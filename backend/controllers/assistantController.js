const Listing = require("../models/Listing");
const Plan = require("../models/Plan");
const { ensureDefaultPlans } = require("../services/planService");

const OPENAI_MODEL = process.env.OPENAI_ASSISTANT_MODEL || "gpt-5.4-mini";

const cities = [
  "Colombo",
  "Kandy",
  "Galle",
  "Moratuwa",
  "Nugegoda",
  "Kelaniya",
  "Maharagama",
  "Dehiwala",
  "Battaramulla",
  "Nawala",
  "Malabe",
  "Homagama",
  "Peradeniya",
  "Jaffna",
  "Matara",
  "Kurunegala",
  "Anuradhapura",
];

const defaultMemory = {
  city: "",
  university: "",
  maxBudget: "",
  genderPreference: "",
  propertyType: "",
};

function formatPrice(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `LKR ${amount.toLocaleString()}`;
}

function parseBudget(text) {
  const match =
    text.match(
      /(?:under|below|less than|max|maximum|budget|around)\s*(?:rs\.?|lkr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|000)?/i
    ) || text.match(/(?:rs\.?|lkr)?\s*([0-9]+(?:\.[0-9]+)?)\s*k\b/i);

  if (!match) return "";
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return "";
  return Math.round(match[2] === "k" || numeric < 1000 ? numeric * 1000 : numeric);
}

function parseLocation(text) {
  const city = cities.find((item) => new RegExp(`\\b${item}\\b`, "i").test(text));
  if (city) return city;

  const match = text.match(
    /(?:near|around|in|at)\s+([a-zA-Z\s]+?)(?:\s+(?:under|below|less|for|only|with|and|or|hostel|boarding|room|apartment)|$)/i
  );

  return match?.[1]?.trim() || "";
}

function parseUniversity(text) {
  const match = text.match(/(?:university|uni|campus)\s+(?:of\s+)?([a-zA-Z\s]+)/i);
  if (!match) return "";
  return match[0].replace(/^(near|around|at|in)\s+/i, "").trim();
}

function parseGenderPreference(text) {
  if (/girls|female|women/i.test(text)) return "girls";
  if (/boys|male|men/i.test(text)) return "boys";
  if (/mixed|any gender|anyone/i.test(text)) return "mixed";
  return "";
}

function parsePropertyType(text) {
  if (/hostel/i.test(text)) return "Hostel";
  if (/boarding/i.test(text)) return "Boarding";
  if (/apartment/i.test(text)) return "Apartment";
  if (/annex/i.test(text)) return "Annex";
  if (/room/i.test(text)) return "Room";
  return "";
}

function parseIntent(message, memory = {}) {
  const text = String(message || "");
  const filters = {
    city: parseLocation(text),
    university: parseUniversity(text),
    maxBudget: parseBudget(text),
    genderPreference: parseGenderPreference(text),
    propertyType: parsePropertyType(text),
  };

  const wantsRecommendations = /recommend|suggest|match|preference/i.test(text);
  const wantsSearch =
    wantsRecommendations ||
    /find|show|search|boarding|hostel|listing|near|under|below|female|male|girls|boys|apartment|room/i.test(
      text
    );

  if (/forget|reset memory|clear memory|delete preferences/i.test(text)) {
    return { type: "forget", filters: {}, memoryUpdates: defaultMemory };
  }

  if (/remember|save my|my preference|i prefer|prefer/i.test(text)) {
    return { type: "remember", filters, memoryUpdates: filters };
  }

  if (wantsSearch) {
    return {
      type: wantsRecommendations ? "recommend" : "search",
      filters: {
        city: filters.city || memory.city,
        university: filters.university || memory.university,
        maxBudget: filters.maxBudget || memory.maxBudget,
        genderPreference: filters.genderPreference || memory.genderPreference,
        propertyType: filters.propertyType || memory.propertyType,
      },
      memoryUpdates: filters,
    };
  }

  if (/landlord|owner|list my property|post/i.test(text)) return { type: "owner" };
  if (/plan|premium|payment|price|subscription/i.test(text)) return { type: "plans" };
  if (/support|contact|help|issue|problem/i.test(text)) return { type: "support" };
  return { type: "general" };
}

function buildMemory(memory, updates) {
  const next = { ...defaultMemory, ...(memory || {}) };
  Object.entries(updates || {}).forEach(([key, value]) => {
    if (value) next[key] = value;
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

function getMemorySummary(memory) {
  const parts = [];
  if (memory.city) parts.push(`near ${memory.city}`);
  if (memory.university) parts.push(`around ${memory.university}`);
  if (memory.maxBudget) parts.push(`under ${formatPrice(memory.maxBudget)}`);
  if (memory.genderPreference === "girls") parts.push("girls only");
  if (memory.genderPreference === "boys") parts.push("boys only");
  if (memory.propertyType) parts.push(memory.propertyType);
  return parts.join(", ");
}

function createListingUrl(filters) {
  const params = new URLSearchParams();
  const query = filters.university || filters.city || "";
  if (query) params.set("q", query);
  if (filters.city) params.set("city", filters.city);
  if (filters.university) params.set("university", filters.university);
  if (filters.maxBudget) params.set("maxPrice", String(filters.maxBudget));
  if (filters.genderPreference) params.set("genderPreference", filters.genderPreference);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  const queryString = params.toString();
  return queryString ? `/listings?${queryString}` : "/listings";
}

function listingMatches(listing, filters) {
  const query = (filters.university || filters.city || "").toLowerCase();
  const searchable = [
    listing.propertyName,
    listing.propertyType,
    listing.description,
    listing.address,
    listing.city,
    listing.province,
    listing.nearestUniversity?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchesText =
    !query ||
    query
      .split(/\s+/)
      .filter(Boolean)
      .every((word) => searchable.includes(word));
  const rent = Number(listing.monthlyRent || 0);
  const matchesBudget = !filters.maxBudget || rent <= Number(filters.maxBudget);
  const matchesGender =
    !filters.genderPreference ||
    listing.genderPreference === filters.genderPreference ||
    listing.genderPreference === "mixed";
  const matchesType =
    !filters.propertyType ||
    String(listing.propertyType || "").toLowerCase() ===
      String(filters.propertyType).toLowerCase();

  return matchesText && matchesBudget && matchesGender && matchesType;
}

async function searchListings(filters) {
  const listings = await Listing.find({ isHeldForPayment: { $ne: true } })
    .populate("nearestUniversity", "name location")
    .populate({
      path: "landlord",
      select: "username email phoneNumber isFlagged",
      match: { isFlagged: { $ne: true } },
    })
    .sort({ eloRating: -1 })
    .limit(60);

  return listings
    .filter((listing) => listing.landlord)
    .filter((listing) => listingMatches(listing, filters))
    .sort((a, b) => Number(a.monthlyRent || 0) - Number(b.monthlyRent || 0))
    .slice(0, 3)
    .map((listing) => ({
      _id: listing._id,
      propertyName: listing.propertyName,
      propertyType: listing.propertyType,
      monthlyRent: listing.monthlyRent,
      city: listing.city,
      address: listing.address,
      images: listing.images,
      nearestUniversity: listing.nearestUniversity,
      genderPreference: listing.genderPreference,
    }));
}

async function getPlanSummary() {
  await ensureDefaultPlans();
  const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
  return plans.map((plan) => ({
    code: plan.code,
    name: plan.name,
    price: plan.price,
    durationDays: plan.durationDays,
    listingLimit: plan.listingLimit,
    features: plan.features,
  }));
}

async function askOpenAI({ message, intent, filters, listings, plans }) {
  if (!process.env.OPENAI_API_KEY || typeof fetch !== "function") return null;

  const responseSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: { type: "string" },
      actions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            href: { type: "string" },
            prompt: { type: "string" },
          },
          required: ["label"],
        },
      },
    },
    required: ["reply", "actions"],
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are LankaNest's first-party assistant. Answer briefly and help students find Sri Lankan boarding listings or landlords understand plans. Never claim a payment succeeded unless backend status says so. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            message,
            intent: intent.type,
            filters,
            listings,
            plans,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "lankanest_assistant_response",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      ?.find((item) => item.type === "output_text")?.text;

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

exports.chat = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const memory = { ...defaultMemory, ...(req.body?.memory || {}) };

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const intent = parseIntent(message, memory);

    if (intent.type === "forget") {
      return res.json({
        success: true,
        reply: "Done. I cleared your saved LankaNest preferences for this browser.",
        actions: [],
        listings: [],
        memory: defaultMemory,
      });
    }

    const nextMemory = buildMemory(memory, intent.memoryUpdates || {});
    let listings = [];
    let plans = [];
    let actions = [];
    let reply = "";

    if (intent.type === "search" || intent.type === "recommend") {
      listings = await searchListings(intent.filters || {});
      const href = createListingUrl(intent.filters || {});
      const summary = getMemorySummary({ ...defaultMemory, ...(intent.filters || {}) });
      actions = [{ label: "Open filtered listings", href }];
      if (summary) actions.push({ label: "Save preference", prompt: `Remember I prefer ${summary}` });
      reply = listings.length
        ? `I found ${listings.length} strong match${listings.length === 1 ? "" : "es"}${summary ? ` for ${summary}` : ""}.`
        : `I prepared a filtered listings view${summary ? ` for ${summary}` : ""}.`;
    } else if (intent.type === "remember") {
      const summary = getMemorySummary(nextMemory);
      reply = summary
        ? `Saved. I will remember that you prefer ${summary}.`
        : "Tell me a city, university, budget, gender preference, or property type and I will remember it.";
      actions = [{ label: "Use preferences", prompt: "Recommend based on my preferences" }];
    } else if (intent.type === "plans") {
      plans = await getPlanSummary();
      const premium = plans.find((plan) => plan.code === "premium");
      reply = premium
        ? `Premium is ${premium.price.currency} ${premium.price.amount.toLocaleString()} for ${premium.durationDays} days and unlocks unlimited active listings.`
        : "Landlords can manage plan upgrades from the pricing page.";
      actions = [{ label: "Open pricing", href: "/landlord/pricing" }];
    } else if (intent.type === "owner") {
      reply =
        "Landlords can sign in, add property details, upload photos, and manage student messages from the landlord dashboard.";
      actions = [{ label: "Owner sign in", href: "/auth/houseowner-signin" }];
    } else if (intent.type === "support") {
      reply = "For account, listing, booking, or payment help, contact LankaNest support with your role and issue details.";
      actions = [{ label: "Contact support", href: "/contact" }];
    } else {
      reply =
        "I can search by city, university, budget, gender preference, and property type. Try: Find me boarding near Colombo under 20k.";
      actions = [
        { label: "Find near Colombo", prompt: "Find me boarding near Colombo under 20k" },
        { label: "Show girls hostels", prompt: "Show only female hostels" },
      ];
    }

    const aiAnswer = await askOpenAI({
      message,
      intent,
      filters: intent.filters || {},
      listings,
      plans,
    }).catch(() => null);

    res.json({
      success: true,
      reply: aiAnswer?.reply || reply,
      actions: Array.isArray(aiAnswer?.actions) && aiAnswer.actions.length ? aiAnswer.actions : actions,
      listings,
      memory: nextMemory,
      source: aiAnswer ? "openai" : "deterministic",
    });
  } catch (error) {
    console.error("Assistant error:", error);
    res.status(500).json({
      success: false,
      reply: "I could not answer that right now. Please try again in a moment.",
      actions: [],
      listings: [],
    });
  }
};

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Check,
  ExternalLink,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RiMessage3Fill } from "react-icons/ri";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/services/http";

const MEMORY_KEY = "lankanest.ai.memory.v1";
const BACKEND_URL = API_BASE_URL;

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

const quickPrompts = [
  "Find me boarding near Colombo under 20k",
  "Show only female hostels",
  "Recommend based on my preferences",
  "Remember I prefer places under 25000 near Colombo",
];

const initialMessage = {
  role: "assistant",
  text:
    "Hi, I am LankaNest AI. Tell me your budget, city, university, gender preference, or property type and I will find a useful path for you.",
  actions: [{ label: "Browse listings", href: "/listings" }],
};

const defaultMemory = {
  city: "",
  university: "",
  maxBudget: "",
  genderPreference: "",
  propertyType: "",
  updatedAt: "",
};

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const formatPrice = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `LKR ${amount.toLocaleString()}`;
};

const readMemory = () => {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? { ...defaultMemory, ...JSON.parse(stored) } : defaultMemory;
  } catch {
    return defaultMemory;
  }
};

const writeMemory = (nextMemory) => {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(nextMemory));
};

const hasMemory = (memory) =>
  Boolean(
    memory.city ||
      memory.university ||
      memory.maxBudget ||
      memory.genderPreference ||
      memory.propertyType
  );

const getMemorySummary = (memory) => {
  const parts = [];
  if (memory.city) parts.push(`near ${memory.city}`);
  if (memory.university) parts.push(`around ${memory.university}`);
  if (memory.maxBudget) parts.push(`under ${formatPrice(memory.maxBudget)}`);
  if (memory.genderPreference === "girls") parts.push("girls only");
  if (memory.genderPreference === "boys") parts.push("boys only");
  if (memory.propertyType) parts.push(memory.propertyType);
  return parts.join(", ");
};

const parseBudget = (text) => {
  const budgetMatch = text.match(
    /(?:under|below|less than|max|maximum|budget|around)\s*(?:rs\.?|lkr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|000)?/i
  );

  const simpleKMatch = text.match(/(?:rs\.?|lkr)?\s*([0-9]+(?:\.[0-9]+)?)\s*k\b/i);
  const match = budgetMatch || simpleKMatch;
  if (!match) return "";

  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return "";

  return Math.round(match[2] === "k" || numeric < 1000 ? numeric * 1000 : numeric);
};

const parseLocation = (text) => {
  const city = cities.find((item) => new RegExp(`\\b${item}\\b`, "i").test(text));
  if (city) return city;

  const locationMatch = text.match(
    /(?:near|around|in|at)\s+([a-zA-Z\s]+?)(?:\s+(?:under|below|less|for|only|with|and|or|hostel|boarding|room|apartment)|$)/i
  );

  return locationMatch?.[1]?.trim() || "";
};

const parseUniversity = (text) => {
  const universityMatch = text.match(
    /((?:university|campus|sliit|nsbm)[a-zA-Z\s]*(?:colombo|moratuwa|kelaniya|peradeniya|jayewardenepura|sri lanka)?)/i
  );
  return universityMatch?.[1]?.trim() || "";
};

const parsePropertyType = (text) => {
  if (/apartment|flat/i.test(text)) return "Apartment";
  if (/shared|room/i.test(text)) return "Shared Room";
  if (/boarding|hostel|house|stay/i.test(text)) return "Boarding House";
  return "";
};

const parseGenderPreference = (text) => {
  if (/female|girls|girl|women|woman|ladies|lady/i.test(text)) return "girls";
  if (/male|boys|boy|men|man/i.test(text)) return "boys";
  return "";
};

const parseAssistantIntent = (text, memory) => {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const wantsForget = /forget|reset memory|clear memory|delete preferences/i.test(lower);
  const wantsRecommendation = /recommend|suggest|preference|preferences|match/i.test(lower);
  const wantsSearch =
    wantsRecommendation ||
    /find|show|search|boarding|hostel|listing|near|under|below|female|male|girls|boys/i.test(
      lower
    );

  const filters = {
    city: parseLocation(normalized),
    university: parseUniversity(normalized),
    maxBudget: parseBudget(normalized),
    genderPreference: parseGenderPreference(normalized),
    propertyType: parsePropertyType(normalized),
  };

  if (wantsRecommendation) {
    return {
      type: "recommend",
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

  if (wantsForget) {
    return { type: "forget", filters: {}, memoryUpdates: {} };
  }

  if (/remember|save my|my preference|i prefer|prefer/i.test(lower)) {
    return {
      type: "remember",
      filters,
      memoryUpdates: filters,
    };
  }

  if (wantsSearch) {
    return { type: "search", filters, memoryUpdates: filters };
  }

  if (/landlord|owner|list my property|post/i.test(lower)) {
    return { type: "owner", filters: {}, memoryUpdates: {} };
  }

  if (/support|contact|help|issue|problem/i.test(lower)) {
    return { type: "support", filters: {}, memoryUpdates: {} };
  }

  return { type: "general", filters: {}, memoryUpdates: {} };
};

const createListingUrl = (filters) => {
  const params = new URLSearchParams();
  const query = filters.university || filters.city || "";

  if (query) params.set("q", query);
  if (filters.city) params.set("city", filters.city);
  if (filters.university) params.set("university", filters.university);
  if (filters.maxBudget) params.set("maxPrice", String(filters.maxBudget));
  if (filters.genderPreference) {
    params.set("genderPreference", filters.genderPreference);
  }
  if (filters.propertyType) params.set("propertyType", filters.propertyType);

  const queryString = params.toString();
  return queryString ? `/listings?${queryString}` : "/listings";
};

const matchesText = (listing, query) => {
  if (!query) return true;
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

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => searchable.includes(word));
};

const filterListings = (listings, filters) => {
  const query = filters.university || filters.city || "";

  return listings
    .filter((listing) => {
      const rent = Number(listing.monthlyRent || 0);
      const matchesBudget = !filters.maxBudget || rent <= Number(filters.maxBudget);
      const matchesGender =
        !filters.genderPreference ||
        listing.genderPreference === filters.genderPreference ||
        listing.genderPreference === "mixed";
      const matchesType =
        !filters.propertyType ||
        String(listing.propertyType || "").toLowerCase() ===
          filters.propertyType.toLowerCase();

      return matchesText(listing, query) && matchesBudget && matchesGender && matchesType;
    })
    .sort((a, b) => {
      const aRent = Number(a.monthlyRent || 0);
      const bRent = Number(b.monthlyRent || 0);
      return aRent - bRent;
    })
    .slice(0, 3);
};

const requestBackendAi = async ({ text, memory, user }) => {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/api/assistant/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, memory, userId: user?._id || null }),
  });

  if (!response.ok) return null;
  return response.json();
};

const fetchListings = async () => {
  const response = await fetch(`${BACKEND_URL}/api/listings`);
  if (!response.ok) throw new Error("Failed to load listings");
  const data = await response.json();
  return Array.isArray(data) ? data : data?.data || [];
};

const buildMemory = (currentMemory, updates) => {
  const nextMemory = { ...currentMemory };

  Object.entries(updates).forEach(([key, value]) => {
    if (value) nextMemory[key] = value;
  });

  nextMemory.updatedAt = new Date().toISOString();
  return nextMemory;
};

const ListingPreview = ({ listing }) => (
  <Link
    to={`/listing/${listing._id}`}
    className="mt-3 block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200"
  >
    <div className="flex gap-3">
      <img
        src={listing.images?.[0] || "/placeholder.jpg"}
        alt={listing.propertyName || "Listing"}
        className="h-16 w-20 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">
          {listing.propertyName || "Student housing"}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {listing.city || listing.address || "Location unavailable"}
        </p>
        <p className="mt-1 text-xs font-semibold text-blue-700">
          {formatPrice(listing.monthlyRent) || "Price unavailable"}
        </p>
      </div>
    </div>
  </Link>
);

const ChatBubble = ({ title = "Smart LankaNest AI" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [memory, setMemory] = useState(readMemory);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const chatRef = useRef(null);
  const bubbleRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const autoSuggestedRef = useRef(false);

  const voiceSupported = useMemo(() => Boolean(getSpeechRecognition()), []);
  const memorySummary = getMemorySummary(memory);

  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/LKR/g, "rupees"));
      utterance.lang = "en-LK";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  const appendAssistantMessage = useCallback(
    (message) => {
      setMessages((prev) => [...prev, { role: "assistant", ...message }]);
      if (message.text) speak(message.text);
    },
    [speak]
  );

  const saveMemory = useCallback((nextMemory) => {
    setMemory(nextMemory);
    writeMemory(nextMemory);
  }, []);

  const runAssistant = useCallback(
    async (text, options = {}) => {
      const prompt = text.trim();
      if (!prompt || loading) return;

      if (!options.silentUser) {
        setMessages((prev) => [...prev, { role: "user", text: prompt }]);
      }

      setLoading(true);

      try {
        const backendAnswer = await requestBackendAi({ text: prompt, memory, user }).catch(
          () => null
        );

        if (backendAnswer?.reply) {
          const nextMemory = backendAnswer.memory
            ? { ...defaultMemory, ...memory, ...backendAnswer.memory }
            : memory;
          saveMemory(nextMemory);
          appendAssistantMessage({
            text: backendAnswer.reply,
            actions: backendAnswer.actions || [],
            listings: backendAnswer.listings || [],
          });
          return;
        }

        const intent = parseAssistantIntent(prompt, memory);

        if (intent.type === "forget") {
          saveMemory(defaultMemory);
          appendAssistantMessage({
            text: "Done. I cleared your saved LankaNest preferences on this browser.",
          });
          return;
        }

        const nextMemory = buildMemory(memory, intent.memoryUpdates || {});
        if (JSON.stringify(nextMemory) !== JSON.stringify(memory)) {
          saveMemory(nextMemory);
        }

        if (intent.type === "remember") {
          const summary = getMemorySummary(nextMemory);
          appendAssistantMessage({
            text: summary
              ? `Saved. I will remember that you prefer ${summary}.`
              : "Tell me a city, university, budget, gender preference, or property type and I will remember it.",
            actions: [{ label: "Use preferences", prompt: "Recommend based on my preferences" }],
          });
          return;
        }

        if (intent.type === "owner") {
          appendAssistantMessage({
            text:
              "Property owners can sign in, add property details, upload photos, and manage student messages from the landlord dashboard.",
            actions: [{ label: "Owner sign in", href: "/auth/houseowner-signin" }],
          });
          return;
        }

        if (intent.type === "support") {
          appendAssistantMessage({
            text:
              "For account, listing, or booking help, contact LankaNest support with your role and issue details.",
            actions: [{ label: "Contact support", href: "/contact" }],
          });
          return;
        }

        if (intent.type === "search" || intent.type === "recommend") {
          const filters = intent.filters || {};
          const href = createListingUrl(filters);
          let listings = [];

          try {
            listings = filterListings(await fetchListings(), filters);
          } catch {
            listings = [];
          }

          const activeSummary = getMemorySummary({ ...defaultMemory, ...filters });
          const recommendationIntro =
            intent.type === "recommend"
              ? activeSummary
                ? `Based on your saved preferences (${activeSummary}), I prepared matching listings.`
                : "I need a little more preference detail. Tell me your city, budget, gender preference, or property type."
              : activeSummary
              ? `I understood: ${activeSummary}.`
              : "I prepared the listings page for your search.";

          appendAssistantMessage({
            text:
              listings.length > 0
                ? `${recommendationIntro} Here are the best matches I can see right now.`
                : `${recommendationIntro} Open the filtered listings view to continue.`,
            actions: [
              { label: "Open filtered listings", href },
              { label: "Save as preference", prompt: `Remember I prefer ${activeSummary}` },
            ],
            listings,
          });
          return;
        }

        appendAssistantMessage({
          text:
            "I can search by city, university, budget, gender preference, and property type. Try: Find me boarding near Colombo under 20k.",
          actions: quickPrompts.map((prompt) => ({ label: prompt, prompt })),
        });
      } finally {
        setLoading(false);
      }
    },
    [appendAssistantMessage, loading, memory, saveMemory, user]
  );

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setHasNewMessage(true), 5000);
      return () => clearTimeout(timer);
    }

    setHasNewMessage(false);
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatRef.current &&
        !chatRef.current.contains(event.target) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(event.target) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const tooltipTimer = setTimeout(() => {
      if (!isOpen) setShowTooltip(true);
    }, 5000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 15000);

    return () => {
      clearTimeout(tooltipTimer);
      clearTimeout(hideTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setShowTooltip(false);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen || autoSuggestedRef.current || !hasMemory(memory)) return;

    autoSuggestedRef.current = true;
    const timer = setTimeout(() => {
      runAssistant("Recommend based on my preferences", { silentUser: true });
    }, 350);

    return () => clearTimeout(timer);
  }, [isOpen, memory, runAssistant]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setInput("");
    runAssistant(prompt);
  };

  const handleAction = (action) => {
    if (action.href) {
      setIsOpen(false);
      navigate(action.href);
      return;
    }

    if (action.prompt) {
      runAssistant(action.prompt);
    }
  };

  const toggleVoiceInput = () => {
    if (!voiceSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-LK";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      setInput(transcript);

      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.isFinal && transcript) {
        setInput("");
        runAssistant(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const resetMemory = () => {
    saveMemory(defaultMemory);
    appendAssistantMessage({
      text: "I cleared your saved preferences. You can teach me again anytime.",
    });
  };

  if (location.pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <>
      <motion.button
        type="button"
        ref={bubbleRef}
        onClick={() => setIsOpen((prev) => !prev)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primaryBgColor text-white shadow-xl transition hover:bg-blue-800 sm:bottom-6 sm:right-6"
        aria-label={isOpen ? "Close LankaNest AI" : "Open LankaNest AI"}
      >
        {hasNewMessage && !isOpen ? (
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-rose-500" />
        ) : null}
        {isOpen ? <X className="h-6 w-6" /> : <RiMessage3Fill className="text-2xl" />}
      </motion.button>

      <AnimatePresence>
        {showTooltip && !isOpen ? (
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.96 }}
            className="fixed bottom-24 right-5 z-40 hidden max-w-[245px] rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg sm:block sm:right-6"
          >
            Ask Smart LankaNest AI to find homes by budget, city, or preference.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(760px,80vh)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:right-6"
          >
            <div className="bg-primaryBgColor px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{title}</h3>
                    <p className="truncate text-xs text-blue-100">
                      Search, memory, recommendations, voice
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 transition hover:bg-white/15"
                  aria-label="Close assistant"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Saved preferences
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {memorySummary || "No preferences saved yet."}
                  </p>
                </div>
                {hasMemory(memory) ? (
                  <button
                    type="button"
                    onClick={resetMemory}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-rose-600"
                    aria-label="Clear preferences"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 shadow-sm ${
                      message.role === "user"
                        ? "bg-primaryBgColor text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <p>{message.text}</p>

                    {Array.isArray(message.listings) && message.listings.length > 0 ? (
                      <div>
                        {message.listings.map((listing) => (
                          <ListingPreview key={listing._id} listing={listing} />
                        ))}
                      </div>
                    ) : null}

                    {Array.isArray(message.actions) && message.actions.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => handleAction(action)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            {action.label}
                            {action.href ? <ExternalLink className="h-3.5 w-3.5" /> : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                    Thinking...
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => runAssistant(prompt)}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={!voiceSupported}
                  className={`flex min-h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition ${
                    listening
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-500 hover:text-blue-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                  title={voiceSupported ? "Voice input" : "Voice input not supported"}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={listening ? "Listening..." : "Ask LankaNest AI..."}
                  className="min-h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setVoiceEnabled((prev) => !prev)}
                  className={`flex min-h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition ${
                    voiceEnabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500 hover:text-blue-700"
                  }`}
                  aria-label={voiceEnabled ? "Disable spoken replies" : "Enable spoken replies"}
                >
                  {voiceEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primaryBgColor text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>First-party LankaNest AI. Search and AI run through LankaNest.</span>
                {hasMemory(memory) ? <Check className="ml-auto h-3.5 w-3.5 text-emerald-600" /> : null}
                {hasMemory(memory) ? <span className="text-emerald-700">Memory on</span> : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default ChatBubble;

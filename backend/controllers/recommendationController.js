const Listing = require("../models/Listing");

const RECOMMENDATION_API_URL =
  process.env.RECOMMENDATION_API_URL || "http://localhost:8000";

async function fallbackRecommendations(limit = 6) {
  const listings = await Listing.find({ isHeldForPayment: { $ne: true } })
    .populate("nearestUniversity", "name location")
    .populate({
      path: "landlord",
      select: "username email phoneNumber isFlagged",
      match: { isFlagged: { $ne: true } },
    })
    .sort({ eloRating: -1 })
    .limit(limit * 2);

  return listings
    .filter((listing) => listing.landlord)
    .slice(0, limit)
    .map((listing, index) => ({
      ...listing.toObject(),
      score: Math.max(0.6, 0.92 - index * 0.04),
      matchReasons: ["Popular with students", "Available on LankaNest"],
    }));
}

exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const url = `${RECOMMENDATION_API_URL.replace(
      /\/$/,
      ""
    )}/recommendations/${encodeURIComponent(userId)}`;

    if (typeof fetch === "function") {
      try {
        const response = await fetch(url, { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          return res.json({
            success: true,
            source: "recommendation-service",
            recommendations: Array.isArray(data) ? data : data?.listings || [],
          });
        }
      } catch (error) {
        console.warn("Recommendation service unavailable:", error.message);
      }
    }

    const recommendations = await fallbackRecommendations();
    res.json({ success: true, source: "fallback", recommendations });
  } catch (error) {
    console.error("Recommendation proxy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load recommendations",
    });
  }
};

exports.getDebugInfo = async (req, res) => {
  res.json({
    success: true,
    recommendationApiUrl: RECOMMENDATION_API_URL,
    proxiedThroughBackend: true,
  });
};

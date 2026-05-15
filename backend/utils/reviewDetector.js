// reviewDetector.js

require('dotenv').config();
const useHfInference = process.env.USE_HF === 'true';

// Common spam detection heuristics
const spamKeywords = ["scam", "fake", "fraud", "cheat", "spam", "illegal", "deceptive"];
// Regex pattern to detect URLs in text
const urlPattern = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

let hfClient;
if (useHfInference) {
  const { HfInference } = require("@huggingface/inference");
  hfClient = new HfInference(process.env.HF_ACCESS_TOKEN);
}

/**
 * Uses Hugging Face Inference to analyze the sentiment of the text.
 * @param {string} text - The review text.
 * @returns {Promise<string>} - Returns the sentiment as a string.
 */
const analyzeWithHF = async (text) => {
  try {
    const output = await hfClient.textClassification({
      model: "siebert/sentiment-roberta-large-english",
      inputs: text,
      provider: "hf-inference",
    });
    // Use the model's first prediction and default to 'neutral'
    const rawSentiment = output[0]?.label || 'neutral';
    return rawSentiment.toLowerCase();
  } catch (error) {
    console.error("Error with Hugging Face API:", error);
    throw new Error("Error analyzing sentiment with Hugging Face");
  }
};

let localModelAvailable = false;
let localPipeline = null;

async function loadLocalModel() {
  try {
    const { pipeline } = require('@xenova/transformers');
    console.log("Loading Xenova local sentiment model (may take a moment on first run)...");
    localPipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    console.log("Local model loaded successfully.");
    return true;
  } catch (error) {
    console.error("Failed to load local Xenova model:", error);
    return false;
  }
}

if (!useHfInference) {
  loadLocalModel().then(available => {
    localModelAvailable = available;
  });
}

const analyzeWithLocalModel = async (text) => {
  if (!localModelAvailable || !localPipeline) {
    // Return a fallback sentiment when local model isn't available
    console.log("Local model not available, using fallback sentiment analysis");
    const lowerText = text.toLowerCase();
    if (lowerText.includes('good') || lowerText.includes('great') || lowerText.includes('excellent')) {
      return 'positive';
    } else if (lowerText.includes('bad') || lowerText.includes('terrible') || lowerText.includes('awful')) {
      return 'negative';
    }
    return 'neutral';
  }
  
  try {
    const result = await localPipeline(text);
    // Xenova returns labels like 'POSITIVE' or 'NEGATIVE'
    const rawSentiment = result[0]?.label || 'neutral';
    return rawSentiment.toLowerCase();
  } catch (err) {
    console.error("Xenova classification error:", err);
    return 'neutral';
  }
};

/**
 * Analyzes review text to determine its sentiment and whether it should be flagged as spam.
 * Uses either Hugging Face inference or a local model based on configuration.
 * Applies additional heuristics (e.g., review length, presence of spam keywords, URLs).
 * @param {string} reviewText - The text of the review.
 * @returns {Promise<object>} - An object containing sentiment, isSpam flag, and spamReason.
 */
const getSentiment = async (reviewText) => {
  let sentiment = 'neutral';

  // Step 1: Analyze sentiment using the selected model
  try {
    if (useHfInference) {
      sentiment = await analyzeWithHF(reviewText);
    } else {
      sentiment = await analyzeWithLocalModel(reviewText);
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    sentiment = 'neutral';
  }

  // Step 2: Initialize spam detection flags and reasons
  let isSpam = false;
  let spamReason = "";

  // Heuristic 1: Review length check (flag extremely short reviews)
  if (reviewText.trim().length < 20) {
    isSpam = true;
    spamReason = "Review too short";
  }

  // Heuristic 2: Check for spam keywords
  const hasSpamKeywords = spamKeywords.some(word =>
    reviewText.toLowerCase().includes(word)
  );
  if (hasSpamKeywords) {
    isSpam = true;
    spamReason = spamReason
      ? spamReason + " & Contains spam keywords"
      : "Contains spam keywords";
  }

  // Heuristic 3: Check for URLs in the text
  const hasUrls = urlPattern.test(reviewText);
  if (hasUrls) {
    isSpam = true;
    spamReason = spamReason
      ? spamReason + " & Contains URL"
      : "Contains URL";
  }

  return { sentiment, isSpam, spamReason };
};

module.exports = { getSentiment };

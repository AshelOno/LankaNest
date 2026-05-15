from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List, Dict, Any, Optional
import uvicorn
from pydantic import BaseModel
import logging
from bson import ObjectId
import traceback
from fastapi.middleware.cors import CORSMiddleware
import random
import os
from dotenv import load_dotenv

# Load environment variables from backend
load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Property Recommendation API")
ENVIRONMENT = os.getenv("NODE_ENV") or os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ENVIRONMENT != "production" else [FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/lankanest")
mongo_db_name = os.getenv("MONGO_DB_NAME", "test")
client = MongoClient(mongo_uri)
db = client[mongo_db_name]

# Check available collections for debugging
collections = db.list_collection_names()
logger.info(f"Available collections: {collections}")


# Response models
class PropertyRecommendation(BaseModel):
    _id: str
    propertyName: str
    propertyType: str
    monthlyRent: float
    city: Optional[str] = None
    score: float
    images: Optional[List[str]] = None

    class Config:
        # Allow ObjectId to be processed
        arbitrary_types_allowed = True


class ErrorResponse(BaseModel):
    detail: str


# Function to handle ObjectId serialization
def serialize_document(doc):
    if isinstance(doc, dict):
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                doc[k] = str(v)
            elif isinstance(v, dict):
                doc[k] = serialize_document(v)
            elif isinstance(v, list):
                doc[k] = [
                    (
                        serialize_document(item)
                        if isinstance(item, dict)
                        else str(item) if isinstance(item, ObjectId) else item
                    )
                    for item in v
                ]
    return doc


@app.get("/health")
async def health():
    try:
        client.admin.command("ping")
        return {"status": "ok", "service": "lankanest-recommendation"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")


# Get raw listings without processing
@app.get("/debug/listings", include_in_schema=ENVIRONMENT != "production")
async def get_listings():
    if ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Not found")
    try:
        # Get first 5 listings for debugging
        listings = list(db.listings.find().limit(5))
        listings = [serialize_document(listing) for listing in listings]
        return {"listings": listings}
    except Exception as e:
        return {"error": str(e)}


# Get raw student profile without processing
@app.get("/debug/studentprofiles", include_in_schema=ENVIRONMENT != "production")
async def get_student_profiles():
    if ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Not found")
    try:
        # Look in both potential collections
        studentprofiles = (
            list(db.studentprofiles.find().limit(5))
            if "studentprofiles" in collections
            else []
        )
        student_profile = (
            list(db.studentProfile.find().limit(5))
            if "studentProfile" in collections
            else []
        )

        result = {
            "studentprofiles": [
                serialize_document(profile) for profile in studentprofiles
            ],
            "studentProfile": [
                serialize_document(profile) for profile in student_profile
            ],
            "collections": collections,
        }
        return result
    except Exception as e:
        return {"error": str(e)}


@app.get(
    "/recommendations/{student_id}",
    responses={500: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def get_recommendations(student_id: str):
    """
    Get personalized property recommendations for a student based on their preferences.

    The algorithm considers:
    - Property type match (exact/similar matching)
    - Price range compatibility
    - Preferred areas/locations
    - Gender preference matching
    - University proximity
    - Property features (bedrooms, bathrooms, etc.)
    - Property popularity (ELO rating)

    Returns exactly 6 listings, prioritizing perfect matches across all preferences.
    """
    logger.info(f"Getting recommendations for student ID: {student_id}")

    try:
        # Try to convert to ObjectId if possible
        try:
            obj_id = ObjectId(student_id)
            user_id_query = {"userId": obj_id}
            logger.info(f"Looking for student profile with userId: {obj_id}")
        except:
            user_id_query = {"userId": student_id}
            logger.info(
                f"Looking for student profile with userId (string): {student_id}"
            )

        # Find student profile
        student_profile = None
        collections_to_check = ["studentProfile", "studentprofiles"]

        for collection_name in collections_to_check:
            if collection_name in db.list_collection_names():
                logger.info(f"Checking collection: {collection_name}")
                student_profile = db[collection_name].find_one(user_id_query)
                if student_profile:
                    logger.info(f"Found student profile in {collection_name}")
                    break

        # Additional checks by _id if not found
        if not student_profile:
            try:
                for collection_name in collections_to_check:
                    if collection_name in db.list_collection_names():
                        logger.info(f"Checking collection {collection_name} by _id")
                        student_profile = db[collection_name].find_one(
                            {"_id": ObjectId(student_id)}
                        )
                        if student_profile:
                            logger.info(
                                f"Found student profile in {collection_name} by _id"
                            )
                            break
            except Exception as e:
                logger.error(f"Error looking up by _id: {e}")

        # Extract all user preferences
        if student_profile:
            logger.info(f"Processing preferences for student: {student_id}")

            # Extract core preferences with defaults
            preferred_property_type = student_profile.get("preferredPropertyType")
            price_range = student_profile.get("priceRange", {})
            preferred_areas = student_profile.get("preferredAreas", [])
            gender_pref = student_profile.get("genderPreference", "mixed")  # Student's gender preference for housing
            university = student_profile.get("university")  # University ID or name
            bookmarked_properties = student_profile.get("bookmarkedProperties", []) # IDs of bookmarked properties

            # Extract extended preferences if available
            try:
                min_bedrooms = float(student_profile.get("minBedrooms") or 1)
            except (ValueError, TypeError):
                min_bedrooms = 1
                
            try:
                min_bathrooms = float(student_profile.get("minBathrooms") or 1)
            except (ValueError, TypeError):
                min_bathrooms = 1

            min_price = (
                price_range.get("min", 0) if isinstance(price_range, dict) else 0
            )
            max_price = (
                price_range.get("max", 100000)
                if isinstance(price_range, dict)
                else 100000
            )

            logger.info(
                f"Using preferences: type={preferred_property_type}, "
                + f"price={min_price}-{max_price}, areas={preferred_areas}"
            )
        else:
            logger.warning(f"No student profile found for user ID: {student_id}")
            # Get top 6 popular listings as a fallback when no profile exists
            popular_listings = list(db.listings.find().sort("eloRating", -1).limit(6))

            if not popular_listings:
                return []

            result_listings = []
            for listing in popular_listings:
                listing = serialize_document(listing)
                # Set fallback scores - still provide some variation based on ELO
                elo = listing.get("eloRating", 0)
                listing["score"] = 0.5 + (
                    elo / 10000 * 0.3
                )  # Base 0.5 + up to 0.3 from ELO
                listing["matchReason"] = "Popular listing recommendation"
                result_listings.append(listing)

            # Cap at exactly 6 listings
            return result_listings[:6]

        # Get all listings
        all_listings = list(db.listings.find())
        logger.info(f"Found {len(all_listings)} total listings to evaluate")

        if not all_listings:
            logger.warning("No listings found in database")
            return []

        # Content-Based Filtering using Cosine Similarity on Bookmarks
        content_similarities = {}
        if bookmarked_properties and len(all_listings) > 0:
            try:
                df = pd.DataFrame(all_listings)
                features_df = pd.DataFrame()
                
                if "monthlyRent" in df.columns:
                    features_df["rent"] = pd.to_numeric(df["monthlyRent"], errors='coerce').fillna(df["monthlyRent"].median())
                    range_rent = features_df["rent"].max() - features_df["rent"].min()
                    features_df["rent"] = (features_df["rent"] - features_df["rent"].min()) / (range_rent if range_rent > 0 else 1)
                else:
                    features_df["rent"] = 0
                    
                if "bedrooms" in df.columns:
                    features_df["beds"] = pd.to_numeric(df["bedrooms"], errors='coerce').fillna(1)
                    max_beds = features_df["beds"].max()
                    features_df["beds"] = features_df["beds"] / (max_beds if max_beds > 0 else 1)
                else:
                    features_df["beds"] = 0
                    
                if "bathrooms" in df.columns:
                    features_df["baths"] = pd.to_numeric(df["bathrooms"], errors='coerce').fillna(1)
                    max_baths = features_df["baths"].max()
                    features_df["baths"] = features_df["baths"] / (max_baths if max_baths > 0 else 1)
                else:
                    features_df["baths"] = 0
                
                if "propertyType" in df.columns:
                    le = LabelEncoder()
                    features_df["type_encoded"] = le.fit_transform(df["propertyType"].astype(str).fillna("Unknown"))
                    max_type = features_df["type_encoded"].max()
                    features_df["type_encoded"] = features_df["type_encoded"] / (max_type if max_type > 0 else 1)
                else:
                    features_df["type_encoded"] = 0
                
                # NLP Text Feature Extraction using TF-IDF
                def get_text_features(row):
                    texts = [str(row.get('propertyName', ''))]
                    if 'description' in row and pd.notna(row['description']):
                        texts.append(str(row['description']))
                    if 'amenities' in row and isinstance(row['amenities'], list):
                        texts.extend([str(a) for a in row['amenities']])
                    return ' '.join(texts).lower()

                df['combined_text'] = df.apply(get_text_features, axis=1)
                
                # Convert text into numerical vectors
                tfidf = TfidfVectorizer(stop_words='english', max_features=500)
                tfidf_matrix = tfidf.fit_transform(df['combined_text']).toarray()
                
                bookmarked_ids_str = [str(bid) for bid in bookmarked_properties]
                df['_id_str'] = df['_id'].astype(str)
                bookmarked_indices = df[df['_id_str'].isin(bookmarked_ids_str)].index.tolist()
                
                if bookmarked_indices:
                    # Numeric Similarity
                    bookmarked_centroid = features_df.iloc[bookmarked_indices].mean(axis=0).values.reshape(1, -1)
                    numeric_similarities = cosine_similarity(features_df.values, bookmarked_centroid).flatten()
                    
                    # NLP Text Similarity
                    bookmarked_tfidf_centroid = tfidf_matrix[bookmarked_indices].mean(axis=0).reshape(1, -1)
                    text_similarities = cosine_similarity(tfidf_matrix, bookmarked_tfidf_centroid).flatten()
                    
                    for idx, listing_id in enumerate(df['_id_str']):
                        # Blended Similarity Score (40% numeric characteristics, 60% textual vibe)
                        content_similarities[listing_id] = float((numeric_similarities[idx] * 0.4) + (text_similarities[idx] * 0.6))
                        
                    logger.info(f"Calculated hybrid (NLP + Numeric) content similarity based on {len(bookmarked_indices)} bookmarks")
            except Exception as e:
                logger.error(f"Error calculating content similarity: {e}")

        # Process each listing with advanced scoring
        scored_listings = []
        for listing in all_listings:
            # Initialize score components - we'll calculate an advanced weighted score
            scores = {
                "property_type": 0,
                "price_match": 0,
                "location_match": 0,
                "gender_match": 0,
                "university_match": 0,
                "features_match": 0,
                "popularity": 0,
                "content_similarity": 0,
            }

            match_reasons = []

            # 1. Property Type Matching (Weight: 25%)
            if preferred_property_type:
                listing_type = listing.get("propertyType")
                if preferred_property_type.lower() == "any":
                    scores["property_type"] = 1.0  # Exact match for Any
                    if listing_type:
                        match_reasons.append(f"Property type: {listing_type}")
                elif listing_type and listing_type == preferred_property_type:
                    scores["property_type"] = 1.0  # Exact match
                    match_reasons.append(f"Perfect property type match: {listing_type}")
                elif listing_type:
                    # Partial string match gives partial score
                    if (
                        isinstance(listing_type, str)
                        and isinstance(preferred_property_type, str)
                        and (
                            listing_type.lower() in preferred_property_type.lower()
                            or preferred_property_type.lower() in listing_type.lower()
                        )
                    ):
                        scores["property_type"] = 0.7
                        match_reasons.append(f"Similar property type: {listing_type}")

            # 2. Price Range Matching (Weight: 20%)
            try:
                price = float(listing.get("monthlyRent") or 0)
            except (ValueError, TypeError):
                price = 0
                
            if min_price <= price <= max_price:
                # Perfect price match
                price_match_quality = 1.0
                match_reasons.append(f"Within your budget: LKR {price}")
            elif price < min_price:
                # Below budget (good thing)
                price_match_quality = 0.9
                match_reasons.append(f"Below your budget: LKR {price}")
            else:
                # Smooth exponential decay for overage
                overage = price - max_price
                # E.g., if 10% over budget, score drops to ~0.6. If 20% over, drops to ~0.36
                decay_factor = overage / (max_price * 0.2) if max_price > 0 else 1
                price_match_quality = max(0, float(np.exp(-decay_factor)))
                
                if price_match_quality > 0.5:
                    match_reasons.append(f"Slightly above budget: LKR {price}")

            scores["price_match"] = price_match_quality

            # 3. Location Matching (Weight: 20%)
            if preferred_areas:
                location_matched = False
                listing_city = str(listing.get("city") or "").lower()
                listing_address = str(listing.get("address") or "").lower()
                listing_province = str(listing.get("province") or "").lower()

                for area in preferred_areas:
                    area_lower = str(area).lower()
                    if (
                        area_lower in listing_city
                        or area_lower in listing_address
                        or area_lower in listing_province
                    ):
                        location_matched = True
                        scores["location_match"] = 1.0
                        match_reasons.append(f"Location match: {area}")
                        break

                if not location_matched:
                    # No direct match, but assign a modest score if listing has location info
                    if listing_city or listing_address:
                        scores["location_match"] = 0.3
            else:
                # No preferred areas specified, don't penalize
                scores["location_match"] = 0.7

            # 4. Gender Preference Matching (Weight: 15%)
            listing_gender_pref = str(listing.get("genderPreference") or "mixed").lower()
            gender_pref_lower = str(gender_pref or "mixed").lower()
            
            if gender_pref_lower == "mixed" or listing_gender_pref == "mixed":
                # If student accepts mixed or listing is mixed, it's a match
                scores["gender_match"] = 1.0
            elif gender_pref_lower == listing_gender_pref:
                # Exact match (e.g. boys == boys)
                scores["gender_match"] = 1.0
                match_reasons.append(f"{listing_gender_pref.capitalize()}-only accommodation")
            else:
                # Gender mismatch
                scores["gender_match"] = 0.0

            # 5. University Proximity (Weight: 10%)
            if university:
                listing_university = listing.get("nearestUniversity")
                try:
                    university_distance = float(listing.get("universityDistance") or 100)
                except (ValueError, TypeError):
                    university_distance = 100

                # Fetch university document to check aliases or name
                is_university_match = False
                if listing_university:
                    try:
                        uni_doc = db.universities.find_one({"_id": ObjectId(listing_university)}) if isinstance(listing_university, (str, ObjectId)) else None
                        if uni_doc:
                            uni_name = uni_doc.get("name", "").lower()
                            uni_aliases = [a.lower() for a in uni_doc.get("aliases", [])]
                            student_uni_lower = str(university).lower()
                            if student_uni_lower == uni_name or student_uni_lower in uni_aliases:
                                is_university_match = True
                    except:
                        pass

                if is_university_match:
                    scores["university_match"] = 1.0
                    match_reasons.append(
                        f"Near your university: {university_distance}km"
                    )
                elif university_distance < 3:
                    scores["university_match"] = 0.9
                    match_reasons.append(
                        f"Close to university: {university_distance}km"
                    )
                elif university_distance < 5:
                    scores["university_match"] = 0.8
                    match_reasons.append(f"Near university: {university_distance}km")
                elif university_distance < 10:
                    scores["university_match"] = 0.6
                else:
                    scores["university_match"] = 0.3
            else:
                # No university preference, don't penalize
                scores["university_match"] = 0.7

            # 6. Features Match (Weight: 5%)
            try:
                bedrooms = float(listing.get("bedrooms") or 0)
            except (ValueError, TypeError):
                bedrooms = 0
                
            try:
                bathrooms = float(listing.get("bathrooms") or 0)
            except (ValueError, TypeError):
                bathrooms = 0

            if bedrooms >= min_bedrooms and bathrooms >= min_bathrooms:
                scores["features_match"] = 1.0
                match_reasons.append(f"{bedrooms} bedrooms, {bathrooms} bathrooms")
            elif bedrooms >= min_bedrooms:
                scores["features_match"] = 0.7
                match_reasons.append(f"{bedrooms} bedrooms")
            elif bathrooms >= min_bathrooms:
                scores["features_match"] = 0.5
                match_reasons.append(f"{bathrooms} bathrooms")
            else:
                scores["features_match"] = 0.3

            # 7. Popularity/ELO Rating (Weight: 5%)
            elo_rating = listing.get("eloRating", 0)
            scores["popularity"] = min(elo_rating / 3000, 1.0)
            if scores["popularity"] > 0.8:
                match_reasons.append("Highly rated by other students")

            # 8. Content Similarity Score
            listing_id_str = str(listing.get("_id"))
            if content_similarities:
                scores["content_similarity"] = content_similarities.get(listing_id_str, 0)
                if scores["content_similarity"] > 0.85:
                    match_reasons.append("Highly matches your bookmarked vibes and features")
                
                # Upgraded weights: Content Similarity is now much more powerful due to NLP
                weights = {
                    "property_type": 0.15,
                    "price_match": 0.20,
                    "location_match": 0.15,
                    "gender_match": 0.15,
                    "content_similarity": 0.25, # Boosted from 0.15
                    "university_match": 0.05,
                    "features_match": 0.025,
                    "popularity": 0.025,
                }
            else:
                scores["content_similarity"] = 0
                weights = {
                    "property_type": 0.25,
                    "price_match": 0.20,
                    "location_match": 0.20,
                    "gender_match": 0.15,
                    "university_match": 0.10,
                    "features_match": 0.05,
                    "popularity": 0.05,
                    "content_similarity": 0,
                }

            final_score = sum(score * weights[key] for key, score in scores.items())

            # Add a tiny bit of randomness (±0.02) for variety while keeping good matches at top
            final_score += random.uniform(-0.02, 0.02)
            final_score = max(0, min(final_score, 1.0))  # Clamp between 0 and 1

            # Prepare listing for response
            listing_result = serialize_document(listing)
            listing_result["score"] = final_score

            # Only include top 3 match reasons to avoid clutter
            listing_result["matchReasons"] = (
                match_reasons[:3] if match_reasons else ["Recommended listing"]
            )

            # Debug scoring
            logger.debug(
                f"Listing {listing.get('propertyName')}: score={final_score}, components={scores}"
            )

            scored_listings.append(listing_result)

        # Sort by score (descending) and return the top 6
        sorted_listings = sorted(
            scored_listings, key=lambda x: x["score"], reverse=True
        )
        top_listings = sorted_listings[:6]

        logger.info(
            f"Returning {len(top_listings)} recommendations (from {len(scored_listings)} evaluated)"
        )
        return top_listings

    except Exception as e:
        # Log the full exception for debugging
        logger.error(f"Error generating recommendations: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500, detail=f"Error generating recommendations: {str(e)}"
        )


@app.get("/")
async def root():
    return {"message": "Property Recommendation API is running"}


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

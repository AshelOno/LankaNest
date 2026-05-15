/**
 * Calculates the initial ELO rating for a new listing based on its completeness
 * @param {Object} listingData - The listing data object
 * @returns {Number} - The calculated ELO rating
 */
const calculateInitialEloRating = (listingData) => {
    // Base ELO rating for all listings
    let initialEloRating = 1400;

    // Weight definitions for various fields
    const ratingRules = {
        description: 80,
        postalCode: 20,
        size: 50,
        bedrooms: 30,
        bathrooms: 30,
        garage: 20,
        builtYear: 20,
    };

    // Add points for each completed field based on the rating rules
    Object.keys(ratingRules).forEach((field) => {
        if (listingData[field] && listingData[field].toString().trim() !== "") {
            initialEloRating += ratingRules[field];
        }
    });

    return initialEloRating;
};

/**
 * Calculates the new ELO rating after a click event with weighted adjustments
 * @param {Number} currentElo - The current ELO rating of the listing
 * @param {Object} listingData - The listing data object
 * @returns {Number} - The new ELO rating after the click
 */
const calculateClickEloIncrease = (currentElo, listingData) => {
    // Base click weight
    let clickWeight = 2;
    
    // Adjust weight based on listing age (if available)
    if (listingData && listingData.createdAt) {
        const listingAge = Date.now() - new Date(listingData.createdAt).getTime();
        const daysSinceCreation = Math.floor(listingAge / (1000 * 60 * 60 * 24));
        
        // Newer listings get more weight (up to 50% bonus for listings < 7 days old)
        if (daysSinceCreation < 7) {
            clickWeight += (7 - daysSinceCreation) * 0.1; // 0.1 to 0.7 bonus
        }
    }
    
    // Adjust based on listing popularity (using current ELO as proxy)
    // Higher ELO listings get slightly less benefit to prevent monopolization
    if (currentElo > 1600) {
        const popularityFactor = Math.min((currentElo - 1600) / 200, 0.5); // Max 50% reduction
        clickWeight *= (1 - popularityFactor);
    }
    
    // Ensure minimum weight of 1
    clickWeight = Math.max(1, clickWeight);
    
    return currentElo + clickWeight;
};

module.exports = {
    calculateInitialEloRating,
    calculateClickEloIncrease
};

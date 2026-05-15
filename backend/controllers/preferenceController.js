const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// Save user preferences (university details)
exports.savePreferences = async (req, res) => {
    try {
        // Get userId from correct location (verifyToken middleware sets req.userId)
        const userId = req.userId || req.body.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required. Authentication may have failed.'
            });
        }

        const { 
            university, 
            preferredAreas, 
            priceRange, 
            preferredPropertyType,
            genderPreference
        } = req.body;

        // Validate required fields
        if (!university) {
            return res.status(400).json({
                success: false,
                message: 'University is required'
            });
        }

        let studentProfile = await StudentProfile.findOne({ userId });

        if (studentProfile) {
            // Update existing profile with all fields
            studentProfile.university = university;
            
            // Update optional fields if provided
            if (preferredAreas) studentProfile.preferredAreas = preferredAreas;
            if (priceRange) studentProfile.priceRange = priceRange;
            if (preferredPropertyType) studentProfile.preferredPropertyType = preferredPropertyType;
            if (genderPreference) studentProfile.genderPreference = genderPreference;
            
            await studentProfile.save();
        } else {
            // Create new profile with all provided fields
            const profileData = {
                userId,
                university,
                studentId: 'ST' + Date.now().toString().slice(-6) // Generate a temporary student ID
            };
            
            // Add optional fields if provided
            if (preferredAreas) profileData.preferredAreas = preferredAreas;
            if (priceRange) profileData.priceRange = priceRange;
            if (preferredPropertyType) profileData.preferredPropertyType = preferredPropertyType;
            if (genderPreference) profileData.genderPreference = genderPreference;
            
            studentProfile = new StudentProfile(profileData);
            await studentProfile.save();
        }

        await User.findByIdAndUpdate(userId, {
            $set: { hasCompletedPreferences: true }
        });

        return res.status(200).json({
            success: true,
            message: 'Student preferences saved successfully',
            data: studentProfile
        });

    } catch (error) {
        console.error('Error saving preferences:', error);
        return res.status(500).json({
            success: false,
            message: 'Error saving preferences',
            error: error.message
        });
    }
};

exports.getPreferences = async (req, res) => {
    try {
        const userId = req.userId || req.query.userId || req.body.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required. Authentication may have failed.'
            });
        }

        const studentProfile = await StudentProfile.findOne({ userId });

        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: studentProfile
        });

    } catch (error) {
        console.error('Error fetching preferences:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching preferences',
            error: error.message
        });
    }
};

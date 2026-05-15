const { sendInquiryEmail } = require("../services/emailService");

exports.sendInquiry = async (req, res) => {
    const { email, inquiryType, message, name, phone } = req.body;

    try {
        if (!email || !inquiryType || !message || !name) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        await sendInquiryEmail(inquiryType, email, name, phone, message);
        
        res.status(200).json({ 
            success: true, 
            message: "Inquiry sent successfully" 
        });

    } catch (error) {
        console.error("Error in sendInquiry:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send inquiry", 
            error: error.message 
        });
    }
};
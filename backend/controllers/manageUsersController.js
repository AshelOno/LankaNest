const User = require("../models/User");
const Admin = require("../models/Admin");
const bcryptjs = require("bcryptjs");
const { signedDocumentUrl } = require("../services/storageService");

exports.createAdmin = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validate required fields
        if (!email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: "Email, username, and password are required"
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create admin user
        const admin = new Admin({
            email,
            password: hashedPassword,
            username,
            role: "admin",
            isVerified: true
        });

        await admin.save();

        // Return admin data without password
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            success: true,
            message: "Admin user created successfully",
            user: adminResponse
        });

    } catch (error) {
        console.error("Error creating admin:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create admin user"
        });
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isVerified: true }).select('username email role createdAt isFlagged');

        res.status(200).json({
            success: true,
            users: users
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
}

exports.flagUsers = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user first
        const existingUser = await User.findById(userId);
        
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Toggle the flag status
        const user = await User.findByIdAndUpdate(
            userId,
            { isFlagged: !existingUser.isFlagged },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: user.isFlagged ? "User flagged successfully" : "User unflagged successfully",
            user
        });
    } catch (error) {
        console.error("Error flagging user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user flag status"
        });
    }
}

exports.generateDocumentUrl = async (req, res) => {
    try {
        const { documentKey } = req.params;
        
        if (!documentKey) {
            return res.status(400).json({ success: false, message: "Document key required" });
        }

        const signedUrl = await signedDocumentUrl(
            process.env.AWS_NIC_BUCKET_NAME,
            documentKey,
            60 * 5
        );

        res.status(200).json({
            success: true,
            url: signedUrl
        });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ success: false, message: "Failed to generate signed URL" });
    }
}

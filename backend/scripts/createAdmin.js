const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("AdminPass123!", 10);

    const admin = new User({
      email: "admin@lankanest.com",
      password: hashedPassword,
      username: "admin",
      role: "admin",
      isVerified: true,
      accountStatus: "active",
    });

    await admin.save();

    console.log("🎉 Admin user created successfully!");
    console.log("📧 Email: admin@lankanest.com");
    console.log("👤 Username: admin");
    console.log("🔑 Password: AdminPass123!");
    console.log("\n⚠️  Please change the password after first login!");

  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
createAdmin();
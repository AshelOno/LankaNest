// server.js
const express = require("express");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const { getAllowedOrigins, validateEnv } = require("./config/env");

const cors = require("cors");
const passport = require("./config/passport");
const cookieParser = require("cookie-parser");
const session = require("express-session"); // Added session import
const adminRoutes = require("./routes/admin");
const listingRoutes = require("./routes/listingRoutes");
const reviewRoutes = require("./routes/review");
const preferenceRoutes = require("./routes/preference");
const notificationRoutes = require("./routes/notificationRoutes");
const http = require("http");
const { initializeSocket } = require("./config/socket");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const redisClient = require("./config/redis");
const {
  errorHandler,
  notFoundHandler,
  rateLimiter,
  securityHeaders,
} = require("./middleware/security");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = getAllowedOrigins();

validateEnv();

app.set("trust proxy", 1);
app.disable("x-powered-by");

// Body parser to handle form data
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.FORM_BODY_LIMIT || "1mb" }));
app.use(securityHeaders);
app.use(rateLimiter);

// Session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse cookies
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// MongoDB Connection and Server Start
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    server
      .listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${PORT} is busy. Trying port ${PORT + 1}`);
          server.listen(PORT + 1, () => {
            console.log(`Server is running on port ${PORT + 1}`);
          });
        } else {
          console.error("Server error:", err);
        }
      });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();

// Schedule job to check for expiring subscriptions (runs daily at 8:00 AM)
const cron = require("node-cron");
const {
  checkExpiringSubscriptions,
} = require("./controllers/subscriptionController");

cron.schedule("0 8 * * *", async () => {
  console.log(
    "Running scheduled job: checking expiring and expired subscriptions"
  );
  try {
    const result = await checkExpiringSubscriptions();
    console.log("Subscription check completed:", result);
  } catch (error) {
    console.error("Error in subscription check job:", error);
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Welcome to LankaNest Backend!");
});

app.get("/health", async (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  let redisReady = false;

  try {
    redisReady = (await redisClient.ping()) === "PONG";
  } catch {
    redisReady = false;
  }

  res.status(mongoReady && redisReady ? 200 : 503).json({
    status: mongoReady && redisReady ? "ok" : "degraded",
    service: "lankanest-backend",
    mongo: mongoReady ? "ok" : "unavailable",
    redis: redisReady ? "ok" : "unavailable",
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", adminRoutes);
app.use("/api/send-email", require("./routes/inquiry"));
app.use("/api/listings", listingRoutes);
app.use("/api/university", require("./routes/university"));
app.use("/api/review", reviewRoutes);
app.use("/api/search", require("./routes/search"));
app.use("/api/preferences", preferenceRoutes);
app.use("/api/bookmark", require("./routes/bookmarkRoutes"));
app.use("/api/schedules", require("./routes/scheduleRoutes"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", require("./routes/chat"));
app.use("/api/plans", require("./routes/planRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionV2Routes"));
app.use("/api/page-status", require("./routes/pageStatus"));
app.use("/api/report", require("./routes/listingReportRoutes")); // Added report route
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/recommendations", require("./routes/recommendationRoutes"));
app.use("/api/assistant", require("./routes/assistantRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes")); // Added feedback route

app.use(notFoundHandler);
app.use(errorHandler);

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(async () => {
    await Promise.allSettled([mongoose.connection.close(), redisClient.quit()]);
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

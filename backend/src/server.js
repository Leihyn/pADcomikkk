import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Import services
import hederaService from "./services/hederaService.js";
import ipfsService from "./services/ipfsService.js";

// Import routes
import comicsRoutes from "./routes/comics.js";
import marketplaceRoutes from "./routes/marketplace.js";
import readerRoutes from "./routes/reader.js";
import authRoutes from "./routes/auth.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(
  morgan(process.env.NODE_ENV === "development" ? "dev" : "combined")
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Upload-specific limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many uploads from this IP, please try again later.",
});
app.use("/api/comics/collections", uploadLimiter);
app.use("/api/comics/issues", uploadLimiter);
app.use("/api/comics/upload-pages", uploadLimiter);

// ============================================
// ROUTES
// ============================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎨 Comic Pad API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get("/health", async (req, res) => {
  const result = {
    success: true,
    services: {
      hedera: "unknown",
      ipfs: "unknown",
      api: "healthy",
    },
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  try {
    // Hedera
    const hederaStatus = hederaService.getHealthStatus();
    result.services.hedera = hederaStatus === "healthy" ? "healthy" : "unhealthy";
    if (hederaStatus !== "healthy" && hederaStatus !== "demo") result.success = false;

    // IPFS
    const ipfsStatus = ipfsService.getStatus();
    result.services.ipfs = ipfsStatus.isInitialized ? "healthy" : "unhealthy";
    if (!ipfsStatus.isInitialized) result.success = false;

    res.status(result.success ? 200 : 503).json(result);
  } catch (error) {
    console.error("❌ Health check error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Register API routes
app.use("/api/comics", comicsRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/reader", readerRoutes);
app.use("/api/auth", authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "File too large. Max size: 50MB.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// SERVICE INITIALIZATION
// ============================================

async function initializeServices() {
  console.log("🚀 Initializing Comic Pad services...\n");

  try {
    console.log("📡 Connecting to Hedera...");
    await hederaService.initialize();

    console.log("📦 Connecting to IPFS (Pinata/Web3.Storage)...");
    await ipfsService.initialize();

    console.log("✅ All services initialized successfully!\n");
  } catch (error) {
    console.error("❌ Service initialization failed:", error.message);
    console.error("⚠️ Server will still start, but some features may not work.\n");
  }
}

// ============================================
// START SERVER
// ============================================

async function startServer() {
  await initializeServices();

  app.listen(PORT, () => {
    console.log("=".repeat(60));
    console.log("🎨 Comic Pad API Server");
    console.log("=".repeat(60));
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Network: ${process.env.HEDERA_NETWORK || "testnet"}`);
    console.log(`⚡ Ready to accept requests!`);
    console.log("=".repeat(60));
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️ SIGINT received, shutting down gracefully...");
  process.exit(0);
});

startServer();

export default app;

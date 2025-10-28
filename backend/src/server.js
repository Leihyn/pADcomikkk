import express from "express";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Import routes
import authRoutes from "./routes/auth.js";
import comicsRoutes from "./routes/comics.js";
import marketplaceRoutes from "./routes/marketplace.js";
import readerRoutes from "./routes/reader.js";

// Import services
import hederaService from "./services/hederaService.js";
import ipfsService from "./services/ipfsService.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
app.use(morgan("dev")); // HTTP request logger
app.use((err, req, res, next) => {
  console.error("🔥 Global error:", err);
  if (err instanceof multer.MulterError || err.message.includes("Invalid file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: "Server error" });
});

app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});


// Static files (for uploaded content)
app.use("/uploads", express.static(uploadsDir));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Comic Pad API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/comics", comicsRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/reader", readerRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Comic Pad API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      comics: "/api/comics",
      marketplace: "/api/marketplace",
      reader: "/api/reader",
      health: "/health"
    },
    documentation: "https://docs.comicpad.app"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 10MB"
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log("\n🚀 Starting Comic Pad API Server...\n");

    // Initialize Hedera Service
    console.log("📡 Initializing Hedera Service...");
    await hederaService.initialize();

    // Test IPFS connection
    console.log("📦 Testing IPFS connection...");
    await ipfsService.initialize();

    // Start Express server
    app.listen(PORT, () => {
      console.log("\n✅ Comic Pad API Server is running!");
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`\n🌐 Network: ${process.env.HEDERA_NETWORK || "testnet"}`);
      console.log(`💾 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n⚠️ SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️ SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

export default app;
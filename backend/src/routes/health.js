import express from "express";
import hederaService from "../services/hederaService.js";
import ipfsService from "../services/ipfsService.js";

const router = express.Router();
const startTime = Date.now();

router.get("/", async (req, res) => {
  try {
    const uptimeSeconds = (Date.now() - startTime) / 1000;

    // --- Hedera ---
    let hederaStatus = "unhealthy";
    if (hederaService.demoMode || hederaService.getHealthStatus() === "healthy") {
      hederaStatus = "healthy";
    }

    // --- IPFS ---
    let ipfsStatus = "unhealthy";
    const ipfsState = ipfsService.getStatus?.() || {};
    if (ipfsService.isInitialized || ipfsState.isInitialized) {
      ipfsStatus = "healthy";
    }

    // --- API ---
    const services = {
      hedera: hederaStatus,
      ipfs: ipfsStatus,
      api: "healthy"
    };

    const allHealthy = Object.values(services).every(s => s === "healthy");

    return res.status(allHealthy ? 200 : 500).json({
      success: allHealthy,
      services,
      uptimeSeconds,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Health check error:", err);
    return res.status(500).json({
      success: false,
      error: "Health check failed",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;


import express from "express";
import hederaService from "../services/hederaService.js";
import comicService from "../services/comicService.js";

const authRouter = express.Router();

// 🧠 Temporary in-memory sessions (replace with JWT or database in production)
const sessions = new Map();

/**
 * POST /api/auth/connect
 * Connect wallet and create/retrieve user session
 */
authRouter.post("/connect", async (req, res) => {
  try {
    const { walletAddress, publicKey } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    // Verify wallet exists on Hedera
    try {
      await hederaService.getAccountBalance(walletAddress);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid Hedera account ID",
      });
    }

    // Create or retrieve user session
    let user = sessions.get(walletAddress);

    if (!user) {
      user = {
        wallet: walletAddress,
        publicKey,
        connectedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      sessions.set(walletAddress, user);
    } else {
      user.lastActive = new Date().toISOString();
    }

    res.json({
      success: true,
      user,
      message: "Wallet connected successfully",
    });
  } catch (error) {
    console.error("Connect wallet error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/profile/:wallet
 * Get user profile and owned comics
 */
authRouter.get("/profile/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;

    const user = sessions.get(wallet);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User session not found",
      });
    }

    const balance = await hederaService.getAccountBalance(wallet);
    const comics = await comicService.getWalletComics(wallet);

    res.json({
      success: true,
      profile: {
        ...user,
        balance: balance.hbar,
        totalComics: comics.totalCollections,
        collections: comics.collections,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/disconnect
 * Disconnect wallet
 */
authRouter.post("/disconnect", (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    sessions.delete(walletAddress);

    res.json({
      success: true,
      message: "Wallet disconnected successfully",
    });
  } catch (error) {
    console.error("Disconnect wallet error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/verify/:wallet
 * Verify if wallet session is active
 */
authRouter.get("/verify/:wallet", (req, res) => {
  try {
    const { wallet } = req.params;
    const user = sessions.get(wallet);

    res.json({
      success: true,
      isConnected: !!user,
      ...(user && { user }),
    });
  } catch (error) {
    console.error("Verify session error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default authRouter;

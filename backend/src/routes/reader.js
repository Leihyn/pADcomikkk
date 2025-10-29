import express from "express";
import comicService from "../services/comicService.js";
import ipfsService from "../services/ipfsService.js";

const router = express.Router();

/**
 * GET /api/reader/library/:wallet
 * Get all comics owned by wallet (reader's library)
 */
router.get("/library/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;

    const result = await comicService.getWalletComics(wallet);

    res.json(result);
  } catch (error) {
    console.error("Get library error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/reader/access
 * Verify access and get comic content
 */
router.post("/access", async (req, res) => {
  try {
    const { wallet, tokenId, serialNumber } = req.body;

    if (!wallet || !tokenId || !serialNumber) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Verify ownership
    const ownership = await comicService.verifyOwnership(
      wallet,
      tokenId,
      parseInt(serialNumber)
    );

    if (!ownership.isOwner) {
      return res.status(403).json({
        success: false,
        error: "You do not own this comic",
        isOwner: false,
      });
    }

    // Get comic details with pages
    const comic = await comicService.getComicDetails(
      tokenId,
      parseInt(serialNumber)
    );

    res.json({
      success: true,
      hasAccess: true,
      comic,
    });
  } catch (error) {
    console.error("Access verification error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/reader/comic/:tokenId/:serialNumber
 * Get comic reader data
 */
router.get("/comic/:tokenId/:serialNumber", async (req, res) => {
  try {
    const { tokenId, serialNumber } = req.params;
    const { wallet } = req.query;

    // Verify ownership if wallet provided
    if (wallet) {
      const ownership = await comicService.verifyOwnership(
        wallet,
        tokenId,
        parseInt(serialNumber)
      );

      if (!ownership.isOwner) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You must own this comic to read it.",
        });
      }
    }

    // Get comic details
    const result = await comicService.getComicDetails(
      tokenId,
      parseInt(serialNumber)
    );

    res.json(result);
  } catch (error) {
    console.error("Get comic error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

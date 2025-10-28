import express from "express";
import comicService from "../services/comicService.js";
import hederaService from "../services/hederaService.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// In-memory storage for reading progress and bookmarks
const readingProgress = new Map();
const bookmarks = new Map();

/**
 * GET /api/reader/library/:accountId
 * Get user's owned comics
 */
router.get("/library/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    // Get account balance to see owned tokens
    const balance = await hederaService.getBalance(accountId);
    
    // Extract token IDs from balance
    const ownedTokens = [];
    if (balance.tokens) {
      for (const [tokenId, amount] of balance.tokens.entries()) {
        if (amount.toNumber() > 0) {
          ownedTokens.push({
            tokenId: tokenId.toString(),
            quantity: amount.toNumber()
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        accountId,
        library: ownedTokens,
        total: ownedTokens.length
      }
    });
  } catch (error) {
    console.error("Error fetching library:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch library"
    });
  }
});

/**
 * GET /api/reader/access/:tokenId
 * Check access to comic
 */
router.get("/access/:tokenId", authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { serial } = req.query;
    const accountId = req.user.accountId;

    // Verify ownership and get access
    const access = await comicService.verifyAccess({
      accountId,
      tokenId,
      serial: serial ? parseInt(serial) : undefined
    });

    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        message: access.message || "Access denied"
      });
    }

    res.status(200).json({
      success: true,
      data: access
    });
  } catch (error) {
    console.error("Error checking access:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check access"
    });
  }
});

/**
 * GET /api/reader/content/:tokenId
 * Get comic content (token-gated)
 */
router.get("/content/:tokenId", authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { serial } = req.query;
    const accountId = req.user.accountId;

    // Verify access
    const access = await comicService.verifyAccess({
      accountId,
      tokenId,
      serial: serial ? parseInt(serial) : undefined
    });

    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not own this comic"
      });
    }

    res.status(200).json({
      success: true,
      data: access.comic
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch content"
    });
  }
});

/**
 * POST /api/reader/progress
 * Save reading progress
 */
router.post("/progress", authenticateToken, async (req, res) => {
  try {
    const { tokenId, serial, currentPage, totalPages } = req.body;
    const accountId = req.user.accountId;

    if (!tokenId || currentPage === undefined) {
      return res.status(400).json({
        success: false,
        message: "Token ID and current page are required"
      });
    }

    const progressKey = `${accountId}-${tokenId}-${serial || 1}`;
    const progress = {
      accountId,
      tokenId,
      serial: serial || 1,
      currentPage: parseInt(currentPage),
      totalPages: parseInt(totalPages),
      percentage: totalPages ? Math.round((currentPage / totalPages) * 100) : 0,
      lastRead: new Date().toISOString()
    };

    readingProgress.set(progressKey, progress);

    res.status(200).json({
      success: true,
      message: "Progress saved",
      data: progress
    });
  } catch (error) {
    console.error("Error saving progress:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save progress"
    });
  }
});

/**
 * GET /api/reader/progress/:tokenId
 * Get reading progress
 */
router.get("/progress/:tokenId", authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { serial } = req.query;
    const accountId = req.user.accountId;

    const progressKey = `${accountId}-${tokenId}-${serial || 1}`;
    const progress = readingProgress.get(progressKey);

    if (!progress) {
      return res.status(200).json({
        success: true,
        data: {
          currentPage: 1,
          percentage: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch progress"
    });
  }
});

/**
 * POST /api/reader/bookmark
 * Add bookmark
 */
router.post("/bookmark", authenticateToken, async (req, res) => {
  try {
    const { tokenId, serial, pageNumber, note } = req.body;
    const accountId = req.user.accountId;

    if (!tokenId || pageNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: "Token ID and page number are required"
      });
    }

    const bookmarkKey = `${accountId}-${tokenId}`;
    let userBookmarks = bookmarks.get(bookmarkKey) || [];

    const bookmark = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tokenId,
      serial: serial || 1,
      pageNumber: parseInt(pageNumber),
      note: note || "",
      createdAt: new Date().toISOString()
    };

    userBookmarks.push(bookmark);
    bookmarks.set(bookmarkKey, userBookmarks);

    res.status(201).json({
      success: true,
      message: "Bookmark added",
      data: bookmark
    });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add bookmark"
    });
  }
});

/**
 * GET /api/reader/bookmarks/:tokenId
 * Get bookmarks for comic
 */
router.get("/bookmarks/:tokenId", authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const accountId = req.user.accountId;

    const bookmarkKey = `${accountId}-${tokenId}`;
    const userBookmarks = bookmarks.get(bookmarkKey) || [];

    res.status(200).json({
      success: true,
      data: {
        bookmarks: userBookmarks,
        total: userBookmarks.length
      }
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookmarks"
    });
  }
});

/**
 * DELETE /api/reader/bookmark/:bookmarkId
 * Delete bookmark
 */
router.delete("/bookmark/:bookmarkId", authenticateToken, async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const accountId = req.user.accountId;

    // Find and delete bookmark
    let deleted = false;
    for (const [key, userBookmarks] of bookmarks.entries()) {
      if (key.startsWith(accountId)) {
        const index = userBookmarks.findIndex(b => b.id === bookmarkId);
        if (index !== -1) {
          userBookmarks.splice(index, 1);
          bookmarks.set(key, userBookmarks);
          deleted = true;
          break;
        }
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Bookmark deleted"
    });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete bookmark"
    });
  }
});

/**
 * GET /api/reader/reading-list
 * Get user's reading list with progress
 */
router.get("/reading-list", authenticateToken, async (req, res) => {
  try {
    const accountId = req.user.accountId;

    // Get all progress for user
    const userProgress = [];
    for (const [key, progress] of readingProgress.entries()) {
      if (key.startsWith(accountId)) {
        userProgress.push(progress);
      }
    }

    // Sort by last read
    userProgress.sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead));

    res.status(200).json({
      success: true,
      data: {
        readingList: userProgress,
        total: userProgress.length
      }
    });
  } catch (error) {
    console.error("Error fetching reading list:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reading list"
    });
  }
});

export default router;
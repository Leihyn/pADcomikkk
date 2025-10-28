import express from "express";
import multer from "multer";
import fs from "fs";
import comicService from "../services/comicService.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// ✅ Ensure uploads folder exists
const uploadPath = "uploads/";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📁 Created uploads directory");
}

// ✅ Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  
     fileFilter : (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/octet-stream"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP allowed."));
  }}


});

/**
 * POST /api/comics/collections
 * Create a new comic collection
 */
router.post("/collections", upload.single("coverImage"), async (req, res) => {
    console.log("3️⃣ File uploaded or processed");

  }
);

/**
 * POST /api/comics
 * Create and mint a new comic
 */
router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "pages", maxCount: 50 }
  ]),
  async (req, res) => {
    try {
      const {
        collectionTokenId,
        title,
        description,
        genre,
        issueNumber,
        copies,
        attributes
      } = req.body;

      const creator = req.user.accountId;
      const coverImage = req.files.coverImage?.[0]?.path;
      const pages = req.files.pages?.map(file => file.path) || [];

      if (!collectionTokenId || !title || !coverImage || pages.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Collection ID, title, cover image, and pages are required"
        });
      }

      const comic = await comicService.createComic({
        collectionTokenId,
        title,
        description,
        coverImage,
        pages,
        creator,
        genre,
        issueNumber: parseInt(issueNumber) || 1,
        copies: parseInt(copies) || 1,
        attributes: attributes ? JSON.parse(attributes) : []
      });

      res.status(201).json({
        success: true,
        message: "Comic created and minted successfully",
        data: comic
      });
    } catch (error) {
      console.error("❌ Error creating comic:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create comic"
      });
    }
  }
);

/**
 * POST /api/comics/:tokenId/mint
 * Mint additional copies of existing comic
 */
router.post("/:tokenId/mint", authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { metadataIPFSHash, copies } = req.body;

    if (!metadataIPFSHash || !copies) {
      return res.status(400).json({
        success: false,
        message: "Metadata IPFS hash and number of copies are required"
      });
    }

    const result = await comicService.mintAdditionalCopies({
      tokenId,
      metadataIPFSHash,
      copies: parseInt(copies)
    });

    res.status(200).json({
      success: true,
      message: `Minted ${copies} additional copies`,
      data: result
    });
  } catch (error) {
    console.error("❌ Error minting copies:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mint copies"
    });
  }
});

/**
 * GET /api/comics/:tokenId
 * Get comic details
 */
router.get("/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { serial } = req.query;

    const comic = await comicService.getComic({
      tokenId,
      serial: serial ? parseInt(serial) : undefined
    });

    res.status(200).json({
      success: true,
      data: comic
    });
  } catch (error) {
    console.error("❌ Error fetching comic:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch comic"
    });
  }
});

/**
 * GET /api/comics/search
 * Search comics
 */
router.get("/search", async (req, res) => {
  try {
    const { query, genre, creator, limit, offset } = req.query;

    const results = await comicService.searchComics({
      query,
      genre,
      creator,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("❌ Error searching comics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search comics"
    });
  }
});

/**
 * GET /api/comics/featured
 * Get featured comics
 */
router.get("/featured", async (req, res) => {
  try {
    const { limit } = req.query;

    const featured = await comicService.getFeaturedComics({
      limit: parseInt(limit) || 10
    });

    res.status(200).json({
      success: true,
      data: featured
    });
  } catch (error) {
    console.error("❌ Error fetching featured comics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch featured comics"
    });
  }
});

/**
 * GET /api/comics/creator/:accountId
 * List comics by creator
 */
router.get("/creator/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    const comics = await comicService.listComicsByCreator({
      creatorAccount: accountId
    });

    res.status(200).json({
      success: true,
      data: comics
    });
  } catch (error) {
    console.error("❌ Error listing creator comics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to list comics"
    });
  }
});

export default router;

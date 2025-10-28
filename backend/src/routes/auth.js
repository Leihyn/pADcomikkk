import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import hederaService from "../services/hederaService.js"; // ✅ ensure .js extension

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// Mock user database (replace with real database in production)
const users = new Map();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3-20 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("hederaAccountId")
      .optional()
      .isString()
      .withMessage("Hedera account ID must be a string"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { username, email, password, hederaAccountId } = req.body;

      if (users.has(email)) {
        return res.status(400).json({
          success: false,
          error: "User already exists",
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        hederaAccountId: hederaAccountId || null,
        createdAt: new Date().toISOString(),
        isVerified: false,
        profile: {
          bio: "",
          avatar: "",
          socialLinks: {},
        },
      };

      users.set(email, user);

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            hederaAccountId: user.hederaAccountId,
            createdAt: user.createdAt,
            profile: user.profile,
          },
          token,
        },
        message: "User registered successfully",
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = users.get(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            hederaAccountId: user.hederaAccountId,
            createdAt: user.createdAt,
            profile: user.profile,
          },
          token,
        },
        message: "Login successful",
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * JWT Authentication Middleware
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

// Apply authentication to protected routes
router.use("/profile", authenticateToken);
router.use("/connect-wallet", authenticateToken);

export default router;

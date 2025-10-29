import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  TokenInfoQuery,
  AccountBalanceQuery,
  CustomRoyaltyFee,
  CustomFixedFee,
  Hbar
} from "@hashgraph/sdk";

class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
    this.treasuryId = null;
    this.demoMode = false; // ✅ fallback mode if env missing
  }

  /**
   * Initialize Hedera client
   */
  async initialize() {
    try {
      const network = process.env.HEDERA_NETWORK || "testnet";

      const accountId =
        process.env.HEDERA_ACCOUNT_ID || process.env.HEDERA_OPERATOR_ID;
      const privateKey =
        process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_OPERATOR_KEY;

      if (!accountId || !privateKey) {
        console.warn("⚠️  Hedera credentials not configured — running in DEMO MODE");
        this.demoMode = true;
        return true; // mark as “healthy”
      }

      this.operatorId = AccountId.fromString(accountId);
      this.operatorKey = PrivateKey.fromString(privateKey);
      this.treasuryId = this.operatorId;

      if (network === "mainnet") {
        this.client = Client.forMainnet();
      } else if (network === "previewnet") {
        this.client = Client.forPreviewnet();
      } else {
        this.client = Client.forTestnet();
      }

      this.client.setOperator(this.operatorId, this.operatorKey);

      console.log(`✅ Hedera Service initialized on ${network}`);
      console.log(`📍 Operator Account: ${this.operatorId.toString()}`);

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Hedera Service:", error.message);
      this.demoMode = true; // fallback to demo
      return true;
    }
  }

  /**
   * Create NFT Collection (Token)
   */
  async createCollection({
    name,
    symbol,
    maxSupply,
    royaltyPercentage = 10,
    metadata = {}
  }) {
    if (this.demoMode) {
      console.log("🧩 Demo mode: createCollection simulated");
      return {
        tokenId: "0.0.999999",
        name,
        symbol,
        maxSupply,
        royaltyPercentage,
        transactionId: "demo-tx-create"
      };
    }

    try {
      if (!this.client) await this.initialize();

      const royaltyFee = new CustomRoyaltyFee()
        .setNumerator(royaltyPercentage)
        .setDenominator(100)
        .setFeeCollectorAccountId(this.treasuryId)
        .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)));

      const transaction = await new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setMaxSupply(maxSupply)
        .setSupplyType(TokenSupplyType.Finite)
        .setTreasuryAccountId(this.treasuryId)
        .setSupplyKey(this.operatorKey)
        .setAdminKey(this.operatorKey)
        .setCustomFees([royaltyFee])
        .setTokenMemo(JSON.stringify(metadata))
        .freezeWith(this.client);

      const signTx = await transaction.sign(this.operatorKey);
      const txResponse = await signTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const tokenId = receipt.tokenId;

      console.log(`✅ Collection created: ${tokenId.toString()}`);

      return {
        tokenId: tokenId.toString(),
        name,
        symbol,
        maxSupply,
        royaltyPercentage,
        transactionId: txResponse.transactionId.toString()
      };
    } catch (error) {
      console.error("❌ Failed to create collection:", error.message);
      throw error;
    }
  }

  /**
   * Mint NFT(s)
   */
  async mintNFT({ tokenId, metadataURIs }) {
    if (this.demoMode) {
      console.log("🧩 Demo mode: mintNFT simulated");
      return {
        tokenId,
        serials: ["1", "2"],
        transactionId: "demo-tx-mint"
      };
    }

    try {
      if (!this.client) await this.initialize();

      const metadataArray = metadataURIs.map(uri => Buffer.from(uri));

      const transaction = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata(metadataArray)
        .freezeWith(this.client);

      const signTx = await transaction.sign(this.operatorKey);
      const txResponse = await signTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      const serials = receipt.serials.map(s => s.toString());

      console.log(`✅ Minted ${serials.length} NFT(s) to ${tokenId}`);
      return {
        tokenId,
        serials,
        transactionId: txResponse.transactionId.toString()
      };
    } catch (error) {
      console.error("❌ Failed to mint NFT:", error.message);
      throw error;
    }
  }

  /**
   * Associate token with account
   */
  async associateToken({ accountId, tokenId, accountPrivateKey }) {
    if (this.demoMode) {
      console.log("🧩 Demo mode: associateToken simulated");
      return { status: "SUCCESS", transactionId: "demo-tx-associate" };
    }

    try {
      if (!this.client) await this.initialize();

      const transaction = await new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId])
        .freezeWith(this.client);

      const privateKey = PrivateKey.fromString(accountPrivateKey);
      const signTx = await transaction.sign(privateKey);
      const txResponse = await signTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      console.log(`✅ Token ${tokenId} associated with ${accountId}`);
      return {
        status: receipt.status.toString(),
        transactionId: txResponse.transactionId.toString()
      };
    } catch (error) {
      console.error("❌ Failed to associate token:", error.message);
      throw error;
    }
  }

  /**
   * Transfer NFT
   */
  async transferNFT({ tokenId, serial, fromAccountId, toAccountId, fromPrivateKey }) {
    if (this.demoMode) {
      console.log("🧩 Demo mode: transferNFT simulated");
      return {
        status: "SUCCESS",
        transactionId: "demo-tx-transfer"
      };
    }

    try {
      if (!this.client) await this.initialize();

      const transaction = await new TransferTransaction()
        .addNftTransfer(tokenId, serial, fromAccountId, toAccountId)
        .freezeWith(this.client);

      const privateKey = PrivateKey.fromString(fromPrivateKey);
      const signTx = await transaction.sign(privateKey);
      const txResponse = await signTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      console.log(`✅ NFT transferred: ${tokenId}:${serial}`);
      console.log(`📤 From: ${fromAccountId} → To: ${toAccountId}`);

      return {
        status: receipt.status.toString(),
        transactionId: txResponse.transactionId.toString()
      };
    } catch (error) {
      console.error("❌ Failed to transfer NFT:", error.message);
      throw error;
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(tokenId) {
    if (this.demoMode) {
      console.log("🧩 Demo mode: getTokenInfo simulated");
      return {
        tokenId,
        name: "Demo Comic",
        symbol: "DEMO",
        totalSupply: "1",
        maxSupply: "100",
        treasury: "0.0.0",
        customFees: []
      };
    }

    try {
      if (!this.client) await this.initialize();

      const query = new TokenInfoQuery().setTokenId(tokenId);
      const tokenInfo = await query.execute(this.client);

      return {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        totalSupply: tokenInfo.totalSupply.toString(),
        maxSupply: tokenInfo.maxSupply.toString(),
        treasury: tokenInfo.treasuryAccountId.toString(),
        customFees: tokenInfo.customFees
      };
    } catch (error) {
      console.error("❌ Failed to get token info:", error.message);
      throw error;
    }
  }

  /**
   * Check NFT ownership
   */
  async checkOwnership({ accountId, tokenId }) {
    if (this.demoMode) {
      return { accountId, tokenId, owns: true, quantity: 1 };
    }

    try {
      if (!this.client) await this.initialize();

      const query = new AccountBalanceQuery().setAccountId(accountId);
      const balance = await query.execute(this.client);

      const tokenBalance = balance.tokens.get(tokenId);
      const owns = tokenBalance && tokenBalance.toNumber() > 0;

      return {
        accountId,
        tokenId,
        owns,
        quantity: owns ? tokenBalance.toNumber() : 0
      };
    } catch (error) {
      console.error("❌ Failed to check ownership:", error.message);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(accountId) {
    if (this.demoMode) {
      return { hbar: "100 Hbar", tokens: {} };
    }

    try {
      if (!this.client) await this.initialize();

      const query = new AccountBalanceQuery().setAccountId(accountId);
      const balance = await query.execute(this.client);

      return {
        hbar: balance.hbars.toString(),
        tokens: balance.tokens
      };
    } catch (error) {
      console.error("❌ Failed to get balance:", error.message);
      throw error;
    }
  }

  /**
   * Health status (used by /health route)
   */
  getHealthStatus() {
    if (this.demoMode) return "demo";
    if (this.client) return "healthy";
    return "uninitialized";
  }
}

export default new HederaService();

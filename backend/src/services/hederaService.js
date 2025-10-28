const {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  CustomRoyaltyFee,
  TokenMintTransaction,
  TransferTransaction,
  AccountBalanceQuery,
  TokenNftInfoQuery,
  NftId,
  Hbar,
  Status
} = require('@hashgraph/sdk');

class HederaService {
  constructor() {
    this.client = null;
    this.accountId = null;
    this.privateKey = null;
    this.publicKey = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize Hedera client
      this.client = Client.forName(process.env.HEDERA_NETWORK || 'testnet');
      
      // Check if credentials are provided
      if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
        console.log('⚠️  Hedera credentials not provided, running in demo mode');
        this.isInitialized = true;
        return true;
      }
      
      // Set up account credentials
      this.accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
      this.privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
      this.publicKey = this.privateKey.publicKey;
      
      // Set client credentials
      this.client.setOperator(this.accountId, this.privateKey);
      
      // Test connection
      const balance = await new AccountBalanceQuery()
        .setAccountId(this.accountId)
        .execute(this.client);
      
      console.log(`✅ Hedera connection established. Account balance: ${balance.hbars.toString()}`);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Hedera service:', error);
      console.log('⚠️  Running in demo mode without Hedera connection');
      this.isInitialized = true;
      return true;
    }
  }

  /**
   * Create a new NFT collection using Hedera Token Service (HTS)
   * @param {Object} collectionData - Collection metadata
   * @returns {Object} Token creation result
   */
  async createNFTCollection(collectionData) {
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const {
        name,
        symbol,
        metadata,
        royaltyPercentage = 10, // Default 10% royalty
        maxSupply = 0 // 0 = unlimited
      } = collectionData;

      // Create royalty fee configuration
      const royaltyFee = new CustomRoyaltyFee()
        .setFeeCollectorAccountId(this.accountId)
        .setNumerator(royaltyPercentage)
        .setDenominator(100);

      // Create the NFT token
      const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.accountId)
        .setSupplyKey(this.privateKey)
        .setAdminKey(this.privateKey)
        .setCustomFees([royaltyFee])
        .setTokenMemo(JSON.stringify(metadata))
        .execute(this.client);

      const tokenCreateReceipt = await tokenCreateTx.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;

      console.log(`✅ NFT Collection created: ${tokenId.toString()}`);

      return {
        tokenId: tokenId.toString(),
        name,
        symbol,
        royaltyPercentage,
        maxSupply,
        metadata,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to create NFT collection:', error);
      throw error;
    }
  }

  /**
   * Mint a new NFT with metadata
   * @param {string} tokenId - The token ID of the collection
   * @param {string} metadataUri - IPFS URI containing NFT metadata
   * @returns {Object} Minting result
   */
  async mintNFT(tokenId, metadataUri) {
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      // Convert metadata URI to bytes
      const metadataBytes = Buffer.from(metadataUri, 'utf8');

      // Mint the NFT
      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([metadataBytes])
        .execute(this.client);

      const mintReceipt = await mintTx.getReceipt(this.client);
      const serialNumber = mintReceipt.serials[0];

      console.log(`✅ NFT minted: Token ${tokenId}, Serial ${serialNumber}`);

      return {
        tokenId: tokenId.toString(),
        serialNumber: serialNumber.toNumber(),
        metadataUri,
        mintedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to mint NFT:', error);
      throw error;
    }
  }

  /**
   * Batch mint multiple NFTs
   * @param {string} tokenId - The token ID of the collection
   * @param {string[]} metadataUris - Array of IPFS URIs
   * @returns {Object} Batch minting result
   */
  async batchMintNFTs(tokenId, metadataUris) {
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      // Convert metadata URIs to bytes
      const metadataBytes = metadataUris.map(uri => Buffer.from(uri, 'utf8'));

      // Mint the NFTs
      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata(metadataBytes)
        .execute(this.client);

      const mintReceipt = await mintTx.getReceipt(this.client);
      const serialNumbers = mintReceipt.serials.map(sn => sn.toNumber());

      console.log(`✅ Batch minted ${serialNumbers.length} NFTs: Token ${tokenId}`);

      return {
        tokenId: tokenId.toString(),
        serialNumbers,
        metadataUris,
        mintedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to batch mint NFTs:', error);
      throw error;
    }
  }

  /**
   * Transfer NFT to another account
   * @param {string} tokenId - The token ID
   * @param {number} serialNumber - The serial number
   * @param {string} fromAccountId - Sender account ID
   * @param {string} toAccountId - Receiver account ID
   * @returns {Object} Transfer result
   */
  async transferNFT(tokenId, serialNumber, fromAccountId, toAccountId) {
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const transferTx = await new TransferTransaction()
        .addNftTransfer(
          tokenId,
          serialNumber,
          AccountId.fromString(fromAccountId),
          AccountId.fromString(toAccountId)
        )
        .execute(this.client);

      const transferReceipt = await transferTx.getReceipt(this.client);

      console.log(`✅ NFT transferred: Token ${tokenId}, Serial ${serialNumber}`);

      return {
        tokenId: tokenId.toString(),
        serialNumber,
        fromAccountId,
        toAccountId,
        transferredAt: new Date().toISOString(),
        transactionId: transferReceipt.transactionId.toString()
      };
    } catch (error) {
      console.error('❌ Failed to transfer NFT:', error);
      throw error;
    }
  }

  /**
   * Get NFT information
   * @param {string} tokenId - The token ID
   * @param {number} serialNumber - The serial number
   * @returns {Object} NFT information
   */
  async getNFTInfo(tokenId, serialNumber) {
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const nftInfo = await new TokenNftInfoQuery()
        .setNftId(new NftId(tokenId, serialNumber))
        .execute(this.client);

      return {
        tokenId: tokenId.toString(),
        serialNumber,
        metadata: nftInfo.metadata.toString(),
        accountId: nftInfo.accountId.toString(),
        createdAt: new Date(nftInfo.creationTime.toDate()).toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get NFT info:', error);
      throw error;
    }
  }

  /**
   * Check if an account owns a specific NFT
   * @param {string} accountId - Account to check
   * @param {string} tokenId - Token ID to check
   * @param {number} serialNumber - Serial number to check
   * @returns {boolean} Ownership status
   */
  async checkNFTOwnership(accountId, tokenId, serialNumber) {
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
        .execute(this.client);

      const tokenBalance = balance.tokens.get(tokenId);
      return tokenBalance && tokenBalance.toNumber() > 0;
    } catch (error) {
      console.error('❌ Failed to check NFT ownership:', error);
      return false;
    }
  }

  /**
   * Get account balance
   * @param {string} accountId - Account ID to check
   * @returns {Object} Account balance information
   */
  async getAccountBalance(accountId) {
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
        .execute(this.client);

      return {
        accountId,
        hbarBalance: balance.hbars.toString(),
        tokenBalances: Array.from(balance.tokens.entries()).map(([tokenId, amount]) => ({
          tokenId: tokenId.toString(),
          amount: amount.toNumber()
        })),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      throw error;
    }
  }

  /**
   * Create a new Hedera account
   * @param {string} publicKey - Public key for the new account
   * @param {number} initialBalance - Initial HBAR balance (in tinybars)
   * @returns {Object} New account information
   */
  async createAccount(publicKey, initialBalance = 1000000000) { // 1 HBAR default
    if (!this.isInitialized) {
      throw new Error('Hedera service not initialized');
    }

    try {
      const newAccountId = AccountId.fromString(publicKey);
      
      // Note: In a real implementation, you would use AccountCreateTransaction
      // This is a simplified version for demonstration
      
      return {
        accountId: newAccountId.toString(),
        publicKey,
        initialBalance,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to create account:', error);
      throw error;
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      network: process.env.HEDERA_NETWORK || 'testnet',
      accountId: this.accountId ? this.accountId.toString() : null,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new HederaService();

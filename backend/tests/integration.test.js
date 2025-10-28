import dotenv from "dotenv";
import hederaService from "../src/services/hederaService.js";
import ipfsService from "../src/services/ipfsService.js";
import comicService from "../src/services/comicService.js";
import fs from "fs";
import path from "path";

dotenv.config();

// Test configuration
const TEST_CONFIG = {
  collectionName: "Test Comic Collection",
  collectionSymbol: "TCC",
  comicTitle: "Test Comic Issue #1",
  testAccountId: process.env.HEDERA_ACCOUNT_ID
};

// Helper function to create test image
function createTestImage(filename) {
  const testDir = path.join(process.cwd(), "tests", "test-files");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filepath = path.join(testDir, filename);
  
  // Create a simple test image (1x1 pixel PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(filepath, pngData);
  return filepath;
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

function logTest(name, passed, message = "") {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
  testResults.tests.push({ name, passed, message });
}

// Test Suite
async function runTests() {
  console.log("\n🧪 Starting Comic Pad Test Suite\n");
  console.log("=" .repeat(60));
  
  let collectionTokenId;
  let comicMetadataHash;
  
  try {
    // Test 1: Hedera Service Initialization
    console.log("\n📡 Test 1: Hedera Service Initialization");
    try {
      await hederaService.initialize();
      logTest("Hedera Service Initialize", true);
    } catch (error) {
      logTest("Hedera Service Initialize", false, error.message);
      throw error;
    }
    
    // Test 2: IPFS Connection
    console.log("\n📦 Test 2: IPFS Connection");
    try {
      await ipfsService.testConnection();
      logTest("IPFS Connection", true);
    } catch (error) {
      logTest("IPFS Connection", false, error.message);
      throw error;
    }
    
    // Test 3: Upload File to IPFS
    console.log("\n📤 Test 3: Upload File to IPFS");
    try {
      const testImagePath = createTestImage("test-cover.png");
      const uploadResult = await ipfsService.uploadFile(testImagePath, {
        name: "Test Cover Image",
        type: "cover"
      });
      
      if (uploadResult.ipfsHash && uploadResult.url) {
        logTest("Upload File to IPFS", true);
        console.log(`   IPFS Hash: ${uploadResult.ipfsHash}`);
        console.log(`   URL: ${uploadResult.url}`);
      } else {
        logTest("Upload File to IPFS", false, "Missing hash or URL");
      }
      
      // Cleanup
      fs.unlinkSync(testImagePath);
    } catch (error) {
      logTest("Upload File to IPFS", false, error.message);
    }
    
    // Test 4: Upload JSON to IPFS
    console.log("\n📝 Test 4: Upload JSON to IPFS");
    try {
      const testMetadata = {
        name: "Test Metadata",
        description: "This is test metadata",
        attributes: [
          { trait_type: "Test", value: "Value" }
        ]
      };
      
      const jsonResult = await ipfsService.uploadJSON(testMetadata, "test-metadata");
      
      if (jsonResult.ipfsHash && jsonResult.url) {
        logTest("Upload JSON to IPFS", true);
        console.log(`   IPFS Hash: ${jsonResult.ipfsHash}`);
        comicMetadataHash = jsonResult.ipfsHash;
      } else {
        logTest("Upload JSON to IPFS", false, "Missing hash or URL");
      }
    } catch (error) {
      logTest("Upload JSON to IPFS", false, error.message);
    }
    
    // Test 5: Get Account Balance
    console.log("\n💰 Test 5: Get Account Balance");
    try {
      const balance = await hederaService.getBalance(TEST_CONFIG.testAccountId);
      
      if (balance.hbar) {
        logTest("Get Account Balance", true);
        console.log(`   Balance: ${balance.hbar}`);
      } else {
        logTest("Get Account Balance", false, "No balance returned");
      }
    } catch (error) {
      logTest("Get Account Balance", false, error.message);
    }
    
    // Test 6: Create NFT Collection
    console.log("\n🎨 Test 6: Create NFT Collection");
    try {
      const collection = await hederaService.createCollection({
        name: TEST_CONFIG.collectionName,
        symbol: TEST_CONFIG.collectionSymbol,
        maxSupply: 100,
        royaltyPercentage: 10,
        metadata: {
          description: "Test collection for Comic Pad"
        }
      });
      
      if (collection.tokenId) {
        collectionTokenId = collection.tokenId;
        logTest("Create NFT Collection", true);
        console.log(`   Token ID: ${collectionTokenId}`);
        console.log(`   Name: ${collection.name}`);
        console.log(`   Symbol: ${collection.symbol}`);
      } else {
        logTest("Create NFT Collection", false, "No token ID returned");
      }
    } catch (error) {
      logTest("Create NFT Collection", false, error.message);
    }
    
    // Test 7: Get Token Info
    if (collectionTokenId) {
      console.log("\n📊 Test 7: Get Token Info");
      try {
        const tokenInfo = await hederaService.getTokenInfo(collectionTokenId);
        
        if (tokenInfo.tokenId === collectionTokenId) {
          logTest("Get Token Info", true);
          console.log(`   Name: ${tokenInfo.name}`);
          console.log(`   Symbol: ${tokenInfo.symbol}`);
          console.log(`   Total Supply: ${tokenInfo.totalSupply}`);
          console.log(`   Max Supply: ${tokenInfo.maxSupply}`);
        } else {
          logTest("Get Token Info", false, "Token ID mismatch");
        }
      } catch (error) {
        logTest("Get Token Info", false, error.message);
      }
    } else {
      console.log("\n⏭️  Test 7: Skipped (No collection created)");
    }
    
    // Test 8: Mint NFT
    if (collectionTokenId && comicMetadataHash) {
      console.log("\n🎭 Test 8: Mint NFT");
      try {
        const mintResult = await hederaService.mintNFT({
          tokenId: collectionTokenId,
          metadataURIs: [comicMetadataHash]
        });
        
        if (mintResult.serials && mintResult.serials.length > 0) {
          logTest("Mint NFT", true);
          console.log(`   Serials: ${mintResult.serials.join(", ")}`);
          console.log(`   Transaction ID: ${mintResult.transactionId}`);
        } else {
          logTest("Mint NFT", false, "No serials returned");
        }
      } catch (error) {
        logTest("Mint NFT", false, error.message);
      }
    } else {
      console.log("\n⏭️  Test 8: Skipped (Prerequisites not met)");
    }
    
    // Test 9: Check Ownership
    if (collectionTokenId) {
      console.log("\n🔐 Test 9: Check NFT Ownership");
      try {
        const ownership = await hederaService.checkOwnership({
          accountId: TEST_CONFIG.testAccountId,
          tokenId: collectionTokenId
        });
        
        logTest("Check NFT Ownership", true);
        console.log(`   Owns: ${ownership.owns}`);
        console.log(`   Quantity: ${ownership.quantity}`);
      } catch (error) {
        logTest("Check NFT Ownership", false, error.message);
      }
    } else {
      console.log("\n⏭️  Test 9: Skipped (No collection created)");
    }
    
    // Test 10: Comic Service - Create Collection (Integration)
    console.log("\n📚 Test 10: Comic Service - Create Collection");
    try {
      const coverPath = createTestImage("collection-cover.png");
      
      const collection = await comicService.createCollection({
        name: "Integration Test Collection",
        symbol: "ITC",
        description: "Test collection via Comic Service",
        coverImage: coverPath,
        creatorAccount: TEST_CONFIG.testAccountId,
        maxSupply: 50,
        royaltyPercentage: 10,
        genre: "Action"
      });
      
      if (collection.tokenId) {
        logTest("Comic Service - Create Collection", true);
        console.log(`   Token ID: ${collection.tokenId}`);
        console.log(`   Cover IPFS: ${collection.coverImage?.ipfsHash}`);
      } else {
        logTest("Comic Service - Create Collection", false, "No token ID");
      }
      
      fs.unlinkSync(coverPath);
    } catch (error) {
      logTest("Comic Service - Create Collection", false, error.message);
    }
    
    // Test 11: Comic Service - Create Comic (Full Flow)
    if (collectionTokenId) {
      console.log("\n📖 Test 11: Comic Service - Create Comic");
      try {
        const coverPath = createTestImage("comic-cover.png");
        const pages = [
          createTestImage("page-1.png"),
          createTestImage("page-2.png"),
          createTestImage("page-3.png")
        ];
        
        const comic = await comicService.createComic({
          collectionTokenId,
          title: TEST_CONFIG.comicTitle,
          description: "A test comic issue",
          coverImage: coverPath,
          pages,
          creator: TEST_CONFIG.testAccountId,
          genre: "Action",
          issueNumber: 1,
          copies: 1
        });
        
        if (comic.serials && comic.serials.length > 0) {
          logTest("Comic Service - Create Comic", true);
          console.log(`   Title: ${comic.title}`);
          console.log(`   Serials: ${comic.serials.join(", ")}`);
          console.log(`   Pages: ${comic.pages.length}`);
        } else {
          logTest("Comic Service - Create Comic", false, "No serials");
        }
        
        // Cleanup
        fs.unlinkSync(coverPath);
        pages.forEach(page => fs.unlinkSync(page));
      } catch (error) {
        logTest("Comic Service - Create Comic", false, error.message);
      }
    } else {
      console.log("\n⏭️  Test 11: Skipped (No collection created)");
    }
    
    // Test 12: Retrieve Content from IPFS
    if (comicMetadataHash) {
      console.log("\n📥 Test 12: Retrieve Content from IPFS");
      try {
        const content = await ipfsService.getContent(comicMetadataHash);
        
        if (content && typeof content === 'object') {
          logTest("Retrieve Content from IPFS", true);
          console.log(`   Retrieved: ${JSON.stringify(content).substring(0, 100)}...`);
        } else {
          logTest("Retrieve Content from IPFS", false, "Invalid content");
        }
      } catch (error) {
        logTest("Retrieve Content from IPFS", false, error.message);
      }
    } else {
      console.log("\n⏭️  Test 12: Skipped (No metadata uploaded)");
    }
    
  } catch (error) {
    console.error("\n❌ Critical error in test suite:", error);
  }
  
  // Print Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Summary");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
  }
  
  console.log("\n" + "=".repeat(60));
  
  // Cleanup test directory
  const testDir = path.join(process.cwd(), "tests", "test-files");
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error("\n💥 Test suite crashed:", error);
  process.exit(1);
});
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import hederaService from '../src/services/hederaService.js';
import ipfsService from '../src/services/ipfsService.js';
import comicService from '../src/services/comicService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test data
const testData = {
  collection: {
    name: 'Test Comic Collection',
    symbol: 'TESTCOMIC',
    description: 'A test comic collection for Comic Pad',
    genre: 'Superhero',
    creatorName: 'Test Creator',
    creatorWallet: process.env.HEDERA_ACCOUNT_ID,
    maxSupply: 100,
    royaltyPercentage: 5,
    price: 10,
    tags: ['test', 'superhero', 'action']
  }
};

// Helper function to create test images
function createTestImage(text, width = 800, height = 1200) {
  // Simple SVG test image
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#2c3e50"/>
      <text x="50%" y="50%" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;
  return Buffer.from(svg);
}

async function runCompleteTest() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 COMIC PAD COMPLETE INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');

  try {
    // ========================================
    // STEP 1: Check Environment
    // ========================================
    console.log('🔍 Step 1: Checking environment...\n');
    
    const requiredVars = [
      'HEDERA_ACCOUNT_ID',
      'HEDERA_PRIVATE_KEY',
      'PINATA_API_KEY',
      'PINATA_SECRET_KEY'
    ];

    let missingVars = [];
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value.includes('your_') || value.includes('YOUR_')) {
        missingVars.push(varName);
        console.log(`❌ ${varName}: Not configured`);
      } else {
        if (varName.includes('KEY') || varName.includes('PRIVATE')) {
          console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
        } else {
          console.log(`✅ ${varName}: ${value}`);
        }
      }
    });

    if (missingVars.length > 0) {
      console.log('\n❌ Missing required environment variables:');
      missingVars.forEach(v => console.log(`   - ${v}`));
      console.log('\n💡 Fix: Run `node check-env.js` for detailed instructions\n');
      return {
        success: false,
        error: 'Missing environment variables',
        missingVars
      };
    }

    console.log('\n✅ All environment variables configured\n');

    // ========================================
    // STEP 2: Initialize Services
    // ========================================
    console.log('📡 Step 2: Initializing services...\n');
    
    try {
      await hederaService.initialize();
      console.log('✅ Hedera service initialized');
    } catch (error) {
      console.error('❌ Hedera initialization failed:', error.message);
      throw error;
    }

    try {
      await ipfsService.initialize();
      const status = ipfsService.getStatus();
      console.log('✅ IPFS service initialized');
      console.log('   Pinata:', status.pinataConfigured ? '✓' : '✗');
      console.log('   Web3.Storage:', status.web3Configured ? '✓' : '✗');
    } catch (error) {
      console.error('❌ IPFS initialization failed:', error.message);
      throw error;
    }

    console.log('\n✅ All services initialized\n');

    // ========================================
    // STEP 3: Test IPFS Upload
    // ========================================
    console.log('📦 Step 3: Testing IPFS upload...\n');
    
    try {
      // Test metadata upload
      const testMetadata = {
        name: 'Test Upload',
        description: 'Testing IPFS service',
        timestamp: new Date().toISOString()
      };

      const metadataResult = await ipfsService.uploadMetadata(testMetadata, 'test-metadata.json');
      console.log('✅ Metadata uploaded to IPFS');
      console.log(`   Hash: ${metadataResult.hash}`);
      console.log(`   URL: ${metadataResult.url}`);
      console.log(`   Size: ${metadataResult.size} bytes\n`);

      // Test image upload
      const testImage = createTestImage('TEST IMAGE');
      const imageResult = await ipfsService.uploadToPinata(testImage, 'test-cover.jpg', {
        type: 'test-cover',
        uploadedBy: process.env.HEDERA_ACCOUNT_ID
      });

      console.log('✅ Image uploaded to IPFS');
      console.log(`   Hash: ${imageResult.hash}`);
      console.log(`   URL: ${imageResult.url}\n`);

    } catch (error) {
      console.error('❌ IPFS upload test failed:', error.message);
      
      if (error.response?.status === 401) {
        console.log('\n💡 This is a Pinata authentication error.');
        console.log('   Your API keys may be invalid or expired.');
        console.log('   Get new keys at: https://app.pinata.cloud/developers/api-keys\n');
      }
      
      throw error;
    }

    // ========================================
    // STEP 4: Test Hedera Operations
    // ========================================
    console.log('⚡ Step 4: Testing Hedera operations...\n');
    
    try {
      // Get account balance (method is called getBalance, not getAccountBalance)
      const balance = await hederaService.getBalance(process.env.HEDERA_ACCOUNT_ID);
      console.log('✅ Account balance retrieved');
      console.log(`   HBAR: ${balance.hbar}`);
      console.log(`   Tokens: ${balance.tokens?.size || 0} different tokens\n`);

      // Parse HBAR amount (format is "X.XX ℏ" or "X Hbar")
      const hbarAmount = parseFloat(balance.hbar);
      if (!isNaN(hbarAmount) && hbarAmount < 50) {
        console.log('⚠️  WARNING: Low HBAR balance');
        console.log('   You may need more HBAR for collection creation');
        console.log('   Get testnet HBAR: https://portal.hedera.com/faucet\n');
      }

    } catch (error) {
      console.error('❌ Hedera operations test failed:', error.message);
      throw error;
    }

    // ========================================
    // STEP 5: Create Test Collection (Optional)
    // ========================================
    console.log('🎨 Step 5: Collection creation test...\n');
    console.log('⏭️  Skipping actual collection creation to preserve HBAR');
    console.log('   (Uncomment code in test file to test collection creation)\n');

    /*
    // Uncomment this section to test actual collection creation
    try {
      const coverImage = createTestImage('COLLECTION COVER');
      
      const collection = await comicService.createCollection({
        ...testData.collection,
        coverImage
      });

      console.log('✅ Collection created successfully!');
      console.log(`   Token ID: ${collection.tokenId}`);
      console.log(`   Name: ${collection.name}`);
      console.log(`   Symbol: ${collection.symbol}`);
      console.log(`   Explorer: ${collection.explorerUrl}\n`);

    } catch (error) {
      console.error('❌ Collection creation failed:', error.message);
      throw error;
    }
    */

    // ========================================
    // TEST SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('='.repeat(60) + '\n');

    console.log('📝 Test Summary:');
    console.log('   ✓ Environment variables configured');
    console.log('   ✓ Hedera service initialized');
    console.log('   ✓ IPFS service initialized');
    console.log('   ✓ Metadata upload successful');
    console.log('   ✓ Image upload successful');
    console.log('   ✓ Account balance retrieved');
    console.log('   ✓ All services operational\n');

    console.log('🎉 Comic Pad backend is ready to use!\n');
    console.log('💡 Next steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Test the API endpoints');
    console.log('   3. Create your first collection via API\n');

    return {
      success: true,
      message: 'All tests passed',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Run: node check-env.js');
    console.log('   2. Verify your Pinata keys at: https://app.pinata.cloud');
    console.log('   3. Check Hedera account at: https://portal.hedera.com');
    console.log('   4. Review SETUP_GUIDE.md for detailed help\n');
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    // Cleanup
    if (hederaService.close) {
      hederaService.close();
    }
  }
}

// FIXED: Always run the test when this file is executed
console.log('🚀 Starting test workflow...\n');

runCompleteTest()
  .then(result => {
    if (result.success) {
      console.log('✅ Test completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });

export { runCompleteTest };
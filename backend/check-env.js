// Place this file in the root directory: check-env.js
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n' + '='.repeat(60));
console.log('🔍 COMIC PAD ENVIRONMENT CHECK');
console.log('='.repeat(60) + '\n');

// Check if .env file exists
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('\n💡 Create a .env file in the root directory with:');
  console.log(`
HEDERA_ACCOUNT_ID=your_account_id
HEDERA_PRIVATE_KEY=your_private_key
HEDERA_NETWORK=testnet
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
  `);
  process.exit(1);
}

console.log('✅ .env file found\n');

// Required environment variables
const requiredVars = {
  'HEDERA_ACCOUNT_ID': {
    description: 'Your Hedera testnet account ID',
    example: '0.0.1234567',
    getUrl: 'https://portal.hedera.com/'
  },
  'HEDERA_PRIVATE_KEY': {
    description: 'Your Hedera account private key',
    example: '302e020100300506032b657004220420...',
    getUrl: 'https://portal.hedera.com/'
  },
  'PINATA_API_KEY': {
    description: 'Your Pinata API key for IPFS',
    example: 'abc123def456...',
    getUrl: 'https://app.pinata.cloud/developers/api-keys'
  },
  'PINATA_SECRET_KEY': {
    description: 'Your Pinata secret API key',
    example: 'xyz789uvw456...',
    getUrl: 'https://app.pinata.cloud/developers/api-keys'
  }
};

const optionalVars = {
  'HEDERA_NETWORK': {
    description: 'Hedera network (testnet or mainnet)',
    default: 'testnet'
  },
  'PORT': {
    description: 'Server port',
    default: '3000'
  }
};

let allConfigured = true;
let missingVars = [];

// Check required variables
console.log('📋 Required Environment Variables:\n');
for (const [varName, info] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  
  if (!value || value.includes('your_') || value.includes('YOUR_')) {
    console.log(`❌ ${varName}: NOT CONFIGURED`);
    console.log(`   Description: ${info.description}`);
    console.log(`   Example: ${info.example}`);
    console.log(`   Get it at: ${info.getUrl}\n`);
    allConfigured = false;
    missingVars.push(varName);
  } else {
    // Show truncated value for sensitive data
    if (varName.includes('KEY') || varName.includes('PRIVATE')) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }
}

// Check optional variables
console.log('\n📋 Optional Environment Variables:\n');
for (const [varName, info] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`ℹ️  ${varName}: Using default (${info.default})`);
  }
}

console.log('\n' + '='.repeat(60));

if (allConfigured) {
  console.log('✅ ALL REQUIRED VARIABLES CONFIGURED!');
  console.log('='.repeat(60) + '\n');
  console.log('🎉 Your environment is ready!\n');
  console.log('💡 Next steps:');
  console.log('   1. Run tests: npm run test:workflow');
  console.log('   2. Start server: npm run dev\n');
  process.exit(0);
} else {
  console.log('❌ MISSING REQUIRED VARIABLES');
  console.log('='.repeat(60) + '\n');
  console.log('Missing variables:', missingVars.join(', '));
  console.log('\n💡 Fix by adding these to your .env file:\n');
  
  missingVars.forEach(varName => {
    const info = requiredVars[varName];
    console.log(`${varName}=<your_value_here>`);
    console.log(`# Get at: ${info.getUrl}\n`);
  });
  
  process.exit(1);
}

console.log('🔍 Starting debug test...\n');

// Test 1: Check if we can load dotenv
console.log('Step 1: Testing dotenv...');
try {
  await import('dotenv/config');
  console.log('✅ dotenv loaded');
} catch (error) {
  console.error('❌ Failed to load dotenv:', error.message);
  process.exit(1);
}

// Test 2: Check environment variables
console.log('\nStep 2: Checking environment variables...');
console.log('HEDERA_ACCOUNT_ID:', process.env.HEDERA_ACCOUNT_ID || '❌ NOT SET');
console.log('HEDERA_PRIVATE_KEY:', process.env.HEDERA_PRIVATE_KEY ? '✅ SET' : '❌ NOT SET');
console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '✅ SET' : '❌ NOT SET');

// Test 3: Try to load each service individually
console.log('\nStep 3: Testing service imports...\n');

console.log('Testing hederaService...');
try {
  const hederaService = await import('../src/services/hederaService.js');
  console.log('✅ hederaService imported successfully');
} catch (error) {
  console.error('❌ Failed to import hederaService:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\nTesting ipfsService...');
try {
  const ipfsService = await import('../src/services/ipfsService.js');
  console.log('✅ ipfsService imported successfully');
} catch (error) {
  console.error('❌ Failed to import ipfsService:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\nTesting comicService...');
try {
  const comicService = await import('../src/services/comicService.js');
  console.log('✅ comicService imported successfully');
} catch (error) {
  console.error('❌ Failed to import comicService:', error.message);
  console.error('Stack:', error.stack);
}

// Test 4: Check if services exist
console.log('\nStep 4: Checking if service files exist...');
try {
  const fs = await import('fs');
  const path = await import('path');
  
  const servicePath = path.join(process.cwd(), 'src', 'services');
  console.log('Services directory:', servicePath);
  
  const files = fs.readdirSync(servicePath);
  console.log('Files found:', files.join(', '));
} catch (error) {
  console.error('❌ Error checking files:', error.message);
}

console.log('\n✅ Debug test completed');
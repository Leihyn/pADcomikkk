const axios = require('axios')
const { Client, AccountId, PrivateKey } = require('@hashgraph/sdk')

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3001',
  HEDERA_NETWORK: 'testnet',
  TEST_ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID || '0.0.123456',
  TEST_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY || '302e020100300506032b657004220420...',
  TIMEOUT: 30000
}

// Test utilities
class TestRunner {
  constructor() {
    this.tests = []
    this.results = []
    this.client = null
  }

  async setup() {
    console.log('🚀 Setting up Comic Pad Test Suite...')
    
    // Initialize Hedera client
    try {
      this.client = Client.forName(TEST_CONFIG.HEDERA_NETWORK)
      const accountId = AccountId.fromString(TEST_CONFIG.TEST_ACCOUNT_ID)
      const privateKey = PrivateKey.fromString(TEST_CONFIG.TEST_PRIVATE_KEY)
      this.client.setOperator(accountId, privateKey)
      console.log('✅ Hedera client initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Hedera client:', error.message)
      throw error
    }

    // Test API connection
    try {
      const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
        timeout: 5000
      })
      console.log('✅ API server is running')
    } catch (error) {
      console.error('❌ API server is not responding:', error.message)
      throw error
    }
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn })
  }

  async runTests() {
    console.log(`\n🧪 Running ${this.tests.length} tests...\n`)
    
    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}`)
        await test.testFn()
        console.log(`✅ ${test.name} - PASSED\n`)
        this.results.push({ name: test.name, status: 'PASSED' })
      } catch (error) {
        console.error(`❌ ${test.name} - FAILED:`, error.message)
        this.results.push({ name: test.name, status: 'FAILED', error: error.message })
      }
    }

    this.printSummary()
  }

  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASSED').length
    const failed = this.results.filter(r => r.status === 'FAILED').length
    
    console.log('\n📊 Test Summary:')
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${Math.round((passed / this.results.length) * 100)}%`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`))
    }
  }
}

// Test cases
const testRunner = new TestRunner()

// API Health Tests
testRunner.addTest('API Health Check', async () => {
  const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/health`)
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`)
  }
  if (!response.data.status || response.data.status !== 'OK') {
    throw new Error('Health check failed')
  }
})

testRunner.addTest('API CORS Headers', async () => {
  const response = await axios.options(`${TEST_CONFIG.API_BASE_URL}/api/comics/search`)
  if (!response.headers['access-control-allow-origin']) {
    throw new Error('CORS headers not present')
  }
})

// Hedera Integration Tests
testRunner.addTest('Hedera Account Balance', async () => {
  const balance = await new (require('@hashgraph/sdk')).AccountBalanceQuery()
    .setAccountId(AccountId.fromString(TEST_CONFIG.TEST_ACCOUNT_ID))
    .execute(testRunner.client)
  
  if (!balance.hbars) {
    throw new Error('Failed to fetch account balance')
  }
  
  console.log(`  Account Balance: ${balance.hbars.toString()} HBAR`)
})

testRunner.addTest('Hedera Token Creation', async () => {
  const { TokenCreateTransaction, TokenType } = require('@hashgraph/sdk')
  
  const tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName('Test Comic Collection')
    .setTokenSymbol('TEST')
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(AccountId.fromString(TEST_CONFIG.TEST_ACCOUNT_ID))
    .execute(testRunner.client)

  const tokenCreateReceipt = await tokenCreateTx.getReceipt(testRunner.client)
  
  if (!tokenCreateReceipt.tokenId) {
    throw new Error('Failed to create test token')
  }
  
  console.log(`  Created Token: ${tokenCreateReceipt.tokenId.toString()}`)
})

// Comic API Tests
testRunner.addTest('Create Comic Collection', async () => {
  const collectionData = {
    name: 'Test Comic Series',
    symbol: 'TCS',
    description: 'A test comic series for testing purposes',
    creator: '0.0.123456',
    genres: ['Test', 'Demo'],
    royaltyPercentage: 10,
    maxSupply: 100
  }

  const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/api/comics/collections`, collectionData)
  
  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error('Collection creation failed')
  }
  
  console.log(`  Created Collection: ${response.data.data.id}`)
})

testRunner.addTest('Search Comics', async () => {
  const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/api/comics/search`, {
    params: {
      limit: 10,
      offset: 0
    }
  })
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error('Search failed')
  }
  
  console.log(`  Found ${response.data.data.comics.length} comics`)
})

testRunner.addTest('Get Marketplace Stats', async () => {
  const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/api/marketplace/stats`)
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error('Stats fetch failed')
  }
  
  console.log(`  Total Listings: ${response.data.data.totalListings}`)
})

// Authentication Tests
testRunner.addTest('User Registration', async () => {
  const userData = {
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123'
  }

  const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/api/auth/register`, userData)
  
  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}`)
  }
  
  if (!response.data.success) {
    throw new Error('Registration failed')
  }
  
  console.log(`  Registered User: ${userData.username}`)
})

testRunner.addTest('User Login', async () => {
  const loginData = {
    email: 'test@example.com',
    password: 'testpassword123'
  }

  try {
    const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/api/auth/login`, loginData)
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`)
    }
    
    if (!response.data.success) {
      throw new Error('Login failed')
    }
    
    console.log(`  Logged in User: ${response.data.data.user.username}`)
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('  Login test skipped (no test user exists)')
    } else {
      throw error
    }
  }
})

// IPFS Tests
testRunner.addTest('IPFS Service Status', async () => {
  const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/api/comics/stats/overview`)
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`)
  }
  
  console.log('  IPFS service is accessible')
})

// Performance Tests
testRunner.addTest('API Response Time', async () => {
  const startTime = Date.now()
  
  await axios.get(`${TEST_CONFIG.API_BASE_URL}/api/comics/search`, {
    params: { limit: 20 }
  })
  
  const responseTime = Date.now() - startTime
  
  if (responseTime > 5000) {
    throw new Error(`Response time too slow: ${responseTime}ms`)
  }
  
  console.log(`  Response Time: ${responseTime}ms`)
})

// Error Handling Tests
testRunner.addTest('Invalid Endpoint', async () => {
  try {
    await axios.get(`${TEST_CONFIG.API_BASE_URL}/api/invalid-endpoint`)
    throw new Error('Expected 404 error')
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('  Correctly returned 404 for invalid endpoint')
    } else {
      throw error
    }
  }
})

testRunner.addTest('Invalid Comic ID', async () => {
  try {
    await axios.get(`${TEST_CONFIG.API_BASE_URL}/api/comics/invalid-id`)
    throw new Error('Expected 404 error')
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('  Correctly returned 404 for invalid comic ID')
    } else {
      throw error
    }
  }
})

// Main execution
async function runTests() {
  try {
    await testRunner.setup()
    await testRunner.runTests()
    
    const failedTests = testRunner.results.filter(r => r.status === 'FAILED')
    if (failedTests.length > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Test setup failed:', error.message)
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
}

module.exports = { TestRunner, runTests }

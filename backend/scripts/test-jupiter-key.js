/**
 * Test Jupiter API Key
 * Quick test to verify Jupiter API key works with both Basic and Ultra endpoints
 */

const axios = require('axios');

// Load env from backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const API_KEY = process.env.JUPITER_API_KEY;
const BASIC_API = process.env.JUPITER_API_URL || 'https://api.jup.ag';
const ULTRA_API = process.env.JUPITER_ULTRA_API_URL || 'https://api.jup.ag/ultra';

// Common Solana token mints for testing
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

console.log('🧪 Testing Jupiter API Key...\n');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : '❌ NOT SET');
console.log('Basic API:', BASIC_API);
console.log('Ultra API:', ULTRA_API);
console.log('');

async function testUltraSearch() {
    console.log('📍 Test 1: Ultra API - Search Tokens');
    try {
        const response = await axios.get(`${ULTRA_API}/v1/search`, {
            params: { query: 'SOL' },
            headers: { 'x-api-key': API_KEY }
        });

        console.log('✅ SUCCESS - Found', response.data.tokens?.length || 0, 'tokens');
        if (response.data.tokens?.[0]) {
            console.log('   Example:', response.data.tokens[0].symbol, '-', response.data.tokens[0].name);
        }
        return true;
    } catch (error) {
        console.log('❌ FAILED:', error.response?.status, error.response?.statusText);
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testUltraShield() {
    console.log('\n📍 Test 2: Ultra API - Token Security Check (Shield)');
    try {
        const response = await axios.get(`${ULTRA_API}/v1/shield`, {
            params: { mints: `${SOL_MINT},${USDC_MINT}` },
            headers: { 'x-api-key': API_KEY }
        });

        console.log('✅ SUCCESS - Checked', Object.keys(response.data.tokens || {}).length, 'tokens');
        const solData = response.data.tokens?.[SOL_MINT];
        if (solData) {
            console.log('   SOL verified:', solData.isVerified);
        }
        return true;
    } catch (error) {
        console.log('❌ FAILED:', error.response?.status, error.response?.statusText);
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testPrice() {
    console.log('\n📍 Test 3: Price API - Get SOL Price');
    try {
        const response = await axios.get('https://price.jup.ag/v4/price', {
            params: { ids: SOL_MINT }
        });

        const price = response.data.data?.[SOL_MINT]?.price;
        console.log('✅ SUCCESS - SOL Price: $' + price);
        return true;
    } catch (error) {
        console.log('❌ FAILED:', error.response?.status, error.response?.statusText);
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function runTests() {
    if (!API_KEY) {
        console.log('\n❌ ERROR: JUPITER_API_KEY not set in .env file\n');
        process.exit(1);
    }

    const results = [];

    results.push(await testUltraSearch());
    results.push(await testUltraShield());
    results.push(await testPrice());

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Results: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('✅ Jupiter API Key is working correctly!');
    } else {
        console.log('⚠️  Some tests failed - check API key and network');
    }
    console.log('='.repeat(50));
}

runTests();

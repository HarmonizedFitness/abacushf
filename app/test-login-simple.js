const http = require('http');
const https = require('https');
const querystring = require('querystring');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLogin() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🔍 Testing login functionality...');
    
    // Test 1: Check if login page loads
    console.log('\n1. Testing login page access...');
    const loginPageResponse = await makeRequest(`${baseUrl}/login`);
    
    if (loginPageResponse.statusCode === 200) {
      console.log('✅ Login page loads successfully');
    } else {
      console.log('❌ Login page failed to load:', loginPageResponse.statusCode);
      return;
    }
    
    // Test 2: Test authentication endpoint
    console.log('\n2. Testing authentication endpoint...');
    const authData = querystring.stringify({
      email: 'john@doe.com',
      password: 'johndoe123'
    });
    
    const authResponse = await makeRequest(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': authData.length
      },
      body: authData
    });
    
    console.log('Auth response status:', authResponse.statusCode);
    
    if (authResponse.statusCode === 302) {
      const location = authResponse.headers.location;
      console.log('Redirect location:', location);
      
      if (location && location.includes('localhost:3000')) {
        console.log('✅ Authentication processed successfully (redirecting to localhost)');
      } else {
        console.log('❌ Authentication failed - redirecting to external URL');
      }
    } else {
      console.log('❌ Unexpected auth response status:', authResponse.statusCode);
    }
    
    // Test 3: Test session endpoint
    console.log('\n3. Testing session endpoint...');
    const sessionResponse = await makeRequest(`${baseUrl}/api/auth/session`);
    
    console.log('Session response status:', sessionResponse.statusCode);
    if (sessionResponse.statusCode === 200) {
      console.log('✅ Session endpoint accessible');
    } else {
      console.log('❌ Session endpoint failed:', sessionResponse.statusCode);
    }
    
    console.log('\n🎉 Login functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
  }
}

testLogin();

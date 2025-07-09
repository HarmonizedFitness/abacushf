const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');

async function testLogin() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Step 1: Get the login page to extract CSRF token
    console.log('1. Getting login page...');
    const loginResponse = await fetch(`${baseUrl}/login`);
    const loginHtml = await loginResponse.text();
    
    // Step 2: Extract CSRF token from the page
    const csrfMatch = loginHtml.match(/name="csrfToken" value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;
    
    if (!csrfToken) {
      console.log('❌ Could not find CSRF token in login page');
      return;
    }
    
    console.log('✅ CSRF token found');
    
    // Step 3: Submit login credentials
    console.log('2. Submitting login credentials...');
    const loginData = new URLSearchParams({
      email: 'john@doe.com',
      password: 'johndoe123',
      csrfToken: csrfToken,
      json: 'true'
    });
    
    const authResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData.toString(),
      redirect: 'manual'
    });
    
    console.log('Auth response status:', authResponse.status);
    console.log('Auth response headers:', Object.fromEntries(authResponse.headers));
    
    if (authResponse.status === 302) {
      console.log('✅ Login attempt processed (302 redirect received)');
      const location = authResponse.headers.get('location');
      console.log('Redirect location:', location);
      
      // Check if the redirect is to a success page or error page
      if (location && location.includes('/dashboard')) {
        console.log('✅ Login successful - redirecting to dashboard');
      } else if (location && location.includes('/login')) {
        console.log('❌ Login failed - redirecting back to login');
      } else {
        console.log('⚠️  Unexpected redirect location:', location);
      }
    } else {
      console.log('❌ Unexpected response status:', authResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
  }
}

testLogin();

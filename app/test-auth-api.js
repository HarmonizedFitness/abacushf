const axios = require('axios');

async function testAuth() {
  try {
    console.log('=== TESTING AUTHENTICATION API ===\n');
    
    // Test client login
    console.log('Testing client login: alice@fitness.com');
    const clientResponse = await axios.post('http://localhost:3000/api/auth/callback/credentials', {
      email: 'alice@fitness.com',
      password: 'password123',
      csrfToken: 'test'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Client login status:', clientResponse.status);
    console.log('Client login response:', clientResponse.data);
    
    // Test admin login
    console.log('\nTesting admin login: john@doe.com');
    const adminResponse = await axios.post('http://localhost:3000/api/auth/callback/credentials', {
      email: 'john@doe.com',
      password: 'johndoe123',
      csrfToken: 'test'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Admin login status:', adminResponse.status);
    console.log('Admin login response:', adminResponse.data);
    
  } catch (error) {
    console.error('Error testing auth:', error.response?.data || error.message);
  }
}

testAuth();

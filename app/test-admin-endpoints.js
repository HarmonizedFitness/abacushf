
const fetch = require('node-fetch');

// Test admin endpoints for accurate data
async function testAdminEndpoints() {
  const baseUrl = 'http://localhost:3000';
  const hamzaId = 'cmcxv0sq90000sdb5uecjqpks';
  
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'john@doe.com',
        password: 'johndoe123',
        callbackUrl: `${baseUrl}/admin/dashboard`,
        json: 'true'
      }),
      redirect: 'manual'
    });
    
    console.log('Login response status:', loginResponse.status);
    
    // Get cookies from login
    const cookies = loginResponse.headers.get('set-cookie') || '';
    console.log('Cookies received:', cookies ? 'Yes' : 'No');
    
    // Test 1: Client details endpoint - Check credits calculation
    console.log('\n📊 Testing client details endpoint...');
    const clientResponse = await fetch(`${baseUrl}/api/admin/clients/${hamzaId}`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log('✅ Client details response:');
      console.log('  - Name:', clientData.data?.name);
      console.log('  - Remaining Credits:', clientData.data?.remainingCredits);
      console.log('  - Total Workouts:', clientData.data?._count?.workoutSessions);
    } else {
      console.log('❌ Client details failed:', clientResponse.status);
      const errorText = await clientResponse.text();
      console.log('Error:', errorText);
    }
    
    // Test 2: Personal Records endpoint - Check PRs
    console.log('\n🏆 Testing personal records endpoint...');
    const prResponse = await fetch(`${baseUrl}/api/admin/clients/${hamzaId}/records?calculate=true`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (prResponse.ok) {
      const prData = await prResponse.json();
      console.log('✅ Personal Records response:');
      console.log('  - Total PRs:', prData.data?.length);
      console.log('  - Calculated PRs:', prData.calculated?.totalCalculatedPRs);
      
      // Look for Bench Press and Incline Bench Press specifically
      const benchPress = prData.data?.find(pr => pr.exercise?.name?.toLowerCase().includes('bench press') && !pr.exercise?.name?.toLowerCase().includes('incline'));
      const inclineBench = prData.data?.find(pr => pr.exercise?.name?.toLowerCase().includes('incline bench'));
      
      if (benchPress) {
        console.log('  - Bench Press Weight PR:', benchPress.weight || benchPress.calculated?.maxWeight?.weight, 'lbs');
      }
      if (inclineBench) {
        console.log('  - Incline Bench Weight PR:', inclineBench.weight || inclineBench.calculated?.maxWeight?.weight, 'lbs');
      }
    } else {
      console.log('❌ Personal Records failed:', prResponse.status);
      const errorText = await prResponse.text();
      console.log('Error:', errorText);
    }
    
    // Test 3: Progress endpoint - Check if it exists and works
    console.log('\n📈 Testing progress endpoint...');
    const progressResponse = await fetch(`${baseUrl}/api/admin/clients/${hamzaId}/progress`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    console.log('Progress endpoint status:', progressResponse.status);
    if (progressResponse.ok) {
      const progressData = await progressResponse.json();
      console.log('✅ Progress response:');
      console.log('  - Progress entries:', progressData.data?.length);
    } else {
      console.log('❌ Progress endpoint failed or missing');
    }
    
    // Test 4: Workouts endpoint - Check display names
    console.log('\n📋 Testing workouts endpoint...');
    const workoutsResponse = await fetch(`${baseUrl}/api/admin/clients/${hamzaId}/workouts?limit=5`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (workoutsResponse.ok) {
      const workoutsData = await workoutsResponse.json();
      console.log('✅ Workouts response:');
      console.log('  - Total workouts:', workoutsData.pagination?.total);
      console.log('  - Sample workout:');
      if (workoutsData.data?.[0]) {
        console.log('    - ID:', workoutsData.data[0].id);
        console.log('    - Date:', workoutsData.data[0].date);
        console.log('    - Exercise count:', workoutsData.data[0].exercises?.length || 0);
      }
    } else {
      console.log('❌ Workouts failed:', workoutsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminEndpoints();

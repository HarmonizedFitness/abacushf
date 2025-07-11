
const fetch = require('node-fetch');

async function testAPIFixes() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 TESTING API FIXES...\n');
  
  try {
    // Test Personal Records API with calculate=true
    console.log('📊 TESTING PERSONAL RECORDS API...');
    const prResponse = await fetch(`${baseURL}/api/personal-records?calculate=true`, {
      headers: {
        'Cookie': 'next-auth.session-token=fake-token-for-testing' // This won't work for real auth
      }
    });
    
    if (prResponse.ok) {
      const prData = await prResponse.json();
      console.log('✅ Personal Records API Response:');
      console.log(`   - Success: ${prData.success}`);
      console.log(`   - Records Count: ${prData.data?.length || 0}`);
      console.log(`   - Calculated PRs: ${prData.calculated?.totalCalculatedPRs || 0}`);
      console.log(`   - Total Lifetime Volume: ${prData.calculated?.statistics?.totalLifetimeVolume || 0}`);
      
      if (prData.data && prData.data.length > 0) {
        console.log('\n   Sample Records:');
        prData.data.slice(0, 3).forEach(record => {
          console.log(`   - ${record.exercise?.name}: ${record.weight}lbs × ${record.reps} reps, Volume: ${record.volume}`);
        });
      }
    } else {
      console.log('❌ Personal Records API failed:', prResponse.status);
    }
    
    // Test Credits API
    console.log('\n💳 TESTING CREDITS API...');
    const creditsResponse = await fetch(`${baseURL}/api/credits`, {
      headers: {
        'Cookie': 'next-auth.session-token=fake-token-for-testing' // This won't work for real auth
      }
    });
    
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log('✅ Credits API Response:');
      console.log(`   - Success: ${creditsData.success}`);
      console.log(`   - Remaining Credits: ${creditsData.data?.remainingCredits || 0}`);
      console.log(`   - Total Purchased: ${creditsData.data?.totalPurchased || 0}`);
      console.log(`   - Total Used (Workouts): ${creditsData.data?.totalUsed || 0}`);
      console.log(`   - Completed Workouts: ${creditsData.data?.completedWorkouts || 0}`);
      
      if (creditsData.data?.verification) {
        console.log('\n   Verification:');
        console.log(`   - Bookings Method: ${creditsData.data.verification.remainingCreditsFromBookings}`);
        console.log(`   - Workouts Method: ${creditsData.data.verification.remainingCreditsFromWorkouts}`);
        console.log(`   - Legacy Method: ${creditsData.data.verification.legacyRemainingCredits}`);
        console.log(`   - Discrepancy: ${creditsData.data.verification.discrepancy}`);
      }
    } else {
      console.log('❌ Credits API failed:', creditsResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Error testing APIs:', error.message);
    console.log('\n📝 Note: API testing requires authentication, but we can check server responses');
  }
  
  // Test that the server is running and responsive
  console.log('\n🌐 TESTING SERVER CONNECTIVITY...');
  try {
    const homeResponse = await fetch(`${baseURL}/`);
    if (homeResponse.ok) {
      console.log('✅ Server is running and responsive');
      console.log(`   - Status: ${homeResponse.status}`);
      console.log(`   - URL: ${baseURL}`);
    } else {
      console.log(`❌ Server response error: ${homeResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Server connectivity error:', error.message);
  }
}

testAPIFixes();

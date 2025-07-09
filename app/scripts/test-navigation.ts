
async function testRoute(url: string, expectedStatus: number = 200): Promise<boolean> {
  try {
    // Disable automatic redirect following to see actual response codes
    const response = await fetch(url, { redirect: 'manual' })
    const success = response.status === expectedStatus
    
    console.log(`${success ? '✅' : '❌'} ${url} - ${response.status} ${success ? '(Expected)' : `(Expected ${expectedStatus})`}`)
    
    return success
  } catch (error) {
    console.log(`❌ ${url} - ERROR: ${error}`)
    return false
  }
}

async function testNavigationLinks() {
  console.log('🔗 Testing Navigation Links...')
  
  const baseUrl = 'http://localhost:3000'
  const results: boolean[] = []
  
  // Test public routes (should return 200)
  const publicRoutes = [
    '/',
    '/login',
    '/signup'
  ]
  
  console.log('\n📄 Public Routes:')
  for (const route of publicRoutes) {
    const result = await testRoute(`${baseUrl}${route}`, 200)
    results.push(result)
  }
  
  // Test protected routes (should return 307 redirect for unauthenticated users)
  const protectedRoutes = [
    '/dashboard',
    '/credits',
    '/exercises',
    '/workouts',
    '/workouts/new',
    '/personal-records',
    '/schedule'
  ]
  
  console.log('\n🔒 Protected Client Routes (expecting 307 redirect):')
  for (const route of protectedRoutes) {
    const result = await testRoute(`${baseUrl}${route}`, 307)
    results.push(result)
  }
  
  // Test admin routes (should return 307 redirect for unauthenticated users)
  const adminRoutes = [
    '/admin/dashboard',
    '/admin/analytics',
    '/admin/bookings',
    '/admin/calendar',
    '/admin/clients',
    '/admin/clients/new',
    '/admin/exercises',
    '/admin/exercises/new',
    '/admin/workouts',
    '/admin/workouts/new'
  ]
  
  console.log('\n👑 Admin Routes (expecting 307 redirect):')
  for (const route of adminRoutes) {
    const result = await testRoute(`${baseUrl}${route}`, 307)
    results.push(result)
  }
  
  // Test API routes (should return 401 for unauthenticated users)
  const apiRoutes = [
    '/api/exercises',
    '/api/workouts',
    '/api/bookings',
    '/api/credits',
    '/api/personal-records',
    '/api/notifications',
    '/api/admin/analytics',
    '/api/admin/clients',
    '/api/admin/bookings'
  ]
  
  console.log('\n🔌 API Routes (expecting 401 unauthorized):')
  for (const route of apiRoutes) {
    const result = await testRoute(`${baseUrl}${route}`, 401)
    results.push(result)
  }
  
  // Test non-existent routes (should return 404)
  const nonExistentRoutes = [
    '/nonexistent',
    '/admin/nonexistent',
    '/api/nonexistent'
  ]
  
  console.log('\n🚫 Non-existent Routes (expecting 404):')
  for (const route of nonExistentRoutes) {
    const result = await testRoute(`${baseUrl}${route}`, 404)
    results.push(result)
  }
  
  const passedTests = results.filter(Boolean).length
  const totalTests = results.length
  
  console.log(`\n📊 Navigation Test Results: ${passedTests}/${totalTests} passed`)
  
  return passedTests === totalTests
}

async function testStaticAssets() {
  console.log('\n🎨 Testing Static Assets...')
  
  const baseUrl = 'http://localhost:3000'
  const results: boolean[] = []
  
  // Test that pages load their CSS and JS properly
  const pageTests = [
    { url: '/', description: 'Home page loads' },
    { url: '/login', description: 'Login page loads' },
    { url: '/signup', description: 'Signup page loads' }
  ]
  
  for (const test of pageTests) {
    try {
      const response = await fetch(`${baseUrl}${test.url}`)
      const html = await response.text()
      
      // Check if CSS is loaded
      const hasCss = html.includes('/_next/static/css/') || html.includes('stylesheet')
      
      // Check if JS is loaded
      const hasJs = html.includes('/_next/static/chunks/') || html.includes('script')
      
      const success = response.status === 200 && hasCss && hasJs
      
      console.log(`${success ? '✅' : '❌'} ${test.description} - CSS: ${hasCss ? '✅' : '❌'} JS: ${hasJs ? '✅' : '❌'}`)
      
      results.push(success)
    } catch (error) {
      console.log(`❌ ${test.description} - ERROR: ${error}`)
      results.push(false)
    }
  }
  
  const passedTests = results.filter(Boolean).length
  const totalTests = results.length
  
  console.log(`\n📊 Static Assets Test Results: ${passedTests}/${totalTests} passed`)
  
  return passedTests === totalTests
}

async function runNavigationTests() {
  console.log('🚀 Starting Navigation and Link Testing...\n')
  
  const results = {
    navigationLinks: await testNavigationLinks(),
    staticAssets: await testStaticAssets()
  }
  
  console.log('\n📊 Overall Test Results:')
  console.log(`- Navigation Links: ${results.navigationLinks ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`- Static Assets: ${results.staticAssets ? '✅ PASS' : '❌ FAIL'}`)
  
  const allPassed = Object.values(results).every(Boolean)
  console.log(`\n🎯 Navigation Test Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  
  return allPassed
}

// Run the tests
runNavigationTests().catch(console.error)

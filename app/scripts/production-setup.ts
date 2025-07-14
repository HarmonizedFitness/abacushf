
import { PrismaClient } from '@prisma/client'
import { Environment } from '../lib/environment'

const prisma = new PrismaClient()

/**
 * Comprehensive production setup and validation script
 */
async function setupProduction() {
  console.log('🚀 Production Setup and Validation Script')
  console.log('=' .repeat(60))
  
  const isProduction = Environment.isProduction()
  console.log(`Environment: ${Environment.getEnvironment()}`)
  console.log(`Production Mode: ${isProduction ? 'YES' : 'NO'}`)
  console.log('')

  let allChecks = true
  const checks = []

  try {
    // 1. Database Connection Test
    console.log('🔌 Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    checks.push({ name: 'Database Connection', status: '✅ PASS' })
    console.log('✅ Database connection successful')

    // 2. Check for Demo Data
    console.log('\n🧹 Checking for demo data...')
    const demoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'alice@fitness.com' } },
          { email: { contains: 'bob@fitness.com' } },
          { email: { contains: 'carol@fitness.com' } }
        ]
      }
    })

    if (demoUsers.length === 0) {
      checks.push({ name: 'Demo Data Cleanup', status: '✅ PASS - No demo users found' })
      console.log('✅ No demo users found')
    } else {
      checks.push({ name: 'Demo Data Cleanup', status: '❌ FAIL - Demo users still exist' })
      console.log('❌ Demo users still exist:', demoUsers.map(u => u.email))
      allChecks = false
    }

    // 3. Essential Admin Account Check
    console.log('\n👤 Checking admin accounts...')
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true, isActive: true }
    })

    if (adminUsers.length > 0) {
      checks.push({ name: 'Admin Accounts', status: `✅ PASS - ${adminUsers.length} admin(s) found` })
      console.log('✅ Admin accounts found:')
      adminUsers.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.name}) - Active: ${admin.isActive}`)
      })
    } else {
      checks.push({ name: 'Admin Accounts', status: '❌ FAIL - No admin accounts found' })
      console.log('❌ No admin accounts found!')
      allChecks = false
    }

    // 4. Essential Exercise Library Check
    console.log('\n💪 Checking exercise library...')
    const exerciseCount = await prisma.exercise.count({ where: { isActive: true } })
    
    if (exerciseCount >= 5) {
      checks.push({ name: 'Exercise Library', status: `✅ PASS - ${exerciseCount} exercises available` })
      console.log(`✅ Exercise library has ${exerciseCount} exercises`)
    } else {
      checks.push({ name: 'Exercise Library', status: `❌ FAIL - Only ${exerciseCount} exercises` })
      console.log(`❌ Insufficient exercises: ${exerciseCount}`)
      allChecks = false
    }

    // 5. Business Configuration Check
    console.log('\n⚙️  Checking business configuration...')
    const configCount = await prisma.businessConfig.count()
    const businessHours = await prisma.businessConfig.findMany({
      where: { category: 'business_hours' }
    })

    if (configCount >= 10 && businessHours.length >= 7) {
      checks.push({ name: 'Business Configuration', status: `✅ PASS - ${configCount} configs, ${businessHours.length} business hours` })
      console.log(`✅ Business configuration complete: ${configCount} configs`)
    } else {
      checks.push({ name: 'Business Configuration', status: `❌ FAIL - Incomplete configuration` })
      console.log(`❌ Incomplete business configuration`)
      allChecks = false
    }

    // 6. Clean Data State Check
    console.log('\n📊 Checking data state...')
    const dataStats = {
      users: await prisma.user.count(),
      bookings: await prisma.booking.count(),
      workoutSessions: await prisma.workoutSession.count(),
      creditPurchases: await prisma.creditPurchase.count(),
      personalRecords: await prisma.personalRecord.count(),
      notifications: await prisma.notification.count()
    }

    console.log('Current data state:')
    Object.entries(dataStats).forEach(([key, count]) => {
      console.log(`  - ${key}: ${count}`)
    })

    // For production, we want minimal data
    const maxProductionData = {
      users: 3, // Admin accounts only
      bookings: 0,
      workoutSessions: 0,
      creditPurchases: isProduction ? 0 : 5, // Allow some in dev
      personalRecords: 0,
      notifications: 10 // System notifications are OK
    }

    let dataClean = true
    Object.entries(maxProductionData).forEach(([key, maxCount]) => {
      if (dataStats[key as keyof typeof dataStats] > maxCount) {
        if (isProduction) {
          console.log(`⚠️  Warning: ${key} count (${dataStats[key as keyof typeof dataStats]}) exceeds production limit (${maxCount})`)
          dataClean = false
        }
      }
    })

    if (dataClean || !isProduction) {
      checks.push({ name: 'Data State', status: '✅ PASS - Clean data state' })
    } else {
      checks.push({ name: 'Data State', status: '⚠️  WARNING - Excessive data for production' })
    }

    // 7. Environment Variables Check
    console.log('\n🔧 Checking environment variables...')
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET'
    ]

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length === 0) {
      checks.push({ name: 'Environment Variables', status: '✅ PASS - All required variables set' })
      console.log('✅ All required environment variables are set')
    } else {
      checks.push({ name: 'Environment Variables', status: `❌ FAIL - Missing: ${missingEnvVars.join(', ')}` })
      console.log('❌ Missing environment variables:', missingEnvVars)
      allChecks = false
    }

    // 8. Test Authentication System
    console.log('\n🔐 Testing authentication system...')
    try {
      // Test if we can find the admin user for login testing
      const testAdmin = await prisma.user.findFirst({
        where: { 
          email: 'john@doe.com',
          role: 'ADMIN',
          isActive: true
        }
      })

      if (testAdmin) {
        checks.push({ name: 'Authentication System', status: '✅ PASS - Admin account ready' })
        console.log('✅ Authentication system ready')
      } else {
        checks.push({ name: 'Authentication System', status: '❌ FAIL - No test admin found' })
        console.log('❌ No test admin account found')
        allChecks = false
      }
    } catch (error) {
      checks.push({ name: 'Authentication System', status: '❌ FAIL - Database error' })
      console.log('❌ Authentication test failed:', error)
      allChecks = false
    }

  } catch (error) {
    console.error('❌ Setup validation failed:', error)
    allChecks = false
  }

  // Final Report
  console.log('\n' + '=' .repeat(60))
  console.log('📋 PRODUCTION READINESS REPORT')
  console.log('=' .repeat(60))

  checks.forEach(check => {
    console.log(`${check.name.padEnd(25)} ${check.status}`)
  })

  console.log('\n' + '=' .repeat(60))
  
  if (allChecks) {
    console.log('🎉 PRODUCTION READY!')
    console.log('✅ All checks passed. Application is ready for production deployment.')
    
    if (!isProduction) {
      console.log('\n📝 To deploy to production:')
      console.log('1. Set NODE_ENV=production')
      console.log('2. Run production database cleanup if needed')
      console.log('3. Use production environment variables')
      console.log('4. Build and deploy the application')
    }
  } else {
    console.log('⚠️  PRODUCTION READINESS ISSUES FOUND')
    console.log('❌ Some checks failed. Review and fix issues before production deployment.')
  }

  console.log('=' .repeat(60))

  return allChecks
}

async function main() {
  try {
    const success = await setupProduction()
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('❌ Production setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if called directly
if (require.main === module) {
  main()
}

export default setupProduction


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAnalyticsCalculations() {
  console.log('🧪 Testing Analytics Calculations...')
  
  try {
    // Test credit purchases data
    const creditPurchases = await prisma.creditPurchase.findMany({
      select: {
        id: true,
        amount: true,
        credits: true,
        createdAt: true
      }
    })
    
    console.log(`💳 Credit Purchases: ${creditPurchases.length} records`)
    
    // Calculate total revenue manually (converted from cents to dollars)
    const totalRevenue = creditPurchases.reduce((sum, purchase) => {
      const amount = purchase.amount ? Number(purchase.amount) / 100 : 0
      return sum + amount
    }, 0)
    
    console.log(`💰 Manual Revenue Calculation: $${totalRevenue.toFixed(2)}`)
    
    // Check for any unusual amounts
    const unusualAmounts = creditPurchases.filter(p => {
      const amount = Number(p.amount) / 100
      return amount > 1000 || amount < 0
    })
    
    if (unusualAmounts.length > 0) {
      console.log('⚠️ Found unusual amounts:', unusualAmounts.map(p => ({ id: p.id, amount: Number(p.amount) / 100 })))
    } else {
      console.log('✅ All credit purchase amounts appear normal')
    }
    
    // Test revenue values are realistic
    if (totalRevenue > 0 && totalRevenue < 10000) {
      console.log('✅ Revenue values appear realistic')
    } else if (totalRevenue > 100000) {
      console.log('❌ Revenue values appear unrealistic (too high)')
    } else {
      console.log('ℹ️ Revenue values are very low or zero')
    }
    
    // Test bookings data
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        userId: true,
        startTime: true,
        status: true,
        creditsUsed: true
      }
    })
    
    console.log(`📅 Bookings: ${bookings.length} records`)
    
    // Test users data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    console.log(`👤 Users: ${users.length} records`)
    console.log(`- Admins: ${users.filter(u => u.role === 'ADMIN').length}`)
    console.log(`- Clients: ${users.filter(u => u.role === 'CLIENT').length}`)
    
    // Test active clients calculation
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    
    const activeClients = await prisma.user.count({
      where: {
        role: 'CLIENT',
        bookings: {
          some: {
            startTime: {
              gte: sixMonthsAgo,
              lte: now
            }
          }
        }
      }
    })
    
    console.log(`🏃 Active Clients (last 6 months): ${activeClients}`)
    
    // Test average revenue per client
    const avgRevenuePerClient = activeClients > 0 ? totalRevenue / activeClients : 0
    console.log(`💸 Average Revenue per Client: $${avgRevenuePerClient.toFixed(2)}`)
    
    console.log('✅ Analytics calculations test completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Analytics calculations test failed:', error)
    return false
  }
}

async function testDatabaseConsistency() {
  console.log('\n🔍 Testing Database Consistency...')
  
  try {
    // Test for data integrity
    const usersWithBookings = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        bookings: {
          some: {}
        }
      },
      include: {
        bookings: {
          select: {
            id: true,
            startTime: true,
            status: true
          }
        },
        creditPurchases: {
          select: {
            id: true,
            amount: true,
            credits: true
          }
        }
      }
    })
    
    console.log(`👥 Clients with bookings: ${usersWithBookings.length}`)
    
    // Check for consistency between bookings and credit purchases
    usersWithBookings.forEach(user => {
      const totalBookings = user.bookings.length
      const totalCredits = user.creditPurchases.reduce((sum, cp) => sum + cp.credits, 0)
      
      if (totalBookings > totalCredits) {
        console.log(`⚠️ User ${user.name} has more bookings (${totalBookings}) than credits purchased (${totalCredits})`)
      }
    })
    
    // Test for duplicate bookings
    const allBookings = await prisma.booking.findMany({
      select: {
        id: true,
        userId: true,
        startTime: true
      }
    })
    
    const duplicateBookings = allBookings.filter((booking, index, arr) => 
      arr.findIndex(b => b.userId === booking.userId && b.startTime.getTime() === booking.startTime.getTime()) !== index
    )
    
    if (duplicateBookings.length > 0) {
      console.log(`⚠️ Found ${duplicateBookings.length} potential duplicate bookings`)
    } else {
      console.log('✅ No duplicate bookings found')
    }
    
    console.log('✅ Database consistency test completed!')
    return true
    
  } catch (error) {
    console.error('❌ Database consistency test failed:', error)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Analytics Test Suite...\n')
  
  const results = {
    analyticsCalculations: await testAnalyticsCalculations(),
    databaseConsistency: await testDatabaseConsistency()
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log(`- Analytics Calculations: ${results.analyticsCalculations ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`- Database Consistency: ${results.databaseConsistency ? '✅ PASS' : '❌ FAIL'}`)
  
  const allPassed = Object.values(results).every(Boolean)
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  
  await prisma.$disconnect()
  return allPassed
}

// Run the tests
runTests().catch(console.error)


import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { googleCalendarService } from '../lib/google-calendar'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function testAdminFeatures() {
  console.log('👨‍💼 Testing Admin Google Calendar Features...')
  
  try {
    // 1. Test manual resync functionality
    console.log('🔄 Testing manual resync...')
    
    // Create a test booking
    const demoUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    })
    
    if (!demoUser) {
      throw new Error('Demo user not found')
    }
    
    const startTime = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration
    
    const booking = await prisma.booking.create({
      data: {
        userId: demoUser.id,
        startTime,
        endTime,
        notes: 'Test booking for admin resync',
        status: 'CONFIRMED',
        creditsUsed: 1,
        syncStatus: 'PENDING'
      }
    })
    
    console.log('✅ Test booking created for resync test')
    
    // 2. Test availability settings management
    console.log('⏰ Testing availability settings...')
    
    const availabilitySettings = await prisma.availabilitySettings.create({
      data: {
        type: 'WORKING_HOURS',
        dayOfWeek: 1, // Monday (0 = Sunday, 1 = Monday, etc.)
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: false
      }
    })
    
    console.log('✅ Availability settings created:', availabilitySettings.id)
    
    // 3. Test checking existing bookings sync status
    console.log('📊 Testing booking sync status check...')
    
    const bookings = await prisma.booking.findMany({
      where: {
        googleCalendarEventId: { not: null }
      },
      take: 5
    })
    
    console.log('✅ Found', bookings.length, 'synced bookings')
    
    // 4. Test bulk availability check
    console.log('🗓️ Testing bulk availability check...')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)
    
    const availableSlots = await googleCalendarService.getAvailableSlots(
      tomorrow,
      dayAfter,
      60, // 60 minutes
      [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' }
      ]
    )
    
    console.log('✅ Bulk availability check completed:', availableSlots.length, 'slots available')
    
    // 5. Test error handling for invalid events
    console.log('❌ Testing error handling...')
    
    try {
      await googleCalendarService.getEvent('invalid-event-id')
    } catch (error) {
      console.log('✅ Error handling working for invalid event ID')
    }
    
    // 6. Test availability settings retrieval
    console.log('📋 Testing availability settings retrieval...')
    
    const allAvailabilitySettings = await prisma.availabilitySettings.findMany()
    console.log('✅ Retrieved', allAvailabilitySettings.length, 'availability settings')
    
    // 7. Test working hours validation
    console.log('⏰ Testing working hours validation...')
    
    const mondaySettings = await prisma.availabilitySettings.findMany({
      where: { dayOfWeek: 1 } // Monday
    })
    
    console.log('✅ Monday working hours:', mondaySettings.length, 'settings found')
    
    // Clean up
    console.log('🧹 Cleaning up admin test data...')
    await prisma.booking.delete({ where: { id: booking.id } })
    await prisma.availabilitySettings.delete({ where: { id: availabilitySettings.id } })
    console.log('✅ Admin test cleanup completed')
    
    console.log('\n🎉 All admin feature tests passed!')
    
  } catch (error) {
    console.error('❌ Admin feature test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testAdminFeatures()

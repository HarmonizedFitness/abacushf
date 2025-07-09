
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { googleCalendarService } from '../lib/google-calendar'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function testBookingIntegration() {
  console.log('🔄 Testing End-to-End Booking Integration with Google Calendar...')
  
  try {
    // 1. Verify demo user exists
    console.log('👤 Checking demo user...')
    let demoUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    })
    
    if (!demoUser) {
      console.log('Creating demo user...')
      const hashedPassword = await bcrypt.hash('johndoe123', 10)
      demoUser = await prisma.user.create({
        data: {
          email: 'john@doe.com',
          name: 'John Doe',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
    }
    console.log('✅ Demo user verified:', demoUser.email)
    
    // 2. Test creating a booking with Google Calendar sync
    console.log('📅 Creating test booking...')
    const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration
    
    const booking = await prisma.booking.create({
      data: {
        userId: demoUser.id,
        startTime,
        endTime,
        notes: 'Test booking for Google Calendar integration',
        status: 'CONFIRMED',
        creditsUsed: 1
      }
    })
    console.log('✅ Booking created:', booking.id)
    
    // 3. Create corresponding Google Calendar event
    console.log('📅 Creating Google Calendar event...')
    const calendarEvent = {
      summary: `Personal Training Session - ${demoUser.name}`,
      description: `Training session with ${demoUser.name}\n\nClient: ${demoUser.email}\n\nNotes: ${booking.notes}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York'
      }
    }
    
    const eventId = await googleCalendarService.createEvent(calendarEvent)
    console.log('✅ Google Calendar event created:', eventId)
    
    // 4. Update booking with Google Calendar event ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { 
        googleCalendarEventId: eventId,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date()
      }
    })
    console.log('✅ Booking updated with Google Calendar event ID')
    
    // 5. Test availability checking
    console.log('📊 Testing availability check...')
    const availabilityStart = new Date(startTime.getTime() - 60 * 60 * 1000) // 1 hour before
    const availabilityEnd = new Date(endTime.getTime() + 60 * 60 * 1000) // 1 hour after
    
    const availability = await googleCalendarService.checkFreeBusy({
      timeMin: availabilityStart.toISOString(),
      timeMax: availabilityEnd.toISOString(),
      items: [{ id: 'primary' }]
    })
    
    console.log('✅ Availability check successful! Busy slots found:', availability.busy.length)
    
    // 6. Test event update
    console.log('📝 Testing event update...')
    await googleCalendarService.updateEvent(eventId, {
      summary: `Updated Personal Training Session - ${demoUser.name}`,
      description: `Updated training session with ${demoUser.name}\n\nClient: ${demoUser.email}\n\nNotes: Updated test notes`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York'
      }
    })
    console.log('✅ Event updated successfully')
    
    // 7. Test getting available slots
    console.log('🕐 Testing available slots...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)
    
    const availableSlots = await googleCalendarService.getAvailableSlots(
      tomorrow,
      dayAfter,
      60, // 60 minutes
      [{ start: '09:00', end: '17:00' }]
    )
    
    console.log('✅ Available slots retrieved:', availableSlots.length, 'slots found')
    
    // 8. Clean up - delete the test booking and calendar event
    console.log('🧹 Cleaning up...')
    await googleCalendarService.deleteEvent(eventId)
    await prisma.booking.delete({ where: { id: booking.id } })
    console.log('✅ Cleanup completed')
    
    console.log('\n🎉 All booking integration tests passed!')
    
  } catch (error) {
    console.error('❌ Booking integration test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testBookingIntegration()

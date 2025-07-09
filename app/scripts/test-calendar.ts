
import dotenv from 'dotenv'
import { googleCalendarService } from '../lib/google-calendar'

// Load environment variables from .env file
dotenv.config()

async function testGoogleCalendarConnection() {
  console.log('🔗 Testing Google Calendar connection...')
  
  // Debug environment variables
  console.log('Debug: Environment Variables')
  console.log('GOOGLE_PRIVATE_KEY_ID:', process.env.GOOGLE_PRIVATE_KEY_ID ? 'SET' : 'NOT SET')
  console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_PRIVATE_KEY.length + ')' : 'NOT SET')
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET')
  
  if (process.env.GOOGLE_PRIVATE_KEY) {
    console.log('Private key starts with:', process.env.GOOGLE_PRIVATE_KEY.substring(0, 50) + '...')
  }
  
  try {
    // Test basic connection
    const isConnected = await googleCalendarService.testConnection()
    
    if (isConnected) {
      console.log('✅ Google Calendar connection successful!')
      
      // Test creating a sample event
      console.log('📅 Testing event creation...')
      const testEvent = {
        summary: 'Test Event - Harmonized Fitness',
        description: 'This is a test event to verify Google Calendar integration',
        start: {
          dateTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: new Date(Date.now() + 120000).toISOString(), // 2 minutes from now
          timeZone: 'America/New_York'
        }
      }
      
      const eventId = await googleCalendarService.createEvent(testEvent)
      console.log('✅ Test event created successfully! Event ID:', eventId)
      
      // Test retrieving the event
      console.log('📖 Testing event retrieval...')
      const retrievedEvent = await googleCalendarService.getEvent(eventId)
      console.log('✅ Event retrieved successfully:', retrievedEvent?.summary)
      
      // Test updating the event
      console.log('📝 Testing event update...')
      await googleCalendarService.updateEvent(eventId, {
        summary: 'Updated Test Event - Harmonized Fitness',
        description: 'This event has been updated successfully',
        start: {
          dateTime: new Date(Date.now() + 60000).toISOString(),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: new Date(Date.now() + 120000).toISOString(),
          timeZone: 'America/New_York'
        }
      })
      console.log('✅ Event updated successfully!')
      
      // Test checking availability
      console.log('📊 Testing availability check...')
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const availability = await googleCalendarService.checkFreeBusy({
        timeMin: now.toISOString(),
        timeMax: tomorrow.toISOString(),
        items: [{ id: 'primary' }]
      })
      console.log('✅ Availability check successful! Busy slots:', availability.busy.length)
      
      // Clean up - delete the test event
      console.log('🧹 Cleaning up test event...')
      await googleCalendarService.deleteEvent(eventId)
      console.log('✅ Test event deleted successfully!')
      
      console.log('\n🎉 All Google Calendar tests passed!')
      
    } else {
      console.log('❌ Google Calendar connection failed!')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Google Calendar test failed:', error)
    process.exit(1)
  }
}

// Run the test
testGoogleCalendarConnection()


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const users = await prisma.user.findMany({ 
      select: { email: true, role: true, name: true, isActive: true } 
    });
    const bookings = await prisma.booking.count();
    const sessions = await prisma.workoutSession.count();
    const purchases = await prisma.creditPurchase.count();
    const notifications = await prisma.notification.count();
    const exercises = await prisma.exercise.count();
    const personalRecords = await prisma.personalRecord.count();
    
    console.log('📊 Current Database State:');
    console.log('='.repeat(50));
    console.log('Users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name} - Active: ${user.isActive}`);
    });
    console.log(`\nData Counts:`);
    console.log(`  - Bookings: ${bookings}`);
    console.log(`  - Workout Sessions: ${sessions}`);
    console.log(`  - Credit Purchases: ${purchases}`);
    console.log(`  - Notifications: ${notifications}`);
    console.log(`  - Exercises: ${exercises}`);
    console.log(`  - Personal Records: ${personalRecords}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

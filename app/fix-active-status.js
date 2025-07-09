const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixActiveStatus() {
  try {
    console.log('=== FIXING CLIENT ACTIVE STATUS ===\n');
    
    // Update all client users to be active
    const result = await prisma.user.updateMany({
      where: {
        role: 'CLIENT',
        isActive: false
      },
      data: {
        isActive: true
      }
    });
    
    console.log(`Updated ${result.count} client users to active status`);
    
    // Verify the fix
    const clientUsers = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        email: true,
        isActive: true
      }
    });
    
    console.log('\nClient users status after fix:');
    for (const user of clientUsers) {
      console.log(`${user.email}: isActive = ${user.isActive}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixActiveStatus();

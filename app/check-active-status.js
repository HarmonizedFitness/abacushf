const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkActiveStatus() {
  try {
    console.log('=== CHECKING USER ACTIVE STATUS ===\n');
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        isActive: true
      }
    });
    
    for (const user of users) {
      console.log(`${user.email} (${user.role}): isActive = ${user.isActive}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActiveStatus();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginFlow() {
  try {
    console.log('=== COMPREHENSIVE LOGIN TEST ===\n');
    
    // Test 1: Database verification
    console.log('1. VERIFYING DATABASE STATE:');
    const testAccounts = [
      { email: 'john@doe.com', password: 'johndoe123', expectedRole: 'ADMIN' },
      { email: 'alice@fitness.com', password: 'password123', expectedRole: 'CLIENT' },
      { email: 'bob@fitness.com', password: 'password123', expectedRole: 'CLIENT' },
      { email: 'carol@fitness.com', password: 'password123', expectedRole: 'CLIENT' }
    ];
    
    for (const account of testAccounts) {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
        select: {
          email: true,
          password: true,
          role: true,
          isActive: true
        }
      });
      
      if (user) {
        const passwordMatch = await bcrypt.compare(account.password, user.password);
        console.log(`✓ ${account.email}: Role=${user.role}, Active=${user.isActive}, Password=${passwordMatch ? 'VALID' : 'INVALID'}`);
      } else {
        console.log(`✗ ${account.email}: NOT FOUND`);
      }
    }
    
    console.log('\n2. AUTHENTICATION SIMULATION:');
    // Simulate the NextAuth authorize function
    for (const account of testAccounts) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: account.email },
        });
        
        if (!user) {
          console.log(`✗ ${account.email}: User not found`);
          continue;
        }
        
        const isPasswordValid = await bcrypt.compare(account.password, user.password);
        
        if (!isPasswordValid) {
          console.log(`✗ ${account.email}: Invalid password`);
          continue;
        }
        
        if (!user.isActive) {
          console.log(`✗ ${account.email}: Account is deactivated`);
          continue;
        }
        
        console.log(`✓ ${account.email}: LOGIN SUCCESS (Role: ${user.role})`);
        
      } catch (error) {
        console.log(`✗ ${account.email}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginFlow();

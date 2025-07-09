const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugUsers() {
  try {
    console.log('=== DEBUGGING USER DATABASE STATE ===\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`Total users found: ${users.length}\n`);
    
    for (const user of users) {
      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`  Created: ${user.createdAt}`);
      
      // Test password verification for known passwords
      const testPasswords = ['johndoe123', 'password123', 'admin123'];
      for (const testPassword of testPasswords) {
        const isValid = await bcrypt.compare(testPassword, user.password);
        if (isValid) {
          console.log(`  ✓ Password "${testPassword}" WORKS`);
        }
      }
      console.log('');
    }
    
    // Test specific client emails
    const clientEmails = [
      'alice@fitness.com',
      'bob@fitness.com', 
      'carol@fitness.com',
      'alice@example.com',
      'bob@example.com',
      'carol@example.com'
    ];
    
    console.log('=== CHECKING CLIENT EMAILS ===\n');
    for (const email of clientEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (user) {
        console.log(`✓ Found: ${email} (Role: ${user.role})`);
      } else {
        console.log(`✗ Not found: ${email}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers();

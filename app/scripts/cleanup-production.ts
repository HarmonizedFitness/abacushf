
import { PrismaClient } from '@prisma/client'
import { Environment } from '../lib/environment'

const prisma = new PrismaClient()

/**
 * Production database cleanup script
 * Removes all demo data and prepares database for production use
 */
async function cleanupForProduction() {
  console.log('🧹 Starting production database cleanup...')
  
  // Safety check - require explicit confirmation for production
  if (Environment.isProduction() && process.env.CONFIRM_PRODUCTION_CLEANUP !== 'true') {
    console.log('⚠️  PRODUCTION ENVIRONMENT DETECTED!')
    console.log('⚠️  This will permanently delete demo data!')
    console.log('⚠️  To proceed, set CONFIRM_PRODUCTION_CLEANUP=true')
    process.exit(0)
  }

  try {
    // Define demo/test user patterns
    const demoEmailPatterns = [
      'alice@fitness.com',
      'bob@fitness.com', 
      'carol@fitness.com',
      'demo.client1@harmonized.dev',
      'demo.client2@harmonized.dev',
      '%@test.com',
      '%demo%',
      '%test%'
    ]

    // Admin accounts to preserve
    const preserveAdminEmails = [
      'john@doe.com',
      'admin@harmonized.com'
    ]

    console.log('🔍 Identifying demo data...')

    // Find demo users (excluding preserved admins)
    const demoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: ['alice@fitness.com', 'bob@fitness.com', 'carol@fitness.com'] } },
          { email: { contains: 'demo' } },
          { email: { contains: 'test' } },
          { AND: [
            { role: 'CLIENT' },
            { email: { not: { in: preserveAdminEmails } } }
          ]}
        ]
      },
      select: { id: true, email: true, name: true, role: true }
    })

    console.log(`📋 Found ${demoUsers.length} demo users to remove:`)
    demoUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name}`)
    })

    if (demoUsers.length === 0) {
      console.log('✅ No demo users found. Database appears clean.')
      return
    }

    const demoUserIds = demoUsers.map(u => u.id)

    // Start cleanup transaction
    console.log('🗑️  Starting cleanup transaction...')

    await prisma.$transaction(async (tx) => {
      // Delete in order to respect foreign key constraints
      
      // 1. Delete workout sets
      const deletedSets = await tx.workoutSet.deleteMany({
        where: {
          workoutExercise: {
            workoutSession: {
              userId: { in: demoUserIds }
            }
          }
        }
      })
      console.log(`  ✅ Deleted ${deletedSets.count} workout sets`)

      // 2. Delete workout exercises
      const deletedWorkoutExercises = await tx.workoutExercise.deleteMany({
        where: {
          workoutSession: {
            userId: { in: demoUserIds }
          }
        }
      })
      console.log(`  ✅ Deleted ${deletedWorkoutExercises.count} workout exercises`)

      // 3. Delete workout exercise groups
      const deletedGroups = await tx.workoutExerciseGroup.deleteMany({
        where: {
          workoutSession: {
            userId: { in: demoUserIds }
          }
        }
      })
      console.log(`  ✅ Deleted ${deletedGroups.count} workout exercise groups`)

      // 4. Delete workout sessions
      const deletedSessions = await tx.workoutSession.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedSessions.count} workout sessions`)

      // 5. Delete personal records
      const deletedPRs = await tx.personalRecord.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedPRs.count} personal records`)

      // 6. Delete progress entries
      const deletedProgress = await tx.progressEntry.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedProgress.count} progress entries`)

      // 7. Delete notifications
      const deletedNotifications = await tx.notification.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedNotifications.count} notifications`)

      // 8. Delete bookings
      const deletedBookings = await tx.booking.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedBookings.count} bookings`)

      // 9. Delete credit purchases
      const deletedPurchases = await tx.creditPurchase.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedPurchases.count} credit purchases`)

      // 10. Delete sessions (NextAuth)
      const deletedAuthSessions = await tx.session.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedAuthSessions.count} auth sessions`)

      // 11. Delete accounts (NextAuth)
      const deletedAccounts = await tx.account.deleteMany({
        where: { userId: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedAccounts.count} accounts`)

      // 12. Finally, delete demo users
      const deletedUsers = await tx.user.deleteMany({
        where: { id: { in: demoUserIds } }
      })
      console.log(`  ✅ Deleted ${deletedUsers.count} demo users`)

      // Clean up demo-specific exercises if any
      const deletedDemoExercises = await tx.exercise.deleteMany({
        where: {
          OR: [
            { name: { contains: 'demo' } },
            { name: { contains: 'test' } },
            { description: { contains: 'demo' } },
            { description: { contains: 'test' } }
          ]
        }
      })
      if (deletedDemoExercises.count > 0) {
        console.log(`  ✅ Deleted ${deletedDemoExercises.count} demo exercises`)
      }

      // Clean up demo notifications for admin users
      const deletedDemoNotifications = await tx.notification.deleteMany({
        where: {
          OR: [
            { message: { contains: 'Alice Johnson' } },
            { message: { contains: 'Bob Smith' } },
            { message: { contains: 'Carol Williams' } },
            { message: { contains: 'demo' } },
            { message: { contains: 'test' } },
            { title: { contains: 'demo' } },
            { title: { contains: 'test' } }
          ]
        }
      })
      if (deletedDemoNotifications.count > 0) {
        console.log(`  ✅ Deleted ${deletedDemoNotifications.count} demo notifications`)
      }
    })

    console.log('🎉 Production cleanup completed successfully!')
    console.log('✅ Database is now ready for production use')
    
    // Show remaining data
    const remainingUsers = await prisma.user.count()
    const remainingBookings = await prisma.booking.count()
    const remainingSessions = await prisma.workoutSession.count()
    const remainingPurchases = await prisma.creditPurchase.count()
    const remainingNotifications = await prisma.notification.count()
    
    console.log('\n📊 Remaining data after cleanup:')
    console.log(`  - Users: ${remainingUsers}`)
    console.log(`  - Bookings: ${remainingBookings}`)
    console.log(`  - Workout Sessions: ${remainingSessions}`)
    console.log(`  - Credit Purchases: ${remainingPurchases}`)
    console.log(`  - Notifications: ${remainingNotifications}`)

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    throw error
  }
}

async function main() {
  try {
    await cleanupForProduction()
  } catch (error) {
    console.error('❌ Production cleanup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if called directly
if (require.main === module) {
  main()
}

export default cleanupForProduction

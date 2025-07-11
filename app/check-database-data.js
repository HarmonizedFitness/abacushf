
const { PrismaClient } = require('@prisma/client')

async function checkDatabaseData() {
  const prisma = new PrismaClient()
  
  try {
    console.log('\n=== CHECKING DATABASE DATA ===\n')
    
    // Check all users
    console.log('📊 ALL USERS:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - Active: ${user.isActive}`)
    })
    
    // Find Hamza or check if he's one of the existing users
    const hamzaUser = users.find(u => 
      u.name?.toLowerCase().includes('hamza') || 
      u.email?.toLowerCase().includes('hamza')
    )
    
    if (hamzaUser) {
      console.log(`\n🎯 FOUND HAMZA: ${hamzaUser.name} (${hamzaUser.email})`)
      await checkUserData(prisma, hamzaUser.id, hamzaUser.name)
    } else {
      console.log('\n❌ No user named Hamza found. Checking first client user instead...')
      const firstClient = users.find(u => u.role === 'CLIENT')
      if (firstClient) {
        await checkUserData(prisma, firstClient.id, firstClient.name)
      }
    }
    
  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function checkUserData(prisma, userId, userName) {
  console.log(`\n🔍 CHECKING DATA FOR: ${userName} (${userId})`)
  
  // Check workout sessions
  console.log('\n💪 WORKOUT SESSIONS:')
  const workoutSessions = await prisma.workoutSession.findMany({
    where: { userId },
    include: {
      exercises: {
        include: {
          exercise: { select: { name: true } },
          sets: true
        }
      }
    },
    orderBy: { date: 'desc' }
  })
  
  console.log(`  Total workout sessions: ${workoutSessions.length}`)
  workoutSessions.forEach((session, i) => {
    console.log(`  ${i + 1}. ${session.date} - Status: ${session.status} - ${session.exercises.length} exercises`)
    session.exercises.forEach(ex => {
      console.log(`     - ${ex.exercise.name}: ${ex.sets.length} sets`)
      ex.sets.forEach((set, setIndex) => {
        console.log(`       Set ${setIndex + 1}: ${set.weight}lbs x ${set.reps} reps`)
      })
    })
  })
  
  // Check credit purchases
  console.log('\n💳 CREDIT PURCHASES:')
  const purchases = await prisma.creditPurchase.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
  console.log(`  Total purchases: ${purchases.length}`)
  let totalCredits = 0
  purchases.forEach(p => {
    console.log(`  - ${p.credits} credits - Status: ${p.status} - ${p.createdAt}`)
    if (p.status === 'COMPLETED') totalCredits += p.credits
  })
  console.log(`  Total completed credits: ${totalCredits}`)
  
  // Check bookings
  console.log('\n📅 BOOKINGS:')
  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
  console.log(`  Total bookings: ${bookings.length}`)
  let totalUsed = 0
  bookings.forEach(b => {
    console.log(`  - ${b.startTime} - Status: ${b.status} - Credits used: ${b.creditsUsed}`)
    if (['CONFIRMED', 'COMPLETED'].includes(b.status)) totalUsed += b.creditsUsed
  })
  console.log(`  Total credits used from bookings: ${totalUsed}`)
  
  // Check personal records
  console.log('\n🏆 STORED PERSONAL RECORDS:')
  const personalRecords = await prisma.personalRecord.findMany({
    where: { userId },
    include: {
      exercise: { select: { name: true, category: true } }
    },
    orderBy: { achievedAt: 'desc' }
  })
  console.log(`  Total stored PRs: ${personalRecords.length}`)
  personalRecords.forEach(pr => {
    console.log(`  - ${pr.exercise.name}: ${pr.weight}lbs x ${pr.reps} reps, Volume: ${pr.volume}`)
  })
  
  // Calculate credits
  console.log('\n🧮 CREDITS CALCULATION:')
  console.log(`  Total purchased: ${totalCredits}`)
  console.log(`  Total used (bookings): ${totalUsed}`)
  console.log(`  Remaining (bookings method): ${totalCredits - totalUsed}`)
  const completedWorkouts = workoutSessions.filter(w => w.status === 'COMPLETED').length
  console.log(`  Completed workouts: ${completedWorkouts}`)
  console.log(`  Remaining (workouts method): ${totalCredits - completedWorkouts}`)
  
  // Check if bench press data exists
  console.log('\n🏋️ CHECKING FOR BENCH PRESS DATA:')
  const benchPressData = await prisma.workoutSet.findMany({
    where: {
      workoutExercise: {
        workoutSession: { userId },
        exercise: {
          name: { contains: 'Bench Press', mode: 'insensitive' }
        }
      }
    },
    include: {
      workoutExercise: {
        include: {
          exercise: { select: { name: true } },
          workoutSession: { select: { date: true, status: true } }
        }
      }
    },
    orderBy: { weight: 'desc' }
  })
  
  console.log(`  Found ${benchPressData.length} bench press sets`)
  benchPressData.forEach(set => {
    console.log(`  - ${set.workoutExercise.exercise.name}: ${set.weight}lbs x ${set.reps} reps (${set.workoutExercise.workoutSession.date})`)
  })
  
  if (benchPressData.length > 0) {
    const maxWeight = Math.max(...benchPressData.map(s => s.weight || 0))
    const maxVolumeSet = benchPressData.reduce((max, set) => {
      const volume = (set.weight || 0) * (set.reps || 0)
      const maxVolume = (max.weight || 0) * (max.reps || 0)
      return volume > maxVolume ? set : max
    })
    const maxVolume = (maxVolumeSet.weight || 0) * (maxVolumeSet.reps || 0)
    
    console.log(`  Max Weight PR: ${maxWeight}lbs`)
    console.log(`  Max Volume PR: ${maxVolume}lbs (${maxVolumeSet.weight}lbs x ${maxVolumeSet.reps} reps)`)
  }
}

checkDatabaseData()

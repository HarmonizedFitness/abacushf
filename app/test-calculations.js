
const { PrismaClient } = require('@prisma/client')

// Import calculation functions from utils.ts (converted to JS)
function calculatePersonalRecords(workoutSets, userBodyWeight) {
  const prsByExercise = {}

  workoutSets.forEach((set) => {
    const exerciseId = set.workoutExercise?.exerciseId
    const exerciseName = set.workoutExercise?.exercise?.name
    const exerciseCategory = set.workoutExercise?.exercise?.category
    const exercise = set.workoutExercise?.exercise
    
    const isBodyweight = isBodyweightExercise(exercise) || (!set.weight || set.weight === 0)

    if (!exerciseId || !set.reps) return

    if (!prsByExercise[exerciseId]) {
      prsByExercise[exerciseId] = {
        exerciseId,
        exerciseName: exerciseName || 'Unknown Exercise',
        category: exerciseCategory || 'Unknown',
        maxWeight: null,
        maxVolume: null,
        maxReps: null,
        isBodyweight,
        totalLifetimeVolume: 0
      }
    }

    const reps = Number(set.reps) || 0
    const setWeight = Number(set.weight) || 0
    const achievedAt = set.workoutExercise?.workoutSession?.date || set.createdAt || new Date().toISOString()
    const workoutSessionId = set.workoutExercise?.workoutSessionId

    if (isBodyweight) {
      if (reps > 0 && (!prsByExercise[exerciseId].maxReps || reps > prsByExercise[exerciseId].maxReps.reps)) {
        prsByExercise[exerciseId].maxReps = {
          reps,
          weight: userBodyWeight || 0,
          achievedAt,
          workoutSessionId
        }
      }
      
      if (setWeight > 0) {
        const totalWeight = (userBodyWeight || 0) + setWeight
        
        if (!prsByExercise[exerciseId].maxWeight || totalWeight > prsByExercise[exerciseId].maxWeight.weight) {
          prsByExercise[exerciseId].maxWeight = {
            weight: totalWeight,
            reps,
            achievedAt,
            workoutSessionId
          }
        }
        
        const singleSetVolume = totalWeight * reps
        if (!prsByExercise[exerciseId].maxVolume || singleSetVolume > prsByExercise[exerciseId].maxVolume.volume) {
          prsByExercise[exerciseId].maxVolume = {
            weight: totalWeight,
            reps,
            volume: singleSetVolume,
            achievedAt,
            workoutSessionId
          }
        }

        prsByExercise[exerciseId].totalLifetimeVolume += singleSetVolume
      } else {
        const effectiveWeight = userBodyWeight || 0
        if (effectiveWeight > 0) {
          const singleSetVolume = effectiveWeight * reps
          prsByExercise[exerciseId].totalLifetimeVolume += singleSetVolume
        }
      }
    } else {
      if (setWeight > 0) {
        if (!prsByExercise[exerciseId].maxWeight || setWeight > prsByExercise[exerciseId].maxWeight.weight) {
          prsByExercise[exerciseId].maxWeight = {
            weight: setWeight,
            reps,
            achievedAt,
            workoutSessionId
          }
        }

        const singleSetVolume = setWeight * reps
        if (!prsByExercise[exerciseId].maxVolume || singleSetVolume > prsByExercise[exerciseId].maxVolume.volume) {
          prsByExercise[exerciseId].maxVolume = {
            weight: setWeight,
            reps,
            volume: singleSetVolume,
            achievedAt,
            workoutSessionId
          }
        }

        prsByExercise[exerciseId].totalLifetimeVolume += singleSetVolume
      }
    }
  })

  return Object.values(prsByExercise)
}

function isBodyweightExercise(exercise) {
  if (!exercise) return false
  
  const category = exercise.category?.toLowerCase() || ''
  const equipment = exercise.equipment?.toLowerCase() || ''
  const name = exercise.name?.toLowerCase() || ''
  
  return category.includes('bodyweight') || 
         equipment.includes('bodyweight') || 
         name.includes('bodyweight') ||
         name.includes('push-up') ||
         name.includes('pull-up') ||
         name.includes('chin-up') ||
         name.includes('dip') ||
         name.includes('plank') ||
         name.includes('burpee') ||
         name.includes('split squat')
}

function calculatePRStatistics(calculatedPRs) {
  const totalPRs = calculatedPRs.length
  
  const totalLifetimeVolume = calculatedPRs.reduce((sum, pr) => {
    return sum + (pr.totalLifetimeVolume || 0)
  }, 0)
  
  const categories = new Set(calculatedPRs.map(pr => pr.category))
  const categoriesCount = categories.size
  
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  
  const thisMonthPRs = calculatedPRs.filter(pr => {
    const maxWeightDate = pr.maxWeight ? new Date(pr.maxWeight.achievedAt) : null
    const maxVolumeDate = pr.maxVolume ? new Date(pr.maxVolume.achievedAt) : null
    
    const latestPRDate = maxWeightDate && maxVolumeDate 
      ? new Date(Math.max(maxWeightDate.getTime(), maxVolumeDate.getTime()))
      : maxWeightDate || maxVolumeDate
      
    return latestPRDate && latestPRDate >= oneMonthAgo
  }).length
  
  return {
    totalPRs,
    totalLifetimeVolume,
    categoriesCount,
    thisMonthPRs
  }
}

async function testCalculations() {
  const prisma = new PrismaClient()
  
  try {
    console.log('\n🧪 TESTING CALCULATION LOGIC WITH HAMZA\'S DATA\n')
    
    // Get Hamza's data
    const hamza = await prisma.user.findFirst({
      where: { name: { contains: 'Hamza' } }
    })
    
    if (!hamza) {
      console.log('❌ Hamza not found')
      return
    }
    
    console.log(`🎯 Testing with: ${hamza.name} (${hamza.id})`)
    
    // Get all workout sets for Hamza
    const workoutSets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: {
          workoutSession: {
            userId: hamza.id
          }
        }
      },
      include: {
        workoutExercise: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                equipment: true
              }
            },
            workoutSession: {
              select: {
                id: true,
                date: true
              }
            }
          }
        }
      }
    })
    
    console.log(`📊 Found ${workoutSets.length} workout sets`)
    
    // Calculate PRs using our function
    const calculatedPRs = calculatePersonalRecords(workoutSets, 180) // Assume 180lbs bodyweight
    
    console.log(`🏆 Calculated ${calculatedPRs.length} Personal Records:\n`)
    
    calculatedPRs.forEach(pr => {
      console.log(`📝 ${pr.exerciseName} (${pr.category})`)
      console.log(`   - Bodyweight: ${pr.isBodyweight}`)
      if (pr.maxWeight) {
        console.log(`   - Weight PR: ${pr.maxWeight.weight}lbs × ${pr.maxWeight.reps} reps`)
      }
      if (pr.maxVolume) {
        console.log(`   - Volume PR: ${pr.maxVolume.volume}lbs (${pr.maxVolume.weight}lbs × ${pr.maxVolume.reps} reps)`)
      }
      if (pr.maxReps) {
        console.log(`   - Reps PR: ${pr.maxReps.reps} reps`)
      }
      console.log(`   - Total Lifetime Volume: ${pr.totalLifetimeVolume}lbs`)
      console.log('')
    })
    
    // Calculate statistics
    const stats = calculatePRStatistics(calculatedPRs)
    console.log('📈 CALCULATED STATISTICS:')
    console.log(`   - Total PRs: ${stats.totalPRs}`)
    console.log(`   - Total Lifetime Volume: ${stats.totalLifetimeVolume}lbs`)
    console.log(`   - Categories: ${stats.categoriesCount}`)
    console.log(`   - This Month PRs: ${stats.thisMonthPRs}`)
    
    // Filter out bodyweight exercises
    const weightedPRs = calculatedPRs.filter(pr => !pr.isBodyweight)
    console.log(`\n🏋️ WEIGHTED EXERCISES ONLY (after filtering):`)
    console.log(`   - Count: ${weightedPRs.length}`)
    weightedPRs.forEach(pr => {
      console.log(`   - ${pr.exerciseName}: Weight PR ${pr.maxWeight?.weight}lbs, Volume PR ${pr.maxVolume?.volume}lbs`)
    })
    
    // Check specific exercises
    console.log(`\n🔍 SPECIFIC EXERCISE CHECKS:`)
    const benchPress = calculatedPRs.find(pr => pr.exerciseName?.toLowerCase().includes('barbell bench press'))
    if (benchPress) {
      console.log(`✅ Barbell Bench Press:`)
      console.log(`   - Weight PR: ${benchPress.maxWeight?.weight}lbs (should be 315lbs)`)
      console.log(`   - Volume PR: ${benchPress.maxVolume?.volume}lbs (should be 1550lbs = 155×10)`)
      console.log(`   - Is Bodyweight: ${benchPress.isBodyweight} (should be false)`)
    }
    
    const splitSquat = calculatedPRs.find(pr => pr.exerciseName?.toLowerCase().includes('bulgarian split squat'))
    if (splitSquat) {
      console.log(`🚫 Bulgarian Split Squat:`)
      console.log(`   - Is Bodyweight: ${splitSquat.isBodyweight} (should be true - FILTERED OUT)`)
    }
    
    const burpees = calculatedPRs.find(pr => pr.exerciseName?.toLowerCase().includes('burpees'))
    if (burpees) {
      console.log(`🚫 Burpees:`)
      console.log(`   - Is Bodyweight: ${burpees.isBodyweight} (should be true - FILTERED OUT)`)
    }
    
    // Test credits calculation
    console.log(`\n💳 CREDITS CALCULATION TEST:`)
    
    // Get credit purchases
    const purchases = await prisma.creditPurchase.findMany({
      where: { userId: hamza.id, status: 'COMPLETED' }
    })
    const totalPurchased = purchases.reduce((sum, p) => sum + p.credits, 0)
    
    // Get completed workouts
    const completedWorkouts = await prisma.workoutSession.findMany({
      where: { userId: hamza.id, status: 'COMPLETED' }
    })
    
    // Get bookings usage
    const bookings = await prisma.booking.findMany({
      where: { 
        userId: hamza.id, 
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    })
    const totalUsedBookings = bookings.reduce((sum, b) => sum + b.creditsUsed, 0)
    
    console.log(`   - Total Purchased: ${totalPurchased}`)
    console.log(`   - Completed Workouts: ${completedWorkouts.length}`)
    console.log(`   - Credits Used (Bookings): ${totalUsedBookings}`)
    console.log(`   - Remaining (Bookings Method): ${totalPurchased - totalUsedBookings} ❌ (Currently used)`)
    console.log(`   - Remaining (Workouts Method): ${totalPurchased - completedWorkouts.length} ✅ (Should be used)`)
    
  } catch (error) {
    console.error('❌ Error testing calculations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCalculations()

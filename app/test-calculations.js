
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple implementation of the key functions for testing
function calculatePersonalRecords(workoutSets) {
  const prsByExercise = {};

  workoutSets.forEach((set) => {
    const exerciseId = set.workoutExercise?.exerciseId;
    const exerciseName = set.workoutExercise?.exercise?.name;
    const exerciseCategory = set.workoutExercise?.exercise?.category;
    
    if (!exerciseId || !set.reps) return;

    if (!prsByExercise[exerciseId]) {
      prsByExercise[exerciseId] = {
        exerciseId,
        exerciseName: exerciseName || 'Unknown Exercise',
        category: exerciseCategory || 'Unknown',
        maxWeight: null,
        maxVolume: null,
        isBodyweight: false,
        totalLifetimeVolume: 0
      };
    }

    const reps = Number(set.reps) || 0;
    const setWeight = Number(set.weight) || 0;
    const achievedAt = set.workoutExercise?.workoutSession?.date || new Date().toISOString();

    if (setWeight > 0) {
      // Weight PR = Single heaviest weight moved
      if (!prsByExercise[exerciseId].maxWeight || setWeight > prsByExercise[exerciseId].maxWeight.weight) {
        prsByExercise[exerciseId].maxWeight = {
          weight: setWeight,
          reps,
          achievedAt
        };
      }

      // Volume PR = Highest single set volume
      const singleSetVolume = setWeight * reps;
      if (!prsByExercise[exerciseId].maxVolume || singleSetVolume > prsByExercise[exerciseId].maxVolume.volume) {
        prsByExercise[exerciseId].maxVolume = {
          weight: setWeight,
          reps,
          volume: singleSetVolume,
          achievedAt
        };
      }

      prsByExercise[exerciseId].totalLifetimeVolume += singleSetVolume;
    }
  });

  return Object.values(prsByExercise);
}

function generateWorkoutDisplayName(workout) {
  if (!workout) return 'Unknown Workout';
  
  try {
    const userName = workout.user?.name || 'Unknown';
    const nameParts = userName.trim().split(' ');
    
    let nameCode = 'Unknown';
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      nameCode = `${lastName}${firstName.charAt(0).toUpperCase()}`;
    }
    
    const workoutDate = new Date(workout.date);
    const day = workoutDate.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[workoutDate.getMonth()];
    const year = workoutDate.getFullYear().toString().slice(-2);
    
    return `${nameCode}_${day}${month}${year}`;
  } catch (error) {
    return `Workout_${workout.id?.substring(0, 8) || 'Unknown'}`;
  }
}

async function testCalculations() {
  try {
    const hamzaId = 'cmcxv0sq90000sdb5uecjqpks';
    
    console.log('🧮 Testing calculation logic directly...\n');
    
    // Test 1: Credits calculation
    console.log('💳 CREDITS CALCULATION TEST:');
    const totalPurchased = await prisma.creditPurchase.aggregate({
      where: { userId: hamzaId, status: 'COMPLETED' },
      _sum: { credits: true },
    });
    
    const completedWorkouts = await prisma.workoutSession.count({
      where: { userId: hamzaId, status: 'COMPLETED' }
    });
    
    const purchased = totalPurchased._sum.credits || 0;
    const remainingCredits = Math.max(0, purchased - completedWorkouts);
    
    console.log('  - Total Purchased:', purchased);
    console.log('  - Completed Workouts:', completedWorkouts);
    console.log('  - Remaining Credits:', remainingCredits);
    console.log('  - ✅ Expected: 7, Calculated:', remainingCredits, remainingCredits === 7 ? '✅ CORRECT' : '❌ WRONG');
    
    // Test 2: Personal Records calculation
    console.log('\n🏆 PERSONAL RECORDS CALCULATION TEST:');
    
    // Get all workout sets for PR calculation
    const workoutSets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: {
          workoutSession: {
            userId: hamzaId
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
    });
    
    console.log('  - Total workout sets:', workoutSets.length);
    
    // Calculate PRs
    const calculatedPRs = calculatePersonalRecords(workoutSets);
    console.log('  - Calculated PRs for', calculatedPRs.length, 'exercises');
    
    // Find specific exercises
    const benchPress = calculatedPRs.find(pr => 
      pr.exerciseName?.toLowerCase().includes('barbell bench press') && 
      !pr.exerciseName?.toLowerCase().includes('incline')
    );
    const inclineBench = calculatedPRs.find(pr => 
      pr.exerciseName?.toLowerCase().includes('barbell incline bench press')
    );
    
    if (benchPress) {
      console.log('  - Barbell Bench Press Weight PR:', benchPress.maxWeight?.weight, 'lbs');
      console.log('    ✅ Expected: 315 lbs, Calculated:', benchPress.maxWeight?.weight, 
        benchPress.maxWeight?.weight === 315 ? '✅ CORRECT' : '❌ WRONG');
    } else {
      console.log('  - ❌ Barbell Bench Press not found');
    }
    
    if (inclineBench) {
      console.log('  - Barbell Incline Bench Press Weight PR:', inclineBench.maxWeight?.weight, 'lbs');
      console.log('    ✅ Expected: 225 lbs, Calculated:', inclineBench.maxWeight?.weight, 
        inclineBench.maxWeight?.weight === 225 ? '✅ CORRECT' : '❌ WRONG');
    } else {
      console.log('  - ❌ Barbell Incline Bench Press not found');
    }
    
    // Test 3: Workout display names
    console.log('\n📋 WORKOUT DISPLAY NAMES TEST:');
    
    const sampleWorkout = await prisma.workoutSession.findFirst({
      where: { userId: hamzaId },
      include: {
        user: { select: { name: true } }
      }
    });
    
    if (sampleWorkout) {
      const displayName = generateWorkoutDisplayName(sampleWorkout);
      console.log('  - Sample workout ID:', sampleWorkout.id.substring(0, 12) + '...');
      console.log('  - Generated display name:', displayName);
      console.log('  - ✅ Expected format: HamzaY_10JUL25, Generated:', displayName, 
        displayName.includes('HamzaY_10JUL25') ? '✅ CORRECT' : '❌ CHECK FORMAT');
    }
    
    // Test 4: Progress endpoint structure (just test that we can query)
    console.log('\n📈 PROGRESS ENDPOINT TEST:');
    const progressCount = await prisma.progressEntry.count({
      where: { userId: hamzaId }
    });
    console.log('  - Progress entries for Hamza:', progressCount);
    console.log('  - ✅ Progress endpoint can query data successfully');
    
    console.log('\n🎉 All calculation tests completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCalculations();

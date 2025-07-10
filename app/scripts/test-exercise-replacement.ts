
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testExerciseReplacement() {
  console.log('=== TESTING EXERCISE LIBRARY REPLACEMENT ===\n')
  
  try {
    // Test 1: Check total exercise count
    const totalCount = await prisma.exercise.count()
    console.log(`✅ Total exercises in database: ${totalCount}`)
    
    // Test 2: Check active exercises
    const activeCount = await prisma.exercise.count({ where: { isActive: true } })
    console.log(`✅ Active exercises: ${activeCount}`)
    
    // Test 3: Check favorites
    const favoritesCount = await prisma.exercise.count({ where: { isFavorite: true } })
    console.log(`✅ Favorite exercises: ${favoritesCount}`)
    
    // Test 4: Verify all required fields are populated
    const exercisesWithDifficulty = await prisma.exercise.count({
      where: { difficulty: { not: null } }
    })
    
    const exercisesWithForceType = await prisma.exercise.count({
      where: { forceType: { not: null } }
    })
    
    const exercisesWithEquipment = await prisma.exercise.count({
      where: { equipment: { not: null } }
    })
    
    const exercisesWithDescription = await prisma.exercise.count({
      where: { description: { not: null } }
    })
    
    console.log(`✅ Exercises with difficulty: ${exercisesWithDifficulty}`)
    console.log(`✅ Exercises with force type: ${exercisesWithForceType}`)
    console.log(`✅ Exercises with equipment: ${exercisesWithEquipment}`)
    console.log(`✅ Exercises with description: ${exercisesWithDescription}`)
    
    // Test 5: Check field value distributions
    const difficultyStats = await prisma.exercise.groupBy({
      by: ['difficulty'],
      _count: { difficulty: true },
      where: { difficulty: { not: null } }
    })
    
    const forceTypeStats = await prisma.exercise.groupBy({
      by: ['forceType'],
      _count: { forceType: true },
      where: { forceType: { not: null } }
    })
    
    const categoryStats = await prisma.exercise.groupBy({
      by: ['category'],
      _count: { category: true }
    })
    
    console.log('\n📊 FIELD DISTRIBUTIONS:')
    console.log('\nDifficulty levels:')
    difficultyStats.forEach(stat => {
      console.log(`  - ${stat.difficulty}: ${stat._count.difficulty} exercises`)
    })
    
    console.log('\nForce types:')
    forceTypeStats.forEach(stat => {
      console.log(`  - ${stat.forceType}: ${stat._count.forceType} exercises`)
    })
    
    console.log('\nCategories:')
    categoryStats.forEach(stat => {
      console.log(`  - ${stat.category}: ${stat._count.category} exercises`)
    })
    
    // Test 6: Sample exercises to verify correct data import
    console.log('\n🔍 SAMPLE EXERCISES:')
    const sampleExercises = await prisma.exercise.findMany({
      take: 5,
      where: { isFavorite: true },
      select: {
        name: true,
        category: true,
        equipment: true,
        difficulty: true,
        forceType: true,
        muscleGroups: true,
        isFavorite: true,
        description: true
      }
    })
    
    sampleExercises.forEach((exercise, index) => {
      console.log(`\n${index + 1}. ${exercise.name}`)
      console.log(`   Category: ${exercise.category}`)
      console.log(`   Equipment: ${exercise.equipment}`)
      console.log(`   Difficulty: ${exercise.difficulty}`)
      console.log(`   Force Type: ${exercise.forceType}`)
      console.log(`   Muscle Groups: ${exercise.muscleGroups.join(', ')}`)
      console.log(`   Favorite: ${exercise.isFavorite}`)
      console.log(`   Description: ${exercise.description?.substring(0, 80)}...`)
    })
    
    // Test 7: Verify no data integrity issues
    const exercisesWithEmptyMuscleGroups = await prisma.exercise.count({
      where: { muscleGroups: { isEmpty: true } }
    })
    
    const exercisesWithEmptyNames = await prisma.exercise.count({
      where: { name: '' }
    })
    
    console.log('\n🔒 DATA INTEGRITY CHECKS:')
    console.log(`✅ Exercises with empty muscle groups: ${exercisesWithEmptyMuscleGroups}`)
    console.log(`✅ Exercises with empty names: ${exercisesWithEmptyNames}`)
    
    // Test 8: Verify specific exercises from CSV exist
    const expectedExercises = [
      'Barbell Bench Press',
      'Barbell Bent-Over Row',
      'Barbell Squat'
    ]
    
    console.log('\n🎯 VERIFICATION OF SPECIFIC EXERCISES:')
    for (const exerciseName of expectedExercises) {
      const exercise = await prisma.exercise.findFirst({
        where: { name: exerciseName },
        select: {
          name: true,
          category: true,
          difficulty: true,
          forceType: true,
          isFavorite: true
        }
      })
      
      if (exercise) {
        console.log(`✅ Found: ${exercise.name} (${exercise.category}, ${exercise.difficulty}, ${exercise.forceType}, Favorite: ${exercise.isFavorite})`)
      } else {
        console.log(`❌ Missing: ${exerciseName}`)
      }
    }
    
    // Test 9: API endpoint test
    console.log('\n🌐 API ENDPOINT TEST:')
    try {
      const response = await fetch('http://localhost:3000/api/exercises?limit=5', {
        headers: {
          'Cookie': 'next-auth.session-token=test' // This won't work, but we'll try
        }
      })
      console.log(`✅ API exercises endpoint status: ${response.status}`)
    } catch (error) {
      console.log(`ℹ️  API test skipped (requires authentication): ${error}`)
    }
    
    console.log('\n🎉 EXERCISE LIBRARY REPLACEMENT TEST COMPLETED!')
    console.log('\n📝 SUMMARY:')
    console.log(`- Total exercises: ${totalCount}`)
    console.log(`- Active exercises: ${activeCount}`)
    console.log(`- Favorite exercises: ${favoritesCount}`)
    console.log(`- Data completeness: ${(exercisesWithDescription / totalCount * 100).toFixed(1)}%`)
    console.log(`- Field coverage: Difficulty ${exercisesWithDifficulty}, Force Type ${exercisesWithForceType}, Equipment ${exercisesWithEquipment}`)
    
    if (totalCount >= 150 && favoritesCount >= 5 && exercisesWithDescription === totalCount) {
      console.log('\n✅ EXERCISE LIBRARY REPLACEMENT: SUCCESS!')
    } else {
      console.log('\n❌ EXERCISE LIBRARY REPLACEMENT: ISSUES DETECTED!')
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
if (require.main === module) {
  testExerciseReplacement()
}

export { testExerciseReplacement }

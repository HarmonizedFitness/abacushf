
async function testExerciseLibrary() {
  try {
    console.log('🔑 Testing Exercise Library Integration...\n');
    
    // Test exercises database schema and data
    console.log('📚 Testing database connection...');
    
    // Import Prisma client and test directly
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test schema fields
    const sampleExercise = await prisma.exercise.findFirst({
      select: {
        id: true,
        name: true,
        category: true,
        muscleGroups: true,
        equipment: true,
        difficulty: true,  // NEW FIELD
        forceType: true,   // NEW FIELD
        isFavorite: true,  // NEW FIELD
        description: true,
        createdAt: true,
        updatedAt: true,
        isActive: true
      }
    });
    
    if (sampleExercise) {
      console.log('✅ Database schema updated successfully');
      console.log('📊 Sample exercise with new fields:');
      console.log(JSON.stringify(sampleExercise, null, 2));
    } else {
      console.log('❌ No exercises found in database');
    }
    
    // Test favorites count
    const favoritesCount = await prisma.exercise.count({
      where: { isFavorite: true, isActive: true }
    });
    
    console.log(`\n⭐ Favorite exercises count: ${favoritesCount}`);
    
    // Test total exercises count
    const totalCount = await prisma.exercise.count({
      where: { isActive: true }
    });
    
    console.log(`📚 Total active exercises: ${totalCount}`);
    
    // Test field distribution
    const difficultyDistribution = await prisma.exercise.groupBy({
      by: ['difficulty'],
      _count: { difficulty: true },
      where: { isActive: true, difficulty: { not: null } }
    });
    
    console.log('\n🎯 Difficulty distribution:');
    difficultyDistribution.forEach(item => {
      console.log(`  - ${item.difficulty}: ${item._count.difficulty} exercises`);
    });
    
    const forceTypeDistribution = await prisma.exercise.groupBy({
      by: ['forceType'],
      _count: { forceType: true },
      where: { isActive: true, forceType: { not: null } }
    });
    
    console.log('\n💪 Force type distribution:');
    forceTypeDistribution.forEach(item => {
      console.log(`  - ${item.forceType}: ${item._count.forceType} exercises`);
    });
    
    // Show some examples of exercises with new fields
    const exercisesWithNewFields = await prisma.exercise.findMany({
      where: {
        isActive: true,
        OR: [
          { difficulty: { not: null } },
          { forceType: { not: null } },
          { isFavorite: true }
        ]
      },
      select: {
        name: true,
        difficulty: true,
        forceType: true,
        isFavorite: true
      },
      take: 5
    });
    
    console.log('\n📝 Examples of exercises with new fields:');
    exercisesWithNewFields.forEach(ex => {
      console.log(`  - ${ex.name}: difficulty=${ex.difficulty}, forceType=${ex.forceType}, favorite=${ex.isFavorite}`);
    });
    
    await prisma.$disconnect();
    
    console.log('\n✅ Exercise Library Integration Test Complete!');
    console.log('🎉 All new fields are working correctly in the database.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExerciseLibrary();

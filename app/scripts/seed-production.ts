
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting PRODUCTION database seeding...')
  
  // Environment check - only allow in development or with explicit production flag
  const isProduction = process.env.NODE_ENV === 'production'
  const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true'
  
  if (isProduction && !allowProductionSeed) {
    console.log('⚠️  Production environment detected!')
    console.log('⚠️  To seed production database, set ALLOW_PRODUCTION_SEED=true')
    console.log('⚠️  This will create minimal essential data only.')
    process.exit(0)
  }

  if (isProduction) {
    console.log('🔒 PRODUCTION MODE: Creating minimal essential data only')
  } else {
    console.log('🔧 DEVELOPMENT MODE: Creating full demo dataset')
  }

  // Hash passwords
  const hashedPassword = await bcrypt.hash('johndoe123', 12)

  // Create essential admin user (always required)
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+1-555-0100',
      fitnessGoals: 'System administration and client management',
      isActive: true,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create essential exercises (core exercise library - always needed)
  const coreExercises = await Promise.all([
    // Chest exercises
    prisma.exercise.upsert({
      where: { id: 'bench-press' },
      update: {},
      create: {
        id: 'bench-press',
        name: 'Bench Press',
        description: 'Classic upper body exercise targeting chest, shoulders, and triceps',
        instructions: 'Lie on bench, grip bar with hands wider than shoulders, lower to chest, press up explosively',
        category: 'Chest',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        equipment: 'Barbell, Bench',
        imageUrl: 'https://barbend.com/wp-content/uploads/2022/03/Barbend-Featured-Image-1600x900-A-person-doing-a-bench-press.jpg',
        isActive: true,
      },
    }),
    prisma.exercise.upsert({
      where: { id: 'push-ups' },
      update: {},
      create: {
        id: 'push-ups',
        name: 'Push-ups',
        description: 'Bodyweight exercise for upper body strength',
        instructions: 'Start in plank position, lower body to ground, push back up',
        category: 'Chest',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
        equipment: 'Bodyweight',
        imageUrl: 'https://i.ytimg.com/vi/k2YnU7UFAaE/maxresdefault.jpg',
        isActive: true,
      },
    }),

    // Back exercises
    prisma.exercise.upsert({
      where: { id: 'deadlift' },
      update: {},
      create: {
        id: 'deadlift',
        name: 'Deadlift',
        description: 'Compound movement targeting posterior chain',
        instructions: 'Stand with feet hip-width apart, bend at hips and knees, grip bar, stand up tall',
        category: 'Back',
        muscleGroups: ['Back', 'Glutes', 'Hamstrings', 'Core'],
        equipment: 'Barbell',
        imageUrl: 'https://i.ytimg.com/vi/XxWcirHIwVo/maxresdefault.jpg',
        isActive: true,
      },
    }),
    prisma.exercise.upsert({
      where: { id: 'pull-ups' },
      update: {},
      create: {
        id: 'pull-ups',
        name: 'Pull-ups',
        description: 'Upper body pulling exercise',
        instructions: 'Hang from bar with arms extended, pull body up until chin over bar',
        category: 'Back',
        muscleGroups: ['Back', 'Biceps', 'Forearms'],
        equipment: 'Pull-up Bar',
        imageUrl: 'https://i.ytimg.com/vi/fOeXPLITq98/maxresdefault.jpg',
        isActive: true,
      },
    }),

    // Leg exercises
    prisma.exercise.upsert({
      where: { id: 'squats' },
      update: {},
      create: {
        id: 'squats',
        name: 'Squats',
        description: 'Fundamental lower body exercise',
        instructions: 'Stand with feet shoulder-width apart, lower hips back and down, return to standing',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        equipment: 'Bodyweight or Barbell',
        imageUrl: 'https://i.ytimg.com/vi/X0qC1k0Zi6k/maxresdefault.jpg',
        isActive: true,
      },
    }),
    prisma.exercise.upsert({
      where: { id: 'lunges' },
      update: {},
      create: {
        id: 'lunges',
        name: 'Lunges',
        description: 'Unilateral leg exercise for strength and balance',
        instructions: 'Step forward into lunge position, lower back knee, push back to starting position',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        equipment: 'Bodyweight or Dumbbells',
        imageUrl: 'https://i.ytimg.com/vi/LRoSqkvpj10/maxresdefault.jpg',
        isActive: true,
      },
    }),

    // Core exercises
    prisma.exercise.upsert({
      where: { id: 'plank' },
      update: {},
      create: {
        id: 'plank',
        name: 'Plank',
        description: 'Isometric core strengthening exercise',
        instructions: 'Hold push-up position with straight line from head to heels',
        category: 'Core',
        muscleGroups: ['Core', 'Shoulders', 'Glutes'],
        equipment: 'Bodyweight',
        imageUrl: 'https://barbend.com/wp-content/uploads/2022/05/shutterstock_1032306772-1.jpg',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created core exercises:', coreExercises.length)

  // Create essential business configuration (always needed)
  const businessConfigs = await Promise.all([
    // Business hours
    prisma.businessConfig.upsert({
      where: { key: 'business_hours_monday' },
      update: {},
      create: {
        key: 'business_hours_monday',
        value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
        description: 'Monday business hours',
        category: 'business_hours',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'business_hours_tuesday' },
      update: {},
      create: {
        key: 'business_hours_tuesday',
        value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
        description: 'Tuesday business hours',
        category: 'business_hours',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'business_hours_wednesday' },
      update: {},
      create: {
        key: 'business_hours_wednesday',
        value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
        description: 'Wednesday business hours',
        category: 'business_hours',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'business_hours_thursday' },
      update: {},
      create: {
        key: 'business_hours_thursday',
        value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
        description: 'Thursday business hours',
        category: 'business_hours',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'business_hours_friday' },
      update: {},
      create: {
        key: 'business_hours_friday',
        value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
        description: 'Friday business hours',
        category: 'business_hours',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'business_hours_saturday' },
      update: {},
      create: {
        key: 'business_hours_saturday',
        value: JSON.stringify({ start: '09:00', end: '15:00', isOpen: true }),
        description: 'Saturday business hours',
        category: 'business_hours',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'business_hours_sunday' },
      update: {},
      create: {
        key: 'business_hours_sunday',
        value: JSON.stringify({ start: '09:00', end: '15:00', isOpen: false }),
        description: 'Sunday business hours',
        category: 'business_hours',
      },
    }),

    // Session settings
    prisma.businessConfig.upsert({
      where: { key: 'default_session_duration' },
      update: {},
      create: {
        key: 'default_session_duration',
        value: '60',
        description: 'Default session duration in minutes',
        category: 'sessions',
      },
    }),

    // Pricing tiers
    prisma.businessConfig.upsert({
      where: { key: 'pricing_tier_1' },
      update: {},
      create: {
        key: 'pricing_tier_1',
        value: JSON.stringify({ credits: '1-4', price: 85, name: 'Starter' }),
        description: 'Starter pricing tier',
        category: 'pricing',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'pricing_tier_2' },
      update: {},
      create: {
        key: 'pricing_tier_2',
        value: JSON.stringify({ credits: '5-10', price: 80, name: 'Regular' }),
        description: 'Regular pricing tier',
        category: 'pricing',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'pricing_tier_3' },
      update: {},
      create: {
        key: 'pricing_tier_3',
        value: JSON.stringify({ credits: '11-19', price: 75, name: 'Committed' }),
        description: 'Committed pricing tier',
        category: 'pricing',
      },
    }),
    prisma.businessConfig.upsert({
      where: { key: 'pricing_tier_4' },
      update: {},
      create: {
        key: 'pricing_tier_4',
        value: JSON.stringify({ credits: '20+', price: 65, name: 'Champion' }),
        description: 'Champion pricing tier',
        category: 'pricing',
      },
    }),
  ])

  console.log('✅ Created business configurations:', businessConfigs.length)

  // DEVELOPMENT-ONLY DEMO DATA
  if (!isProduction) {
    console.log('🔧 Adding demo data for development...')
    
    const clientPassword = await bcrypt.hash('password123', 12)

    // Create demo client users (development only)
    const clientUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'demo.client1@harmonized.dev' },
        update: {},
        create: {
          email: 'demo.client1@harmonized.dev',
          name: 'Demo Client One',
          password: clientPassword,
          role: 'CLIENT',
          phone: '+1-555-0001',
          fitnessGoals: 'General fitness and strength training',
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'demo.client2@harmonized.dev' },
        update: {},
        create: {
          email: 'demo.client2@harmonized.dev',
          name: 'Demo Client Two',
          password: clientPassword,
          role: 'CLIENT',
          phone: '+1-555-0002',
          fitnessGoals: 'Weight loss and cardio improvement',
          isActive: true,
        },
      }),
    ])

    console.log('✅ Created demo client users:', clientUsers.map(u => u.email))

    // Create demo credit purchases (development only)
    const demoPurchases = await Promise.all([
      prisma.creditPurchase.create({
        data: {
          userId: clientUsers[0].id,
          credits: 5,
          amount: 400.00,
          status: 'COMPLETED',
          packageName: 'Development Test Package',
          pricePerCredit: 80.00,
          stripePaymentIntentId: 'pi_demo_dev_001',
        },
      }),
    ])

    console.log('✅ Created demo purchases:', demoPurchases.length)
  }

  console.log('🎉 Database seeding completed!')
  if (isProduction) {
    console.log('✅ Production database ready with minimal essential data')
  } else {
    console.log('✅ Development database ready with demo data')
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

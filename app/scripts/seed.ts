
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Hash passwords
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  const clientPassword = await bcrypt.hash('password123', 12)

  // Create admin user (required demo account)
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+1-555-0123',
      fitnessGoals: 'Help clients achieve their fitness goals',
      isActive: true,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create sample client users
  const clientUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@fitness.com' },
      update: {},
      create: {
        email: 'alice@fitness.com',
        name: 'Alice Johnson',
        password: clientPassword,
        role: 'CLIENT',
        phone: '+1-555-0124',
        fitnessGoals: 'Lose weight and build strength',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@fitness.com' },
      update: {},
      create: {
        email: 'bob@fitness.com',
        name: 'Bob Smith',
        password: clientPassword,
        role: 'CLIENT',
        phone: '+1-555-0125',
        fitnessGoals: 'Build muscle mass and improve endurance',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'carol@fitness.com' },
      update: {},
      create: {
        email: 'carol@fitness.com',
        name: 'Carol Williams',
        password: clientPassword,
        role: 'CLIENT',
        phone: '+1-555-0126',
        fitnessGoals: 'Improve flexibility and maintain fitness',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created client users:', clientUsers.map(u => u.email))

  // Create sample exercises
  const exercises = await Promise.all([
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

    // Shoulder exercises
    prisma.exercise.upsert({
      where: { id: 'shoulder-press' },
      update: {},
      create: {
        id: 'shoulder-press',
        name: 'Shoulder Press',
        description: 'Overhead pressing movement for shoulder development',
        instructions: 'Press weights from shoulder level to overhead, lower with control',
        category: 'Shoulders',
        muscleGroups: ['Shoulders', 'Triceps', 'Core'],
        equipment: 'Dumbbells or Barbell',
        imageUrl: 'https://i.ytimg.com/vi/vlFGTI5JzjI/maxresdefault.jpg',
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

    // Cardio exercises
    prisma.exercise.upsert({
      where: { id: 'burpees' },
      update: {},
      create: {
        id: 'burpees',
        name: 'Burpees',
        description: 'Full-body cardio and strength exercise',
        instructions: 'Drop to push-up, jump feet to chest, jump up with arms overhead',
        category: 'Cardio',
        muscleGroups: ['Full Body'],
        equipment: 'Bodyweight',
        imageUrl: 'https://i.ytimg.com/vi/mUYJqe_sJFE/maxresdefault.jpg',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created exercises:', exercises.length)

  // Create business configuration
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
        description: 'Saturday business hours (every other Saturday)',
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

  // Create sample credit purchases for clients
  const creditPurchases = await Promise.all([
    prisma.creditPurchase.create({
      data: {
        userId: clientUsers[0].id,
        credits: 10,
        amount: 800.00,
        status: 'COMPLETED',
        packageName: 'Regular Package',
        pricePerCredit: 80.00,
        stripePaymentIntentId: 'pi_sample_alice_001',
      },
    }),
    prisma.creditPurchase.create({
      data: {
        userId: clientUsers[1].id,
        credits: 5,
        amount: 400.00,
        status: 'COMPLETED',
        packageName: 'Regular Package',
        pricePerCredit: 80.00,
        stripePaymentIntentId: 'pi_sample_bob_001',
      },
    }),
    prisma.creditPurchase.create({
      data: {
        userId: clientUsers[2].id,
        credits: 15,
        amount: 1125.00,
        status: 'COMPLETED',
        packageName: 'Committed Package',
        pricePerCredit: 75.00,
        stripePaymentIntentId: 'pi_sample_carol_001',
      },
    }),
  ])

  console.log('✅ Created credit purchases:', creditPurchases.length)

  // Create sample bookings
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const bookings = await Promise.all([
    // Upcoming booking for Alice
    prisma.booking.create({
      data: {
        userId: clientUsers[0].id,
        startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
        status: 'CONFIRMED',
        notes: 'Focus on upper body strength training',
        creditsUsed: 1,
      },
    }),
    // Upcoming booking for Bob
    prisma.booking.create({
      data: {
        userId: clientUsers[1].id,
        startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
        status: 'CONFIRMED',
        notes: 'Leg day workout session',
        creditsUsed: 1,
      },
    }),
    // Future booking for Carol
    prisma.booking.create({
      data: {
        userId: clientUsers[2].id,
        startTime: new Date(nextWeek.setHours(11, 0, 0, 0)),
        endTime: new Date(nextWeek.setHours(12, 0, 0, 0)),
        status: 'CONFIRMED',
        notes: 'Full body strength and flexibility',
        creditsUsed: 1,
      },
    }),
  ])

  console.log('✅ Created bookings:', bookings.length)

  // Create sample workout sessions
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const workoutSessions = await Promise.all([
    prisma.workoutSession.create({
      data: {
        userId: clientUsers[0].id,
        date: yesterday,
        duration: 60,
        notes: 'Great upper body session, improved form on bench press',
        status: 'COMPLETED',
        exercises: {
          create: [
            {
              exerciseId: 'bench-press',
              sets: 4,
              reps: 8,
              weight: 135.0,
              order: 1,
              notes: 'Focused on form',
            },
            {
              exerciseId: 'push-ups',
              sets: 3,
              reps: 15,
              order: 2,
              notes: 'Burnout set',
            },
          ],
        },
      },
    }),
    prisma.workoutSession.create({
      data: {
        userId: clientUsers[1].id,
        date: yesterday,
        duration: 45,
        notes: 'Leg day focused on squats and lunges',
        status: 'COMPLETED',
        exercises: {
          create: [
            {
              exerciseId: 'squats',
              sets: 5,
              reps: 5,
              weight: 225.0,
              order: 1,
              notes: 'Personal record!',
            },
            {
              exerciseId: 'lunges',
              sets: 3,
              reps: 12,
              weight: 25.0,
              order: 2,
              notes: 'Each leg',
            },
          ],
        },
      },
    }),
  ])

  console.log('✅ Created workout sessions:', workoutSessions.length)

  // Create personal records
  const personalRecords = await Promise.all([
    prisma.personalRecord.upsert({
      where: {
        userId_exerciseId: {
          userId: clientUsers[0].id,
          exerciseId: 'bench-press',
        },
      },
      update: {},
      create: {
        userId: clientUsers[0].id,
        exerciseId: 'bench-press',
        weight: 135.0,
        reps: 8,
        volume: 1080.0, // 135 * 8
        notes: 'First time hitting 135 for 8 reps!',
      },
    }),
    prisma.personalRecord.upsert({
      where: {
        userId_exerciseId: {
          userId: clientUsers[1].id,
          exerciseId: 'squats',
        },
      },
      update: {},
      create: {
        userId: clientUsers[1].id,
        exerciseId: 'squats',
        weight: 225.0,
        reps: 5,
        volume: 1125.0, // 225 * 5
        notes: 'New squat PR!',
      },
    }),
    prisma.personalRecord.upsert({
      where: {
        userId_exerciseId: {
          userId: clientUsers[2].id,
          exerciseId: 'plank',
        },
      },
      update: {},
      create: {
        userId: clientUsers[2].id,
        exerciseId: 'plank',
        duration: 120, // 2 minutes
        notes: 'Held for 2 minutes straight!',
      },
    }),
  ])

  console.log('✅ Created personal records:', personalRecords.length)

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: clientUsers[0].id,
        type: 'PERSONAL_RECORD',
        title: 'New Personal Record! 🎉',
        message: 'Congratulations! You achieved a new PR on Bench Press: 135 lbs x 8 reps',
        isRead: false,
        metadata: {
          exerciseId: 'bench-press',
          weight: 135,
          reps: 8,
        },
      },
    }),
    prisma.notification.create({
      data: {
        userId: clientUsers[1].id,
        type: 'BOOKING_CONFIRMED',
        title: 'Session Confirmed',
        message: 'Your training session for tomorrow at 2:00 PM has been confirmed',
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: clientUsers[2].id,
        type: 'WELCOME',
        title: 'Welcome to Harmonized Fitness! 💪',
        message: 'We\'re excited to help you achieve your fitness goals',
        isRead: false,
      },
    }),
  ])

  console.log('✅ Created notifications:', notifications.length)

  // Set favorite exercises for clients
  await Promise.all([
    prisma.user.update({
      where: { id: clientUsers[0].id },
      data: {
        favoriteExercises: {
          connect: [
            { id: 'bench-press' },
            { id: 'push-ups' },
            { id: 'shoulder-press' },
          ],
        },
      },
    }),
    prisma.user.update({
      where: { id: clientUsers[1].id },
      data: {
        favoriteExercises: {
          connect: [
            { id: 'squats' },
            { id: 'deadlift' },
            { id: 'lunges' },
          ],
        },
      },
    }),
    prisma.user.update({
      where: { id: clientUsers[2].id },
      data: {
        favoriteExercises: {
          connect: [
            { id: 'plank' },
            { id: 'burpees' },
            { id: 'lunges' },
          ],
        },
      },
    }),
  ])

  console.log('✅ Set favorite exercises for clients')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`👤 Users: 1 admin + ${clientUsers.length} clients`)
  console.log(`💪 Exercises: ${exercises.length}`)
  console.log(`⚙️  Business configs: ${businessConfigs.length}`)
  console.log(`💳 Credit purchases: ${creditPurchases.length}`)
  console.log(`📅 Bookings: ${bookings.length}`)
  console.log(`🏋️  Workout sessions: ${workoutSessions.length}`)
  console.log(`🏆 Personal records: ${personalRecords.length}`)
  console.log(`🔔 Notifications: ${notifications.length}`)
  console.log('\n🔑 Demo Accounts:')
  console.log('Admin: john@doe.com / johndoe123')
  console.log('Client: alice@fitness.com / password123')
  console.log('Client: bob@fitness.com / password123')
  console.log('Client: carol@fitness.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

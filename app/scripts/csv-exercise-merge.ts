
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import csv from 'csv-parse'
import path from 'path'

const prisma = new PrismaClient()

interface CSVExercise {
  name: string
  classification: string
  equipment: string
  muscleGroup: string
  difficulty: string
  forceType: string
  isFavorite: string
  notes: string
  id: string
  createdAt: string
  updatedAt: string
}

interface ProcessedExercise {
  name: string
  category: string
  equipment?: string
  muscleGroups: string[]
  difficulty?: string
  forceType?: string
  isFavorite: boolean
  description?: string
  csvId?: string
  csvCreatedAt?: Date
  csvUpdatedAt?: Date
}

async function parseCSV(): Promise<CSVExercise[]> {
  const csvPath = path.join(process.cwd(), 'data', 'ExLibrary_Cleaned.csv')
  const fileContent = fs.readFileSync(csvPath, 'utf-8')
  
  return new Promise((resolve, reject) => {
    csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, (err, records) => {
      if (err) {
        reject(err)
      } else {
        resolve(records as CSVExercise[])
      }
    })
  })
}

function processCSVExercise(csvExercise: CSVExercise): ProcessedExercise {
  // Convert single muscle group to array and clean it up
  const muscleGroups = csvExercise.muscleGroup
    ? [csvExercise.muscleGroup.trim()]
    : ['General']

  // Parse dates if provided
  let csvCreatedAt: Date | undefined
  let csvUpdatedAt: Date | undefined
  
  try {
    if (csvExercise.createdAt) {
      csvCreatedAt = new Date(csvExercise.createdAt)
    }
    if (csvExercise.updatedAt) {
      csvUpdatedAt = new Date(csvExercise.updatedAt)
    }
  } catch (error) {
    console.warn(`Invalid date format for exercise ${csvExercise.name}`)
  }

  return {
    name: csvExercise.name.trim(),
    category: csvExercise.classification.trim().toLowerCase(),
    equipment: csvExercise.equipment?.trim() || undefined,
    muscleGroups,
    difficulty: csvExercise.difficulty?.trim()?.toLowerCase() || undefined,
    forceType: csvExercise.forceType?.trim()?.toLowerCase() || undefined,
    isFavorite: csvExercise.isFavorite?.toLowerCase() === 'true',
    description: csvExercise.notes?.trim() || undefined,
    csvId: csvExercise.id?.trim() || undefined,
    csvCreatedAt,
    csvUpdatedAt
  }
}

async function mergeExercises() {
  console.log('🔍 Starting Exercise Library CSV Integration...')
  
  try {
    // 1. Parse CSV data
    console.log('📖 Reading CSV file...')
    const csvExercises = await parseCSV()
    console.log(`Found ${csvExercises.length} exercises in CSV`)

    // 2. Get existing exercises from database
    console.log('🔍 Checking existing exercises in database...')
    const existingExercises = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        isActive: true
      }
    })
    console.log(`Found ${existingExercises.length} existing exercises in database`)

    // 3. Process CSV exercises and identify conflicts
    const processedExercises = csvExercises.map(processCSVExercise)
    
    // Create a map of existing exercise names (case-insensitive)
    const existingNamesMap = new Map<string, string>()
    existingExercises.forEach(ex => {
      existingNamesMap.set(ex.name.toLowerCase(), ex.id)
    })

    // 4. Categorize exercises: new vs existing
    const newExercises: ProcessedExercise[] = []
    const conflictingExercises: { csv: ProcessedExercise, dbId: string }[] = []

    processedExercises.forEach(csvEx => {
      const existingId = existingNamesMap.get(csvEx.name.toLowerCase())
      if (existingId) {
        conflictingExercises.push({ csv: csvEx, dbId: existingId })
      } else {
        newExercises.push(csvEx)
      }
    })

    console.log(`📊 Analysis complete:`)
    console.log(`  - New exercises to add: ${newExercises.length}`)
    console.log(`  - Conflicting exercises (will update): ${conflictingExercises.length}`)
    console.log(`  - Existing exercises to preserve: ${existingExercises.length - conflictingExercises.length}`)

    // 5. Add new exercises
    console.log('➕ Adding new exercises...')
    let addedCount = 0
    
    for (const exercise of newExercises) {
      try {
        const createData: any = {
          name: exercise.name,
          category: exercise.category,
          muscleGroups: exercise.muscleGroups,
          isFavorite: exercise.isFavorite,
        }

        // Add optional fields if they exist
        if (exercise.equipment) createData.equipment = exercise.equipment
        if (exercise.difficulty) createData.difficulty = exercise.difficulty
        if (exercise.forceType) createData.forceType = exercise.forceType
        if (exercise.description) createData.description = exercise.description

        // Use CSV timestamps if available
        if (exercise.csvCreatedAt) createData.createdAt = exercise.csvCreatedAt
        if (exercise.csvUpdatedAt) createData.updatedAt = exercise.csvUpdatedAt

        await prisma.exercise.create({ data: createData })
        addedCount++
      } catch (error) {
        console.error(`Failed to add exercise "${exercise.name}":`, error)
      }
    }

    // 6. Update conflicting exercises with new data
    console.log('🔄 Updating existing exercises with CSV data...')
    let updatedCount = 0

    for (const { csv, dbId } of conflictingExercises) {
      try {
        const updateData: any = {
          category: csv.category,
          muscleGroups: csv.muscleGroups,
          isFavorite: csv.isFavorite,
        }

        // Add optional fields if they exist
        if (csv.equipment) updateData.equipment = csv.equipment
        if (csv.difficulty) updateData.difficulty = csv.difficulty
        if (csv.forceType) updateData.forceType = csv.forceType
        if (csv.description) updateData.description = csv.description

        // Update timestamp
        updateData.updatedAt = new Date()

        await prisma.exercise.update({
          where: { id: dbId },
          data: updateData
        })
        updatedCount++
      } catch (error) {
        console.error(`Failed to update exercise "${csv.name}":`, error)
      }
    }

    // 7. Final verification
    const finalCount = await prisma.exercise.count({ where: { isActive: true } })
    
    console.log('\n✅ CSV Integration Complete!')
    console.log(`📊 Final Statistics:`)
    console.log(`  - New exercises added: ${addedCount}`)
    console.log(`  - Exercises updated: ${updatedCount}`)
    console.log(`  - Total active exercises: ${finalCount}`)
    console.log(`  - Data preservation: ✅ All existing exercises preserved`)

    // 8. Show favorites summary
    const favoritesCount = await prisma.exercise.count({ 
      where: { isActive: true, isFavorite: true } 
    })
    console.log(`  - Exercises marked as favorites: ${favoritesCount}`)

  } catch (error) {
    console.error('❌ Error during CSV integration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the merge
if (require.main === module) {
  mergeExercises()
    .then(() => {
      console.log('🎉 Exercise library integration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Integration failed:', error)
      process.exit(1)
    })
}

export { mergeExercises }

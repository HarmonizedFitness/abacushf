
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
const csv = require('csv-parser')

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
  description: string | null
  instructions: string | null
  category: string
  muscleGroups: string[]
  equipment: string | null
  difficulty: string | null
  forceType: string | null
  isFavorite: boolean
  imageUrl: string | null
  videoUrl: string | null
  isActive: boolean
}

// Logging functions
const log = {
  info: (message: string) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message: string) => console.log(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message: string) => console.log(`[ERROR] ${new Date().toISOString()} - ${message}`),
  success: (message: string) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`)
}

// Parse CSV with proper handling of quoted fields
function parseCSVFile(csvPath: string): Promise<CSVExercise[]> {
  return new Promise((resolve, reject) => {
    const exercises: CSVExercise[] = []
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data: any) => {
        exercises.push(data as CSVExercise)
      })
      .on('end', () => {
        resolve(exercises)
      })
      .on('error', (error: any) => {
        reject(error)
      })
  })
}

// Field mapping and validation
function processExercise(csvExercise: CSVExercise): ProcessedExercise | null {
  try {
    // Validate required fields
    if (!csvExercise.name || !csvExercise.classification) {
      log.warn(`Skipping exercise with missing name or classification: ${csvExercise.name}`)
      return null
    }

    // Handle muscle group conversion (singular to array)
    const muscleGroups = csvExercise.muscleGroup 
      ? [csvExercise.muscleGroup.trim()]
      : ['Unknown']

    // Convert isFavorite string to boolean
    const isFavorite = csvExercise.isFavorite?.toLowerCase() === 'true'

    // Clean and normalize text fields
    const cleanText = (text: string | undefined | null): string | null => {
      if (!text) return null
      return text.trim() || null
    }

    // Map fields according to schema
    const processed: ProcessedExercise = {
      name: csvExercise.name.trim(),
      description: cleanText(csvExercise.notes),
      instructions: cleanText(csvExercise.notes), // Use notes for both description and instructions
      category: csvExercise.classification?.trim() || 'Other',
      muscleGroups: muscleGroups,
      equipment: cleanText(csvExercise.equipment),
      difficulty: cleanText(csvExercise.difficulty),
      forceType: cleanText(csvExercise.forceType),
      isFavorite: isFavorite,
      imageUrl: null, // Not in CSV
      videoUrl: null, // Not in CSV
      isActive: true
    }

    return processed
  } catch (error) {
    log.error(`Error processing exercise ${csvExercise.name}: ${error}`)
    return null
  }
}

async function safeDeleteAllExercises(): Promise<number> {
  log.info('Starting safe deletion of all exercises...')
  
  try {
    // Check for dependencies
    const workoutUsage = await prisma.workoutExercise.count()
    const prUsage = await prisma.personalRecord.count()
    
    if (workoutUsage > 0 || prUsage > 0) {
      log.error(`Cannot delete exercises: ${workoutUsage} workout usages, ${prUsage} personal records exist`)
      throw new Error('Cannot proceed with deletion - exercises are in use')
    }

    // Get current count for logging
    const currentCount = await prisma.exercise.count()
    log.info(`Found ${currentCount} exercises to delete`)

    // Delete all exercises in a transaction
    const result = await prisma.exercise.deleteMany({})
    
    log.success(`Successfully deleted ${result.count} exercises`)
    return result.count
  } catch (error) {
    log.error(`Failed to delete exercises: ${error}`)
    throw error
  }
}

async function importCSVExercises(csvPath: string): Promise<number> {
  log.info(`Starting CSV import from: ${csvPath}`)
  
  try {
    // Parse CSV using proper CSV parser
    const csvExercises = await parseCSVFile(csvPath)
    log.info(`Parsed ${csvExercises.length} exercises from CSV`)

    // Process and validate exercises
    const processedExercises: ProcessedExercise[] = []
    let skipped = 0

    for (const csvExercise of csvExercises) {
      const processed = processExercise(csvExercise)
      if (processed) {
        processedExercises.push(processed)
      } else {
        skipped++
      }
    }

    log.info(`Processed ${processedExercises.length} valid exercises, skipped ${skipped}`)

    // Remove duplicates by name (case-insensitive)
    const uniqueExercises = processedExercises.filter((exercise, index, array) => {
      const firstIndex = array.findIndex(e => 
        e.name.toLowerCase() === exercise.name.toLowerCase()
      )
      if (firstIndex !== index) {
        log.warn(`Duplicate exercise found: ${exercise.name}, keeping first occurrence`)
        return false
      }
      return true
    })

    log.info(`Removed duplicates, importing ${uniqueExercises.length} unique exercises`)

    // Import in batches for better performance
    const batchSize = 50
    let imported = 0

    for (let i = 0; i < uniqueExercises.length; i += batchSize) {
      const batch = uniqueExercises.slice(i, i + batchSize)
      
      await prisma.exercise.createMany({
        data: batch,
        skipDuplicates: true
      })
      
      imported += batch.length
      log.info(`Imported batch ${Math.floor(i / batchSize) + 1}: ${imported}/${uniqueExercises.length} exercises`)
    }

    log.success(`Successfully imported ${imported} exercises`)
    return imported
  } catch (error) {
    log.error(`Failed to import CSV exercises: ${error}`)
    throw error
  }
}

async function validateImport(): Promise<void> {
  log.info('Validating import results...')
  
  try {
    const totalCount = await prisma.exercise.count()
    const activeCount = await prisma.exercise.count({ where: { isActive: true } })
    const favoritesCount = await prisma.exercise.count({ where: { isFavorite: true } })
    
    // Get sample exercises with different characteristics
    const sampleExercises = await prisma.exercise.findMany({
      take: 5,
      select: {
        name: true,
        category: true,
        muscleGroups: true,
        equipment: true,
        difficulty: true,
        forceType: true,
        isFavorite: true,
        description: true
      }
    })

    // Get field statistics
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

    const equipmentStats = await prisma.exercise.groupBy({
      by: ['equipment'],
      _count: { equipment: true },
      where: { equipment: { not: null } }
    })

    log.success('=== IMPORT VALIDATION RESULTS ===')
    log.info(`Total exercises: ${totalCount}`)
    log.info(`Active exercises: ${activeCount}`)
    log.info(`Favorite exercises: ${favoritesCount}`)
    
    log.info('\nSample exercises:')
    sampleExercises.forEach((ex, index) => {
      log.info(`  ${index + 1}. ${ex.name} (${ex.category})`)
      log.info(`     - Equipment: ${ex.equipment || 'None'}`)
      log.info(`     - Difficulty: ${ex.difficulty || 'Not specified'}`)
      log.info(`     - Force Type: ${ex.forceType || 'Not specified'}`)
      log.info(`     - Muscle Groups: ${ex.muscleGroups.join(', ')}`)
      log.info(`     - Favorite: ${ex.isFavorite}`)
      log.info(`     - Description: ${ex.description ? ex.description.substring(0, 100) + '...' : 'None'}`)
      log.info('')
    })

    log.info('Field Statistics:')
    log.info(`\nDifficulty distribution (${difficultyStats.length} unique values):`)
    difficultyStats.forEach(stat => {
      log.info(`  - ${stat.difficulty}: ${stat._count.difficulty} exercises`)
    })

    log.info(`\nForce type distribution (${forceTypeStats.length} unique values):`)
    forceTypeStats.forEach(stat => {
      log.info(`  - ${stat.forceType}: ${stat._count.forceType} exercises`)
    })

    log.info(`\nCategory distribution (${categoryStats.length} unique values):`)
    categoryStats.forEach(stat => {
      log.info(`  - ${stat.category}: ${stat._count.category} exercises`)
    })

    log.info(`\nEquipment distribution (${equipmentStats.length} unique values):`)
    equipmentStats.slice(0, 10).forEach(stat => { // Show top 10
      log.info(`  - ${stat.equipment}: ${stat._count.equipment} exercises`)
    })

    log.success('Import validation completed successfully')
    
    // Additional data quality checks
    const exercisesWithoutDescription = await prisma.exercise.count({
      where: { description: null }
    })
    
    const exercisesWithoutMuscleGroups = await prisma.exercise.count({
      where: { muscleGroups: { isEmpty: true } }
    })

    log.info('\nData Quality Metrics:')
    log.info(`- Exercises without description: ${exercisesWithoutDescription}`)
    log.info(`- Exercises without muscle groups: ${exercisesWithoutMuscleGroups}`)
    log.info(`- Data completeness: ${((totalCount - exercisesWithoutDescription) / totalCount * 100).toFixed(1)}%`)

  } catch (error) {
    log.error(`Validation failed: ${error}`)
    throw error
  }
}

async function main() {
  const csvPath = path.join(process.cwd(), 'data', 'ExLibrary_Cleaned.csv')
  
  log.info('=== STARTING COMPLETE EXERCISE LIBRARY REPLACEMENT V2 ===')
  log.info(`CSV file: ${csvPath}`)
  
  try {
    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`)
    }

    // Phase 1: Safe deletion of all exercises
    const deletedCount = await safeDeleteAllExercises()
    
    // Phase 2: Import CSV exercises
    const importedCount = await importCSVExercises(csvPath)
    
    // Phase 3: Validate import
    await validateImport()
    
    log.success('=== EXERCISE LIBRARY REPLACEMENT COMPLETED SUCCESSFULLY ===')
    log.success(`Deleted: ${deletedCount} exercises`)
    log.success(`Imported: ${importedCount} exercises`)
    
  } catch (error) {
    log.error(`Exercise library replacement failed: ${error}`)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Export for testing
export { processExercise, parseCSVFile }

// Run if called directly
if (require.main === module) {
  main()
}

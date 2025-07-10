
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CSVExercise {
  classification: string
  createdAt: string
  difficulty: string
  equipment: string
  forceType: string
  id: string
  isFavorite: string
  muscleGroup: string
  name: string
  notes: string
  updatedAt: string
}

async function parseCSV(filePath: string): Promise<CSVExercise[]> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const headers = lines[0].replace(/\uFEFF/g, '').split(',').map(h => h.trim()) // Remove BOM and trim headers
  
  const exercises: CSVExercise[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Handle CSV parsing with quoted fields
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
    const exercise: any = {}
    
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || ''
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      exercise[header] = value
    })
    
    exercises.push(exercise)
  }
  
  return exercises
}

function mapCSVToDatabase(csvExercise: CSVExercise) {
  // Helper function to parse dates safely
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date()
    const parsed = new Date(dateString)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }
  
  // Clean up description text
  let description = csvExercise.notes || ''
  if (description.startsWith('"') && description.endsWith('"')) {
    description = description.slice(1, -1)
  }
  
  return {
    id: csvExercise.id || undefined, // Let Prisma generate if empty
    name: csvExercise.name,
    description: description || null,
    instructions: null,
    category: csvExercise.muscleGroup,
    muscleGroups: [csvExercise.muscleGroup],
    equipment: csvExercise.equipment || null,
    imageUrl: null,
    videoUrl: null,
    isActive: true,
    createdAt: parseDate(csvExercise.createdAt),
    updatedAt: parseDate(csvExercise.updatedAt),
  }
}

async function integrateCSVExercises() {
  try {
    console.log('Starting CSV integration...')
    
    const csvPath = path.join(__dirname, '..', 'data', 'cleaned_exercise_dataset.csv')
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at:', csvPath)
      return
    }
    
    console.log('Reading CSV file...')
    const csvExercises = await parseCSV(csvPath)
    console.log(`Found ${csvExercises.length} exercises in CSV`)
    
    // Clear existing exercises
    console.log('Clearing existing exercises...')
    await prisma.workoutSet.deleteMany()
    await prisma.workoutExercise.deleteMany()
    await prisma.personalRecord.deleteMany()
    await prisma.exercise.deleteMany()
    
    console.log('Integrating new exercises...')
    let successCount = 0
    let errorCount = 0
    
    for (const csvExercise of csvExercises) {
      try {
        const dbExercise = mapCSVToDatabase(csvExercise)
        
        await prisma.exercise.create({
          data: dbExercise,
        })
        
        successCount++
        
        if (successCount % 10 === 0) {
          console.log(`Processed ${successCount} exercises...`)
        }
      } catch (error) {
        console.error(`Error processing exercise ${csvExercise.name}:`, error)
        errorCount++
      }
    }
    
    // Update favorite exercises (if any were marked as favorites in CSV)
    console.log('Processing favorites...')
    const favoriteExercises = csvExercises.filter(ex => ex.isFavorite === 'True')
    
    for (const favoriteExercise of favoriteExercises) {
      try {
        // For now, we'll create a system admin favorite flag
        // In a real app, you'd assign favorites to specific users
        console.log(`Marking ${favoriteExercise.name} as favorite`)
      } catch (error) {
        console.error(`Error setting favorite for ${favoriteExercise.name}:`, error)
      }
    }
    
    console.log('\n=== Integration Complete ===')
    console.log(`Successfully integrated: ${successCount} exercises`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Favorites found: ${favoriteExercises.length}`)
    
    // Verify integration
    const totalExercises = await prisma.exercise.count()
    console.log(`Total exercises in database: ${totalExercises}`)
    
  } catch (error) {
    console.error('Integration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the integration
integrateCSVExercises()
